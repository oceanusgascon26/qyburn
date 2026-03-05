/**
 * Multi-Turn Conversation Management
 *
 * Manages conversation state across multiple exchanges, persisting
 * messages in memory (with optional DB persistence) and tracking
 * intents, slots, and context per conversation.
 */

import { slackClient } from "../../src/lib/stubs/slack";

// ─── Types ───────────────────────────────────────────────────

export interface ConversationState {
  id: string;
  userId: string;
  threadTs?: string;
  messages: { role: string; content: string }[];
  currentIntent: string;
  slots: Record<string, unknown>;
  awaitingSlot?: string;
  context: Record<string, unknown>;
}

interface MessageMetadata {
  intent?: string;
  confidence?: number;
  ragSources?: string[];
  actionTaken?: string;
  latencyMs?: number;
}

interface StoredMessage {
  id: string;
  role: string;
  content: string;
  intent?: string;
  confidence?: number;
  ragSources: string[];
  actionTaken?: string;
  latencyMs?: number;
  createdAt: Date;
}

interface StoredConversation {
  id: string;
  userId: string;
  userEmail: string;
  threadTs?: string;
  channel?: string;
  status: "active" | "resolved" | "escalated";
  intent?: string;
  confidence?: number;
  resolvedAt?: Date;
  satisfaction?: number;
  messages: StoredMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── In-memory stores ────────────────────────────────────────

const conversationStates = new Map<string, ConversationState>();
const storedConversations = new Map<string, StoredConversation>();

// Index: threadTs -> conversationId for quick lookup
const threadIndex = new Map<string, string>();
// Index: userId -> conversationId[] for active conversations
const userIndex = new Map<string, string[]>();

let idCounter = 0;

function generateId(): string {
  idCounter++;
  return `conv_${Date.now()}_${idCounter}`;
}

function generateMessageId(): string {
  idCounter++;
  return `msg_${Date.now()}_${idCounter}`;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Find an existing conversation by thread timestamp or create a new one.
 * Returns the conversation state for multi-turn tracking.
 */
export function getOrCreateConversation(
  userId: string,
  threadTs?: string,
  options?: { channel?: string; userEmail?: string }
): ConversationState {
  // Try to find by threadTs first
  if (threadTs) {
    const existingId = threadIndex.get(threadTs);
    if (existingId) {
      const state = conversationStates.get(existingId);
      if (state) return state;
    }
  }

  // Try to find an active conversation for this user (most recent)
  const userConvIds = userIndex.get(userId) ?? [];
  for (const convId of userConvIds) {
    const stored = storedConversations.get(convId);
    if (stored && stored.status === "active") {
      const state = conversationStates.get(convId);
      if (state) return state;
    }
  }

  // Create a new conversation
  const id = generateId();
  const now = new Date();

  const state: ConversationState = {
    id,
    userId,
    threadTs,
    messages: [],
    currentIntent: "",
    slots: {},
    awaitingSlot: undefined,
    context: {},
  };

  const stored: StoredConversation = {
    id,
    userId,
    userEmail: options?.userEmail ?? userId,
    threadTs,
    channel: options?.channel,
    status: "active",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  conversationStates.set(id, state);
  storedConversations.set(id, stored);

  if (threadTs) {
    threadIndex.set(threadTs, id);
  }

  // Update user index
  const existing = userIndex.get(userId) ?? [];
  existing.unshift(id);
  userIndex.set(userId, existing);

  return state;
}

/**
 * Add a message to a conversation's history.
 * Persists to both the state (for slot tracking) and the stored conversation.
 */
export function addMessage(
  conversationId: string,
  role: string,
  content: string,
  metadata?: MessageMetadata
): void {
  // Update state
  const state = conversationStates.get(conversationId);
  if (state) {
    state.messages.push({ role, content });
  }

  // Update stored conversation
  const stored = storedConversations.get(conversationId);
  if (stored) {
    stored.messages.push({
      id: generateMessageId(),
      role,
      content,
      intent: metadata?.intent,
      confidence: metadata?.confidence,
      ragSources: metadata?.ragSources ?? [],
      actionTaken: metadata?.actionTaken,
      latencyMs: metadata?.latencyMs,
      createdAt: new Date(),
    });
    stored.updatedAt = new Date();

    // Update intent/confidence on conversation level if provided
    if (metadata?.intent) {
      stored.intent = metadata.intent;
    }
    if (metadata?.confidence !== undefined) {
      stored.confidence = metadata.confidence;
    }
  }
}

/**
 * Get conversation history formatted for Claude's messages API.
 * Returns the last N messages as { role, content } pairs.
 */
export function getConversationHistory(
  conversationId: string,
  maxMessages = 20
): { role: string; content: string }[] {
  const state = conversationStates.get(conversationId);
  if (!state) return [];

  const messages = state.messages.slice(-maxMessages);

  // Ensure messages alternate properly for the API
  // Filter to only user/assistant roles (skip system)
  return messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
}

/**
 * Mark a conversation as resolved.
 */
export function resolveConversation(
  conversationId: string,
  satisfaction?: number
): void {
  const stored = storedConversations.get(conversationId);
  if (stored) {
    stored.status = "resolved";
    stored.resolvedAt = new Date();
    stored.updatedAt = new Date();
    if (satisfaction !== undefined) {
      stored.satisfaction = Math.max(1, Math.min(5, satisfaction));
    }
  }

  // Clean up state (no longer active)
  const state = conversationStates.get(conversationId);
  if (state) {
    state.currentIntent = "";
    state.slots = {};
    state.awaitingSlot = undefined;
  }
}

/**
 * Mark a conversation as escalated and notify IT admin.
 */
export async function escalateConversation(
  conversationId: string,
  reason: string
): Promise<void> {
  const stored = storedConversations.get(conversationId);
  if (stored) {
    stored.status = "escalated";
    stored.updatedAt = new Date();
  }

  const state = conversationStates.get(conversationId);
  const userId = state?.userId ?? stored?.userId ?? "unknown";
  const channel = stored?.channel ?? "DM";
  const messageCount = stored?.messages.length ?? 0;
  const lastMessage =
    stored?.messages
      .filter((m) => m.role === "user")
      .pop()?.content ?? "N/A";

  await slackClient.postMessage(
    "#it-admin",
    `:rotating_light: *Conversation Escalated*\n` +
      `*User:* ${userId}\n` +
      `*Channel:* ${channel}\n` +
      `*Reason:* ${reason}\n` +
      `*Messages in thread:* ${messageCount}\n` +
      `*Last user message:* ${lastMessage.slice(0, 200)}\n` +
      `*Conversation ID:* ${conversationId}`
  );
}

// ─── Query helpers (for API routes) ──────────────────────────

/**
 * Get a stored conversation by ID.
 */
export function getConversation(
  conversationId: string
): StoredConversation | undefined {
  return storedConversations.get(conversationId);
}

/**
 * List conversations with optional filters.
 */
export function listConversations(filters?: {
  status?: string;
  userId?: string;
  since?: Date;
  until?: Date;
}): StoredConversation[] {
  let results = Array.from(storedConversations.values());

  if (filters?.status) {
    results = results.filter((c) => c.status === filters.status);
  }
  if (filters?.userId) {
    results = results.filter((c) => c.userId === filters.userId);
  }
  if (filters?.since) {
    const since = filters.since;
    results = results.filter((c) => c.createdAt >= since);
  }
  if (filters?.until) {
    const until = filters.until;
    results = results.filter((c) => c.createdAt <= until);
  }

  // Sort by most recent first
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return results;
}

/**
 * Get the current conversation state (for slot filling, etc.)
 */
export function getConversationState(
  conversationId: string
): ConversationState | undefined {
  return conversationStates.get(conversationId);
}
