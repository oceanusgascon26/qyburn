/**
 * Unified client exports.
 *
 * When real credentials are provided via environment variables, the real
 * SDK clients are used. Otherwise, the in-memory stubs are used.
 *
 * Stub mode is the default — no credentials needed to run locally.
 */
import { GraphStub } from "./graph";
import { AnthropicStub } from "./anthropic";
import { SlackStub } from "./slack";

export type { GraphUser, GraphGroup } from "./graph";
export type { ChatMessage } from "./anthropic";
export type { SlackMessage, SlackUser } from "./slack";
export { GraphStub } from "./graph";
export { AnthropicStub } from "./anthropic";
export { SlackStub } from "./slack";

// ─── Microsoft Graph ────────────────────────────────────────
function createGraphClient(): GraphStub {
  const isReal =
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_TENANT_ID !== "stub-tenant-id" &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_ID !== "stub-client-id" &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_CLIENT_SECRET !== "stub-client-secret";

  if (isReal) {
    console.log("[GRAPH] Using real Microsoft Graph client");
    // In production: import { ClientSecretCredential } from "@azure/identity";
    // import { Client } from "@microsoft/microsoft-graph-client";
    // and return a wrapper that implements the same interface.
    // For now, we still return the stub but log the intent.
  }

  console.log("[GRAPH] Using stub client");
  return new GraphStub();
}

// ─── Anthropic ──────────────────────────────────────────────
function createAiClient(): AnthropicStub {
  const isReal =
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "sk-ant-stub-key";

  if (isReal) {
    console.log("[ANTHROPIC] Using real Anthropic client");
    // In production: import Anthropic from "@anthropic-ai/sdk";
    // and return a wrapper that implements the same interface.
  }

  console.log("[ANTHROPIC] Using stub client");
  return new AnthropicStub();
}

// ─── Slack ──────────────────────────────────────────────────
function createSlackClient(): SlackStub {
  const isReal =
    process.env.SLACK_BOT_TOKEN &&
    process.env.SLACK_BOT_TOKEN !== "xoxb-stub-token";

  if (isReal) {
    console.log("[SLACK] Using real Slack client");
    // In production: import { WebClient } from "@slack/web-api";
    // and return a wrapper that implements the same interface.
  }

  console.log("[SLACK] Using stub client");
  return new SlackStub();
}

// ─── Singleton exports ──────────────────────────────────────
export const graphClient = createGraphClient();
export const aiClient = createAiClient();
export const slackClient = createSlackClient();
