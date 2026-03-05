/**
 * Enhanced Conversation Handler — Year 1 Q2
 *
 * Integrates the full pipeline with multi-turn conversation management,
 * slot filling, sentiment detection, and analytics:
 *
 *   User message
 *     -> getOrCreateConversation (multi-turn state)
 *     -> If awaiting slot, try to extract slot value
 *     -> If slots complete, proceed to action
 *     -> detectIntent
 *     -> detectSentiment (escalate if needed)
 *     -> getMemoryContext
 *     -> buildRagContext
 *     -> Build enhanced prompt (system + RAG + memory + history + user message)
 *     -> Call AI with structured output instructions
 *     -> parseStructuredResponse
 *     -> calculateConfidence
 *     -> Check for slot filling needs
 *     -> If shouldEscalate: notify IT admin
 *     -> recordQuestion + recordRequest + recordConversation (analytics)
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

// Q2 modules
import {
  getOrCreateConversation,
  addMessage,
  getConversationHistory,
  resolveConversation,
  escalateConversation,
  type ConversationState,
} from "../lib/multi-turn";
import {
  checkSlots,
  extractSlotFromMessage,
  mapIntentToSlotIntent,
  type SlotCheckResult,
} from "../lib/slot-filler";
import {
  detectSentiment,
  formatSentimentAlert,
  type SentimentResult,
} from "../lib/sentiment-detector";
import {
  recordConversation as recordAnalytics,
  recordKnowledgeGap,
} from "../lib/analytics";

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
  conversationId?: string;
  sentiment?: SentimentResult;
  slotCheck?: SlotCheckResult;
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
  channel?: string,
  threadTs?: string
): Promise<ConversationResult> {
  try {
    return await processConversation(userEmail, message, channel, threadTs);
  } catch (error) {
    console.error("[CONVERSATION] Error processing message:", error);
    return buildFallbackResponse(userEmail, message, channel);
  }
}

/**
 * Handle a thumbs-up / thumbs-down reaction for feedback.
 */
export async function handleReaction(
  conversationId: string,
  reaction: string,
  userEmail: string
): Promise<void> {
  const isPositive = ["thumbsup", "+1", "white_check_mark", "heavy_check_mark"].includes(reaction);
  const isNegative = ["thumbsdown", "-1", "x", "negative_squared_cross_mark"].includes(reaction);

  if (!isPositive && !isNegative) return;

  const satisfaction = isPositive ? 5 : 1;

  resolveConversation(conversationId, satisfaction);

  console.log(
    `[CONVERSATION] Reaction feedback: ${reaction} (${isPositive ? "positive" : "negative"}) ` +
    `from ${userEmail} on conversation ${conversationId}`
  );
}

// ─── Core Processing ─────────────────────────────────────────

async function processConversation(
  userEmail: string,
  message: string,
  channel?: string,
  threadTs?: string
): Promise<ConversationResult> {
  const startTime = Date.now();

  // Ensure KB is indexed
  ensureKBIndexed();

  // ── Step 0: Get or create conversation state ──────────
  const convState = getOrCreateConversation(userEmail, threadTs, {
    channel,
    userEmail,
  });
  const conversationId = convState.id;

  // Add user message to conversation
  addMessage(conversationId, "user", message);

  // ── Step 0b: Check if we're in slot-filling mode ──────
  const slotResult = await trySlotFilling(convState, message);
  if (slotResult) {
    const latencyMs = Date.now() - startTime;
    addMessage(conversationId, "assistant", slotResult.response, {
      latencyMs,
    });
    return slotResult;
  }

  // ── Step 1: Detect intent ───────────────────────────────
  const detectedIntent = detectIntent(message);
  convState.currentIntent = detectedIntent.intent;

  console.log(
    `[CONVERSATION] Intent: ${detectedIntent.intent} ` +
    `(confidence: ${detectedIntent.confidence.toFixed(2)}, ` +
    `entities: ${JSON.stringify(detectedIntent.entities)})`
  );

  // ── Step 1b: Detect sentiment ──────────────────────────
  const userMessages = convState.messages
    .filter((m) => m.role === "user")
    .map((m) => m.content);
  const sentiment = detectSentiment(message, userMessages.slice(0, -1));

  console.log(
    `[CONVERSATION] Sentiment: ${sentiment.label} ` +
    `(score: ${sentiment.score.toFixed(2)}, urgency: ${sentiment.urgencyLevel})`
  );

  // Auto-escalate on severe sentiment
  if (sentiment.shouldEscalate) {
    const alert = formatSentimentAlert(sentiment, userEmail);
    await slackClient.postMessage("#it-admin", alert.text);
    await escalateConversation(conversationId, `Sentiment: ${sentiment.label}`);
  }

  // Check if clarification is needed
  const clarification = suggestClarification(detectedIntent);
  if (clarification && detectedIntent.confidence < 0.4) {
    // Very low confidence — ask for clarification instead of guessing
    recordQuestion(userEmail, message, detectedIntent.intent);
    recordKnowledgeGap(message, detectedIntent.intent);

    const response = clarification;
    addMessage(conversationId, "assistant", response, {
      intent: detectedIntent.intent,
      confidence: detectedIntent.confidence,
      latencyMs: Date.now() - startTime,
    });

    return {
      response,
      intent: detectedIntent.intent,
      resolved: false,
      detectedIntent,
      clarification,
      conversationId,
      sentiment,
    };
  }

  // ── Step 1c: Check for slot filling ────────────────────
  const slotIntent = mapIntentToSlotIntent(detectedIntent.intent);
  if (slotIntent) {
    // Pre-fill slots from intent entities
    const slots: Record<string, unknown> = { ...convState.slots };
    if (detectedIntent.entities.software) {
      slots.licenseName = detectedIntent.entities.software;
    }
    if (detectedIntent.entities.group) {
      slots.groupName = detectedIntent.entities.group;
    }
    if (detectedIntent.entities.email) {
      slots.userEmail = detectedIntent.entities.email;
    }
    if (detectedIntent.entities.department) {
      slots.department = detectedIntent.entities.department;
    }
    convState.slots = slots;

    const slotCheck = checkSlots(slotIntent, slots);
    if (!slotCheck.complete) {
      // Need more info — ask for the next slot
      convState.awaitingSlot = slotCheck.missingSlots[0]?.name;
      convState.context.slotIntent = slotIntent;

      const response = slotCheck.nextPrompt;
      const latencyMs = Date.now() - startTime;
      addMessage(conversationId, "assistant", response, {
        intent: detectedIntent.intent,
        confidence: detectedIntent.confidence,
        latencyMs,
      });

      return {
        response,
        intent: detectedIntent.intent,
        resolved: false,
        detectedIntent,
        conversationId,
        sentiment,
        slotCheck,
      };
    }
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

  // ── Step 5: Call AI (with conversation history) ─────────
  const history = getConversationHistory(conversationId, 10);
  // Build messages array: history + current message
  const aiMessages = history.length > 1
    ? history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
    : [{ role: "user" as const, content: message }];

  const aiResponse = await aiClient.chat(aiMessages, fullSystemPrompt);

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
  const shouldEscalate = confidenceResult.shouldEscalate || sentiment.shouldEscalate;

  if (confidenceResult.shouldEscalate) {
    await slackClient.postMessage(
      "#it-admin",
      `:rotating_light: *Low-confidence response — may need human follow-up*\n` +
      `User: ${userEmail}\n` +
      `Channel: ${channel ?? "DM"}\n` +
      `Message: ${message}\n` +
      `Intent: ${detectedIntent.intent} (${(detectedIntent.confidence * 100).toFixed(0)}%)\n` +
      `Confidence: ${confidenceResult.score}%\n` +
      `Sentiment: ${sentiment.label} (${sentiment.urgencyLevel})\n` +
      `Action: ${botAction.action}`
    );

    if (!sentiment.shouldEscalate) {
      await escalateConversation(conversationId, "Low confidence");
    }
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

  // Record low-confidence as knowledge gap
  if (confidenceResult.score < 40) {
    recordKnowledgeGap(message, detectedIntent.intent);
  }

  // ── Step 11: Audit log ──────────────────────────────────
  const latencyMs = Date.now() - startTime;

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
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
      ragHits: ragHitCount,
      resolved: !shouldEscalate,
      conversationId,
      turns: convState.messages.length,
      latencyMs,
    }),
    channel: channel ?? null,
  });

  // ── Step 11b: Record analytics ──────────────────────────
  const resolved = !shouldEscalate;
  recordAnalytics({
    userId: userEmail,
    intent: detectedIntent.intent,
    confidence: detectedIntent.confidence,
    resolved,
    escalated: shouldEscalate,
    turns: convState.messages.length,
    latencyMs,
  });

  if (resolved) {
    resolveConversation(conversationId);
  }

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

  // Add response to conversation
  addMessage(conversationId, "assistant", finalResponse, {
    intent: detectedIntent.intent,
    confidence: detectedIntent.confidence,
    actionTaken: botAction.action,
    latencyMs,
  });

  return {
    response: finalResponse,
    intent: detectedIntent.intent,
    resolved,
    action: botAction,
    confidence: confidenceResult,
    confidenceBlocks,
    detectedIntent,
    clarification,
    conversationId,
    sentiment,
  };
}

// ─── Slot Filling (mid-conversation) ─────────────────────────

async function trySlotFilling(
  convState: ConversationState,
  message: string
): Promise<ConversationResult | null> {
  if (!convState.awaitingSlot || !convState.context.slotIntent) {
    return null;
  }

  const slotIntent = convState.context.slotIntent as string;
  const { INTENT_SLOTS } = await import("../lib/slot-filler");
  const slotDefs = INTENT_SLOTS[slotIntent];
  if (!slotDefs) return null;

  // Find the slot definition we're waiting for
  const awaitingDef = slotDefs.find(
    (s) => s.name === convState.awaitingSlot
  );
  if (!awaitingDef) return null;

  // Try to extract the value
  const extracted = extractSlotFromMessage(awaitingDef, message);
  if (extracted) {
    convState.slots[awaitingDef.name] = extracted;
    convState.awaitingSlot = undefined;

    console.log(
      `[SLOT-FILL] Extracted ${awaitingDef.name} = "${extracted}" for intent ${slotIntent}`
    );

    // Check if more slots needed
    const slotCheck = checkSlots(slotIntent, convState.slots);
    if (!slotCheck.complete) {
      convState.awaitingSlot = slotCheck.missingSlots[0]?.name;

      return {
        response: `Got it! ${slotCheck.nextPrompt}`,
        intent: convState.currentIntent,
        resolved: false,
        conversationId: convState.id,
        slotCheck,
      };
    }

    // All slots filled — confirm and proceed
    const slotSummary = Object.entries(convState.slots)
      .map(([k, v]) => `- *${k}:* ${v}`)
      .join("\n");

    const confirmResponse =
      `I have all the information I need:\n${slotSummary}\n\n` +
      `Processing your request now...`;

    // Clear slot state
    convState.awaitingSlot = undefined;
    convState.context.slotIntent = undefined;

    return {
      response: confirmResponse,
      intent: convState.currentIntent,
      resolved: true,
      conversationId: convState.id,
      slotCheck: { complete: true, missingSlots: [], nextPrompt: "" },
    };
  }

  // Could not extract — ask again with more context
  const retryResponse =
    `I didn't quite catch that. ${awaitingDef.prompt}`;

  return {
    response: retryResponse,
    intent: convState.currentIntent,
    resolved: false,
    conversationId: convState.id,
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
