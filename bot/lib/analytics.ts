/**
 * Conversation Analytics Engine
 *
 * Records conversation outcomes and computes aggregate metrics
 * for the bot dashboard — resolution rates, intent distribution,
 * latency, satisfaction, knowledge gaps, and trends.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ConversationRecord {
  id: string;
  userId: string;
  intent: string;
  confidence: number;
  resolved: boolean;
  escalated: boolean;
  turns: number;
  latencyMs: number;
  satisfaction?: number;
  timestamp: Date;
}

export interface AnalyticsSummary {
  totalConversations: number;
  resolutionRate: number;
  escalationRate: number;
  avgTurnsToResolve: number;
  avgConfidence: number;
  avgSatisfaction: number | null;
  avgResponseLatencyMs: number;
  intentDistribution: { intent: string; count: number; percentage: number }[];
  topUnansweredQuestions: { question: string; count: number }[];
  busiestHours: { hour: number; count: number }[];
  busiestDays: { day: string; count: number }[];
}

export interface IntentTrend {
  period: string;
  intents: Record<string, number>;
}

export interface UserMetrics {
  userId: string;
  totalConversations: number;
  resolvedCount: number;
  escalatedCount: number;
  avgSatisfaction: number | null;
  avgConfidence: number;
  topIntents: { intent: string; count: number }[];
  firstInteraction: Date;
  lastInteraction: Date;
}

interface KnowledgeGapEntry {
  question: string;
  intent?: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

// ─── In-memory stores ────────────────────────────────────────

const conversationRecords: ConversationRecord[] = [];
const knowledgeGaps = new Map<string, KnowledgeGapEntry>();

let recordIdCounter = 0;

// ─── Public API ──────────────────────────────────────────────

/**
 * Record a completed conversation's outcome.
 */
export function recordConversation(data: {
  userId: string;
  intent: string;
  confidence: number;
  resolved: boolean;
  escalated?: boolean;
  turns: number;
  latencyMs: number;
  satisfaction?: number;
}): ConversationRecord {
  recordIdCounter++;
  const record: ConversationRecord = {
    id: `rec_${Date.now()}_${recordIdCounter}`,
    userId: data.userId,
    intent: data.intent,
    confidence: data.confidence,
    resolved: data.resolved,
    escalated: data.escalated ?? false,
    turns: data.turns,
    latencyMs: data.latencyMs,
    satisfaction: data.satisfaction,
    timestamp: new Date(),
  };

  conversationRecords.push(record);
  return record;
}

/**
 * Record a knowledge gap (question the bot couldn't answer).
 */
export function recordKnowledgeGap(
  question: string,
  intent?: string
): void {
  const key = question.toLowerCase().trim();
  const existing = knowledgeGaps.get(key);

  if (existing) {
    existing.count++;
    existing.lastSeen = new Date();
  } else {
    knowledgeGaps.set(key, {
      question,
      intent,
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
  }
}

/**
 * Get analytics summary for a given time period.
 */
export function getAnalytics(
  period?: "day" | "week" | "month"
): AnalyticsSummary {
  const now = new Date();
  let since: Date;

  switch (period) {
    case "day":
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      since = new Date(0); // all time
  }

  const records = conversationRecords.filter(
    (r) => r.timestamp >= since
  );

  if (records.length === 0) {
    return {
      totalConversations: 0,
      resolutionRate: 0,
      escalationRate: 0,
      avgTurnsToResolve: 0,
      avgConfidence: 0,
      avgSatisfaction: null,
      avgResponseLatencyMs: 0,
      intentDistribution: [],
      topUnansweredQuestions: [],
      busiestHours: [],
      busiestDays: [],
    };
  }

  const total = records.length;
  const resolved = records.filter((r) => r.resolved).length;
  const escalated = records.filter((r) => r.escalated).length;
  const resolvedRecords = records.filter((r) => r.resolved);

  // Resolution rate
  const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

  // Escalation rate
  const escalationRate = total > 0 ? (escalated / total) * 100 : 0;

  // Avg turns to resolve (only for resolved conversations)
  const avgTurnsToResolve =
    resolvedRecords.length > 0
      ? resolvedRecords.reduce((sum, r) => sum + r.turns, 0) /
        resolvedRecords.length
      : 0;

  // Avg confidence
  const avgConfidence =
    records.reduce((sum, r) => sum + r.confidence, 0) / total;

  // Avg satisfaction (only from those who rated)
  const ratedRecords = records.filter(
    (r) => r.satisfaction !== undefined
  );
  const avgSatisfaction =
    ratedRecords.length > 0
      ? ratedRecords.reduce((sum, r) => sum + (r.satisfaction ?? 0), 0) /
        ratedRecords.length
      : null;

  // Avg response latency
  const avgResponseLatencyMs =
    records.reduce((sum, r) => sum + r.latencyMs, 0) / total;

  // Intent distribution
  const intentCounts = new Map<string, number>();
  for (const r of records) {
    intentCounts.set(r.intent, (intentCounts.get(r.intent) ?? 0) + 1);
  }
  const intentDistribution = Array.from(intentCounts.entries())
    .map(([intent, count]) => ({
      intent,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Top unanswered questions (knowledge gaps)
  const topUnansweredQuestions = Array.from(knowledgeGaps.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((g) => ({ question: g.question, count: g.count }));

  // Busiest hours
  const hourCounts = new Map<number, number>();
  for (const r of records) {
    const hour = r.timestamp.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }
  const busiestHours = Array.from(hourCounts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);

  // Busiest days
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayCounts = new Map<string, number>();
  for (const r of records) {
    const day = dayNames[r.timestamp.getDay()];
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }
  const busiestDays = Array.from(dayCounts.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalConversations: total,
    resolutionRate: Math.round(resolutionRate * 10) / 10,
    escalationRate: Math.round(escalationRate * 10) / 10,
    avgTurnsToResolve: Math.round(avgTurnsToResolve * 10) / 10,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    avgSatisfaction:
      avgSatisfaction !== null
        ? Math.round(avgSatisfaction * 10) / 10
        : null,
    avgResponseLatencyMs: Math.round(avgResponseLatencyMs),
    intentDistribution,
    topUnansweredQuestions,
    busiestHours,
    busiestDays,
  };
}

/**
 * Get intent trends over time — how intent distribution changes.
 */
export function getIntentTrends(): IntentTrend[] {
  if (conversationRecords.length === 0) return [];

  // Group by week
  const weekBuckets = new Map<string, Map<string, number>>();

  for (const record of conversationRecords) {
    const weekStart = getWeekStart(record.timestamp);
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weekBuckets.has(weekKey)) {
      weekBuckets.set(weekKey, new Map<string, number>());
    }
    const intents = weekBuckets.get(weekKey)!;
    intents.set(
      record.intent,
      (intents.get(record.intent) ?? 0) + 1
    );
  }

  return Array.from(weekBuckets.entries())
    .map(([period, intents]) => ({
      period,
      intents: Object.fromEntries(intents),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get per-user metrics.
 */
export function getUserMetrics(userId: string): UserMetrics | null {
  const userRecords = conversationRecords.filter(
    (r) => r.userId === userId
  );

  if (userRecords.length === 0) return null;

  const resolved = userRecords.filter((r) => r.resolved).length;
  const escalated = userRecords.filter((r) => r.escalated).length;

  const rated = userRecords.filter(
    (r) => r.satisfaction !== undefined
  );
  const avgSatisfaction =
    rated.length > 0
      ? rated.reduce((sum, r) => sum + (r.satisfaction ?? 0), 0) /
        rated.length
      : null;

  const avgConfidence =
    userRecords.reduce((sum, r) => sum + r.confidence, 0) /
    userRecords.length;

  // Top intents
  const intentCounts = new Map<string, number>();
  for (const r of userRecords) {
    intentCounts.set(r.intent, (intentCounts.get(r.intent) ?? 0) + 1);
  }
  const topIntents = Array.from(intentCounts.entries())
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const timestamps = userRecords.map((r) => r.timestamp);
  const firstInteraction = new Date(
    Math.min(...timestamps.map((t) => t.getTime()))
  );
  const lastInteraction = new Date(
    Math.max(...timestamps.map((t) => t.getTime()))
  );

  return {
    userId,
    totalConversations: userRecords.length,
    resolvedCount: resolved,
    escalatedCount: escalated,
    avgSatisfaction:
      avgSatisfaction !== null
        ? Math.round(avgSatisfaction * 10) / 10
        : null,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    topIntents,
    firstInteraction,
    lastInteraction,
  };
}

/**
 * Get all knowledge gaps, sorted by frequency.
 */
export function getKnowledgeGaps(): KnowledgeGapEntry[] {
  return Array.from(knowledgeGaps.values()).sort(
    (a, b) => b.count - a.count
  );
}

/**
 * Get all raw records (for API export).
 */
export function getAllRecords(): ConversationRecord[] {
  return [...conversationRecords];
}

// ─── Helpers ─────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
