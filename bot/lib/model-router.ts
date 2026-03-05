/**
 * Model Router — Multi-model routing for cost-optimized AI inference.
 *
 * Routes queries to the appropriate Claude model based on intent,
 * confidence, complexity, and escalation status. Tracks usage
 * and cost per model.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  costMultiplier: number;
}

export interface ModelSelection {
  tier: "fast" | "balanced" | "deep";
  config: ModelConfig;
  reason: string;
}

export interface ModelUsageEntry {
  tier: "fast" | "balanced" | "deep";
  count: number;
  estimatedCost: number;
}

export interface ModelStats {
  fast: ModelUsageEntry;
  balanced: ModelUsageEntry;
  deep: ModelUsageEntry;
  totalQueries: number;
  totalCost: number;
}

export interface RoutingContext {
  intent: string;
  confidence: number;
  complexity: number;
  isEscalated: boolean;
}

// ─── Model Definitions ──────────────────────────────────────

export const MODELS: Record<"fast" | "balanced" | "deep", ModelConfig> = {
  fast: {
    model: "claude-haiku-4-5-20251001",
    maxTokens: 512,
    temperature: 0.3,
    costMultiplier: 0.001,
  },
  balanced: {
    model: "claude-sonnet-4-6",
    maxTokens: 1024,
    temperature: 0.5,
    costMultiplier: 0.01,
  },
  deep: {
    model: "claude-opus-4-6",
    maxTokens: 2048,
    temperature: 0.7,
    costMultiplier: 0.05,
  },
};

// ─── Usage Tracking ──────────────────────────────────────────

const usage: Record<"fast" | "balanced" | "deep", { count: number; cost: number }> = {
  fast: { count: 0, cost: 0 },
  balanced: { count: 0, cost: 0 },
  deep: { count: 0, cost: 0 },
};

// ─── Intent Complexity Classification ────────────────────────

/** Simple FAQ-style intents that can be answered by the fast model. */
const SIMPLE_INTENTS = new Set([
  "status",
  "vpn",
  "email",
  "hardware",
]);

/** Action intents that need moderate intelligence for slot-filling. */
const ACTION_INTENTS = new Set([
  "license",
  "group",
  "password",
]);

/** Complex intents requiring deep reasoning. */
const COMPLEX_INTENTS = new Set([
  "onboarding",
]);

// ─── Routing Logic ───────────────────────────────────────────

/**
 * Select the appropriate model tier based on context.
 *
 * Routing rules:
 *   - Escalated conversations always go to deep
 *   - FAQ answers with high confidence -> fast
 *   - License/group requests -> balanced
 *   - Multi-step onboarding, troubleshooting -> deep
 *   - Unknown intent with low confidence -> balanced (to figure it out)
 *   - High complexity (>0.7) -> deep
 */
export function selectModel(context: RoutingContext): ModelSelection {
  const { intent, confidence, complexity, isEscalated } = context;

  // Rule 1: Escalated conversations always get the deep model
  if (isEscalated) {
    return {
      tier: "deep",
      config: MODELS.deep,
      reason: "Escalated conversation requires deep reasoning",
    };
  }

  // Rule 2: High complexity always gets deep
  if (complexity > 0.7) {
    return {
      tier: "deep",
      config: MODELS.deep,
      reason: `High complexity (${complexity.toFixed(2)}) requires deep reasoning`,
    };
  }

  // Rule 3: Complex intents (onboarding, multi-step) -> deep
  if (COMPLEX_INTENTS.has(intent)) {
    return {
      tier: "deep",
      config: MODELS.deep,
      reason: `Complex intent "${intent}" requires multi-step planning`,
    };
  }

  // Rule 4: Simple intents with high confidence -> fast
  if (SIMPLE_INTENTS.has(intent) && confidence >= 0.7) {
    return {
      tier: "fast",
      config: MODELS.fast,
      reason: `Simple FAQ intent "${intent}" with high confidence (${confidence.toFixed(2)})`,
    };
  }

  // Rule 5: Action intents -> balanced
  if (ACTION_INTENTS.has(intent)) {
    return {
      tier: "balanced",
      config: MODELS.balanced,
      reason: `Action intent "${intent}" requires slot filling and validation`,
    };
  }

  // Rule 6: Unknown/general intent with low confidence -> balanced
  if (intent === "general" || confidence < 0.5) {
    return {
      tier: "balanced",
      config: MODELS.balanced,
      reason: `Ambiguous intent "${intent}" (confidence: ${confidence.toFixed(2)}) — using balanced to disambiguate`,
    };
  }

  // Default: balanced for anything else
  return {
    tier: "balanced",
    config: MODELS.balanced,
    reason: `Default routing for intent "${intent}"`,
  };
}

/**
 * Record that a query was processed by a specific model tier.
 * Call this after the AI response is received.
 */
export function recordModelUsage(tier: "fast" | "balanced" | "deep"): void {
  const config = MODELS[tier];
  usage[tier].count++;
  usage[tier].cost += config.costMultiplier;
}

/**
 * Get model usage statistics and cost breakdown.
 */
export function getModelStats(): ModelStats {
  const totalQueries =
    usage.fast.count + usage.balanced.count + usage.deep.count;
  const totalCost =
    usage.fast.cost + usage.balanced.cost + usage.deep.cost;

  return {
    fast: {
      tier: "fast",
      count: usage.fast.count,
      estimatedCost: usage.fast.cost,
    },
    balanced: {
      tier: "balanced",
      count: usage.balanced.count,
      estimatedCost: usage.balanced.cost,
    },
    deep: {
      tier: "deep",
      count: usage.deep.count,
      estimatedCost: usage.deep.cost,
    },
    totalQueries,
    totalCost,
  };
}

/**
 * Reset usage stats (for testing or periodic resets).
 */
export function resetModelStats(): void {
  usage.fast.count = 0;
  usage.fast.cost = 0;
  usage.balanced.count = 0;
  usage.balanced.cost = 0;
  usage.deep.count = 0;
  usage.deep.cost = 0;
}
