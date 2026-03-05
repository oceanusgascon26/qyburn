/**
 * Conversation Memory — Per-user memory for context-aware responses
 *
 * Stores recent requests, questions, preferences, and interaction
 * history in an in-memory Map. Provides formatted context strings
 * for inclusion in AI prompts.
 */

// ─── Types ───────────────────────────────────────────────────

export interface RecentRequest {
  type: string;
  target: string;
  status: string;
  timestamp: Date;
}

export interface RecentQuestion {
  question: string;
  intent: string;
  timestamp: Date;
}

export interface UserMemory {
  userId: string;
  slackId?: string;
  email?: string;
  department?: string;
  recentRequests: RecentRequest[];
  recentQuestions: RecentQuestion[];
  preferences: Record<string, string>;
  interactionCount: number;
  lastInteraction: Date;
}

// ─── In-memory store ─────────────────────────────────────────

const memoryStore = new Map<string, UserMemory>();

const MAX_RECENT_REQUESTS = 20;
const MAX_RECENT_QUESTIONS = 20;

// ─── Helpers ─────────────────────────────────────────────────

function createDefaultMemory(userId: string): UserMemory {
  return {
    userId,
    recentRequests: [],
    recentQuestions: [],
    preferences: {},
    interactionCount: 0,
    lastInteraction: new Date(),
  };
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Retrieve a user's memory. Creates a default entry if none exists.
 */
export function getMemory(userId: string): UserMemory {
  if (!memoryStore.has(userId)) {
    memoryStore.set(userId, createDefaultMemory(userId));
  }
  return memoryStore.get(userId)!;
}

/**
 * Merge a partial update into the user's memory.
 */
export function updateMemory(userId: string, update: Partial<UserMemory>): UserMemory {
  const current = getMemory(userId);
  const merged: UserMemory = {
    ...current,
    ...update,
    // Always preserve the userId
    userId: current.userId,
    // Merge preferences rather than replace
    preferences: {
      ...current.preferences,
      ...(update.preferences ?? {}),
    },
    // Keep arrays from current if not provided in update
    recentRequests: update.recentRequests ?? current.recentRequests,
    recentQuestions: update.recentQuestions ?? current.recentQuestions,
    lastInteraction: new Date(),
  };
  memoryStore.set(userId, merged);
  return merged;
}

/**
 * Record a request (license, group access, etc.) in the user's history.
 */
export function recordRequest(
  userId: string,
  type: string,
  target: string,
  status: string
): void {
  const memory = getMemory(userId);
  memory.recentRequests.unshift({
    type,
    target,
    status,
    timestamp: new Date(),
  });
  // Trim to max size
  if (memory.recentRequests.length > MAX_RECENT_REQUESTS) {
    memory.recentRequests = memory.recentRequests.slice(0, MAX_RECENT_REQUESTS);
  }
  memory.lastInteraction = new Date();
  memoryStore.set(userId, memory);
}

/**
 * Record a question in the user's history.
 */
export function recordQuestion(
  userId: string,
  question: string,
  intent: string
): void {
  const memory = getMemory(userId);
  memory.recentQuestions.unshift({
    question,
    intent,
    timestamp: new Date(),
  });
  // Trim to max size
  if (memory.recentQuestions.length > MAX_RECENT_QUESTIONS) {
    memory.recentQuestions = memory.recentQuestions.slice(0, MAX_RECENT_QUESTIONS);
  }
  memory.interactionCount++;
  memory.lastInteraction = new Date();
  memoryStore.set(userId, memory);
}

/**
 * Format the user's memory as context for the AI prompt.
 */
export function getMemoryContext(userId: string): string {
  const memory = getMemory(userId);
  const parts: string[] = ["## User Context"];

  // Identity
  const nameParts: string[] = [];
  if (memory.email) nameParts.push(memory.email);
  if (memory.department) nameParts.push(`(${memory.department})`);
  if (nameParts.length > 0) {
    parts.push(`- User: ${nameParts.join(" ")}`);
  }

  // Recent requests (last 5)
  if (memory.recentRequests.length > 0) {
    const requestSummaries = memory.recentRequests
      .slice(0, 5)
      .map((r) => {
        const ago = formatTimeAgo(r.timestamp);
        return `${r.target} (${r.status} ${ago})`;
      });
    parts.push(`- Recent requests: ${requestSummaries.join(", ")}`);
  }

  // Common question intents (deduplicated)
  if (memory.recentQuestions.length > 0) {
    const intentCounts = new Map<string, number>();
    for (const q of memory.recentQuestions) {
      intentCounts.set(q.intent, (intentCounts.get(q.intent) ?? 0) + 1);
    }
    const topIntents = [...intentCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([intent]) => intent);
    parts.push(`- Common questions: ${topIntents.join(", ")}`);
  }

  // Interaction count
  if (memory.interactionCount > 0) {
    parts.push(`- Interaction count: ${memory.interactionCount}`);
  }

  // Preferences
  const prefEntries = Object.entries(memory.preferences);
  if (prefEntries.length > 0) {
    const prefStr = prefEntries.map(([k, v]) => `${k}: ${v}`).join(", ");
    parts.push(`- Preferences: ${prefStr}`);
  }

  // If we only have the header, there's no meaningful context
  if (parts.length <= 1) {
    return "";
  }

  return parts.join("\n");
}

/**
 * Clear all memory for a user.
 */
export function clearMemory(userId: string): void {
  memoryStore.delete(userId);
}

// ─── Internal helpers ────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}
