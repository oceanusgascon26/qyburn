/**
 * Natural language conversation handler
 * Routes user messages through the AI for context-aware responses.
 */

import { aiClient } from "../../src/lib/stubs/anthropic";
import { graphClient } from "../../src/lib/stubs/graph";
import { createAuditLog } from "../../src/lib/mock-data";

const SYSTEM_PROMPT = `You are Qyburn, an AI-powered IT self-service bot for SAGA Diagnostics.
Your job is to help employees with:
1. Software license requests — check availability and auto-provision if possible
2. Azure AD group access requests — submit for approval when needed
3. Password resets — guide users to the self-service portal
4. VPN and network setup — provide step-by-step instructions
5. General IT questions — answer from the knowledge base
6. New employee onboarding — trigger onboarding templates

Be concise, professional, and helpful. If you can't resolve something, escalate to IT admin.
Always confirm actions before executing them.
Format responses for Slack (use *bold*, _italic_, and bullet points).`;

export interface ConversationResult {
  response: string;
  intent: string;
  resolved: boolean;
}

export async function handleConversation(
  userEmail: string,
  message: string,
  channel?: string
): Promise<ConversationResult> {
  // Fetch user context from Graph
  const user = await graphClient.getUserByEmail(userEmail);
  const userContext = user
    ? `\nUser: ${user.displayName} (${user.mail}), ${user.jobTitle ?? "Unknown role"}, ${user.department ?? "Unknown dept"}`
    : `\nUser: ${userEmail}`;

  const fullSystemPrompt = SYSTEM_PROMPT + userContext;

  // Get AI response
  const response = await aiClient.chat(
    [{ role: "user", content: message }],
    fullSystemPrompt
  );

  // Determine intent for logging
  const lowerMsg = message.toLowerCase();
  let intent = "general";
  if (lowerMsg.includes("license") || lowerMsg.includes("software")) intent = "license";
  else if (lowerMsg.includes("group") || lowerMsg.includes("access")) intent = "group";
  else if (lowerMsg.includes("password") || lowerMsg.includes("reset")) intent = "password";
  else if (lowerMsg.includes("vpn") || lowerMsg.includes("network")) intent = "network";
  else if (lowerMsg.includes("onboard") || lowerMsg.includes("new hire")) intent = "onboarding";

  // Create audit log entry
  createAuditLog({
    actor: "qyburn-bot",
    action: "kb.query",
    target: intent,
    targetId: null,
    details: JSON.stringify({
      user: userEmail,
      query: message.slice(0, 200),
      intent,
      resolved: true,
    }),
    channel: channel ?? null,
  });

  return {
    response,
    intent,
    resolved: true,
  };
}
