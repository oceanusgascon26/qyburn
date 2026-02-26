/**
 * Qyburn Slack Bot — Entry Point
 *
 * Runs as a separate process from the Next.js dashboard.
 * Uses Socket Mode (no public endpoint needed).
 *
 * In stub mode, this simulates the bot without real Slack credentials.
 */

import { slackClient } from "../src/lib/stubs/slack";
import { aiClient } from "../src/lib/stubs/anthropic";
import { graphClient } from "../src/lib/stubs/graph";

const BANNER = `
╔══════════════════════════════════════════╗
║         🔥 QYBURN BOT v0.1.0 🔥         ║
║      IT Self-Service Bot (Stub Mode)     ║
╚══════════════════════════════════════════╝
`;

async function handleMessage(userEmail: string, text: string): Promise<string> {
  // Look up the user in Graph
  const graphUser = await graphClient.getUserByEmail(userEmail);
  const userName = graphUser?.displayName ?? userEmail;

  // Build context for AI
  const systemPrompt = `You are Qyburn, an IT self-service bot for SAGA Diagnostics.
You help employees with software license requests, group access, password resets,
VPN setup, and general IT questions. Be helpful, concise, and professional.
Current user: ${userName} (${userEmail}), Department: ${graphUser?.department ?? "Unknown"}`;

  const response = await aiClient.chat(
    [{ role: "user", content: text }],
    systemPrompt
  );

  return response;
}

async function simulateConversation() {
  console.log("[BOT] Simulating a conversation...\n");

  const queries = [
    { user: "anna.lindberg@saga.com", text: "How do I set up VPN?" },
    { user: "erik.svensson@saga.com", text: "I need a JetBrains license" },
    { user: "maria.chen@saga.com", text: "Help me onboard a new team member" },
  ];

  for (const q of queries) {
    console.log(`\n[USER] ${q.user}: ${q.text}`);
    const response = await handleMessage(q.user, q.text);
    console.log(`[QYBURN] ${response}\n`);
    await slackClient.postMessage("#it-support", response);
  }
}

async function main() {
  console.log(BANNER);
  console.log("[BOT] Starting in STUB mode (no real Slack connection)");
  console.log("[BOT] Graph API: stub");
  console.log("[BOT] Anthropic AI: stub");
  console.log("[BOT] Slack: stub\n");

  // In stub mode, simulate a conversation then exit
  await simulateConversation();

  console.log("\n[BOT] Stub simulation complete.");
  console.log("[BOT] In production, the bot would listen on Socket Mode here.");
  console.log("[BOT] Message log:", slackClient.getMessageLog().length, "messages sent");
}

main().catch(console.error);
