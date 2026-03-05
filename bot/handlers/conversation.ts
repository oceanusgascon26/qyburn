/**
 * Enhanced Conversation Handler
 *
 * Integrates the full pipeline:
 *   User message
 *     -> detectIntent
 *     -> getMemoryContext
 *     -> buildRagContext
 *     -> Build enhanced prompt (system + RAG + memory + user message)
 *     -> Call AI with structured output instructions
 *     -> parseStructuredResponse
 *     -> calculateConfidence
 *     -> If shouldEscalate: notify IT admin
 *     -> recordQuestion + recordRequest
 *     -> Return formatted response with confidence indicator
 */

import { aiClient } from "../../src/lib/stubs/anthropic";
import { graphClient } from "../../src/lib/stubs/graph";
import { slackClient } from "../../src/lib/stubs/slack";
import { createAuditLog } from "../../src/lib/mock-data";

// Pipeline modules
import { indexKnowledgeBase, buildRagContext } from "../lib/rag-pipeline";
import {
  getMemory,
  updateMemory,
  getMemoryContext,
  recordQuestion,
  recordRequest,
} from "../lib/conversation-memory";
import {
  calculateConfidence,
  formatConfidenceForSlack,
  type ConfidenceResult,
  type SlackConfidenceBlock,
} from "../lib/confidence-scoring";
import {
  STRUCTURED_SYSTEM_PROMPT,
  parseStructuredResponse,
  executeAction,
  type BotAction,
} from "../lib/structured-output";
import { detectIntent, suggestClarification, type DetectedIntent } from "../lib/intent-detector";

// ─── Types ───────────────────────────────────────────────────

export interface ConversationResult {
  response: string;
  intent: string;
  resolved: boolean;
  action?: BotAction;
  confidence?: ConfidenceResult;
  confidenceBlocks?: SlackConfidenceBlock[];
  detectedIntent?: DetectedIntent;
  clarification?: string | null;
}

// ─── Initialization ──────────────────────────────────────────

let kbIndexed = false;

function ensureKBIndexed(): void {
  if (!kbIndexed) {
    indexKnowledgeBase();
    kbIndexed = true;
  }
}

// ─── Main Handler ────────────────────────────────────────────

export async function handleConversation(
  userEmail: string,
  message: string,
  channel?: string
): Promise<ConversationResult> {
  try {
    return await processConversation(userEmail, message, channel);
  } catch (error) {
    console.error("[CONVERSATION] Error processing message:", error);
    return buildFallbackResponse(userEmail, message, channel);
  }
}

async function processConversation(
  userEmail: string,
  message: string,
  channel?: string
): Promise<ConversationResult> {
  // Ensure KB is indexed
  ensureKBIndexed();

  // ── Step 1: Detect intent ───────────────────────────────
  const detectedIntent = detectIntent(message);
  console.log(
    `[CONVERSATION] Intent: ${detectedIntent.intent} ` +
    `(confidence: ${detectedIntent.confidence.toFixed(2)}, ` +
    `entities: ${JSON.stringify(detectedIntent.entities)})`
  );

  // Check if clarification is needed
  const clarification = suggestClarification(detectedIntent);
  if (clarification && detectedIntent.confidence < 0.4) {
    // Very low confidence — ask for clarification instead of guessing
    recordQuestion(userEmail, message, detectedIntent.intent);
    return {
      response: clarification,
      intent: detectedIntent.intent,
      resolved: false,
      detectedIntent,
      clarification,
    };
  }

  // ── Step 2: Get user memory context ─────────────────────
  const user = await graphClient.getUserByEmail(userEmail);
  if (user) {
    updateMemory(userEmail, {
      email: user.mail,
      department: user.department ?? undefined,
    });
  }
  const memoryContext = getMemoryContext(userEmail);
  const memory = getMemory(userEmail);

  // ── Step 3: Build RAG context ───────────────────────────
  const ragContext = buildRagContext(message);
  const ragHitCount = ragContext ? (ragContext.match(/\[.*?\]/g) ?? []).length : 0;

  // ── Step 4: Build enhanced prompt ───────────────────────
  const userContextStr = user
    ? `\nUser: ${user.displayName} (${user.mail}), ${user.jobTitle ?? "Unknown role"}, ${user.department ?? "Unknown dept"}`
    : `\nUser: ${userEmail}`;

  const promptParts: string[] = [STRUCTURED_SYSTEM_PROMPT];

  if (ragContext) {
    promptParts.push(ragContext);
  }
  if (memoryContext) {
    promptParts.push(memoryContext);
  }
  promptParts.push(userContextStr);

  const fullSystemPrompt = promptParts.join("\n\n");

  // ── Step 5: Call AI ─────────────────────────────────────
  const aiResponse = await aiClient.chat(
    [{ role: "user", content: message }],
    fullSystemPrompt
  );

  // ── Step 6: Parse structured response ───────────────────
  const botAction = parseStructuredResponse(aiResponse);

  // ── Step 7: Execute action ──────────────────────────────
  const actionResponse = await executeAction(botAction, userEmail);

  // ── Step 8: Calculate confidence ────────────────────────
  const confidenceResult = calculateConfidence(actionResponse, {
    intent: detectedIntent.intent,
    ragHits: ragHitCount,
    userMemoryDepth: memory.interactionCount,
    queryLength: message.length,
  });

  console.log(
    `[CONVERSATION] Confidence: ${confidenceResult.score}% ` +
    `(${confidenceResult.level}, escalate: ${confidenceResult.shouldEscalate})`
  );

  // ── Step 9: Escalate if needed ──────────────────────────
  if (confidenceResult.shouldEscalate) {
    await slackClient.postMessage(
      "#it-admin",
      `:rotating_light: *Low-confidence response — may need human follow-up*\n` +
      `User: ${userEmail}\n` +
      `Channel: ${channel ?? "DM"}\n` +
      `Message: ${message}\n` +
      `Intent: ${detectedIntent.intent} (${(detectedIntent.confidence * 100).toFixed(0)}%)\n` +
      `Confidence: ${confidenceResult.score}%\n` +
      `Action: ${botAction.action}`
    );
  }

  // ── Step 10: Record in memory ───────────────────────────
  recordQuestion(userEmail, message, detectedIntent.intent);

  if (botAction.action === "request_license" || botAction.action === "request_group") {
    const target =
      (botAction.parameters.software as string) ??
      (botAction.parameters.group as string) ??
      botAction.action;
    recordRequest(userEmail, botAction.action, target, "submitted");
  }

  // ── Step 11: Audit log ──────────────────────────────────
  createAuditLog({
    actor: "qyburn-bot",
    action: "kb.query",
    target: detectedIntent.intent,
    targetId: null,
    details: JSON.stringify({
      user: userEmail,
      query: message.slice(0, 200),
      intent: detectedIntent.intent,
      intentConfidence: detectedIntent.confidence,
      botAction: botAction.action,
      confidenceScore: confidenceResult.score,
      confidenceLevel: confidenceResult.level,
      ragHits: ragHitCount,
      resolved: !confidenceResult.shouldEscalate,
    }),
    channel: channel ?? null,
  });

  // ── Step 12: Format confidence blocks for Slack ─────────
  const confidenceBlocks = formatConfidenceForSlack(confidenceResult);

  // Build final response — include clarification hint if medium confidence
  let finalResponse = actionResponse;
  if (clarification && confidenceResult.level === "medium") {
    finalResponse += `\n\n_${clarification}_`;
  }

  // Append next steps if any
  if (botAction.nextSteps.length > 0) {
    const stepsStr = botAction.nextSteps.map((s) => `- ${s}`).join("\n");
    finalResponse += `\n\n*Next steps:*\n${stepsStr}`;
  }

  return {
    response: finalResponse,
    intent: detectedIntent.intent,
    resolved: !confidenceResult.shouldEscalate,
    action: botAction,
    confidence: confidenceResult,
    confidenceBlocks,
    detectedIntent,
    clarification,
  };
}

// ─── Fallback ────────────────────────────────────────────────

function buildFallbackResponse(
  userEmail: string,
  message: string,
  channel?: string
): ConversationResult {
  const fallbackText =
    "I'm sorry, I encountered an issue processing your request. " +
    "Please try again, or contact IT directly:\n" +
    "- Email: it-support@sagadiagnostics.com\n" +
    "- Service desk: https://saga-diagnostics.atlassian.net/servicedesk";

  // Still log the failed attempt
  createAuditLog({
    actor: "qyburn-bot",
    action: "kb.query.error",
    target: "error",
    targetId: null,
    details: JSON.stringify({
      user: userEmail,
      query: message.slice(0, 200),
      error: "Pipeline processing error",
    }),
    channel: channel ?? null,
  });

  return {
    response: fallbackText,
    intent: "error",
    resolved: false,
  };
}
