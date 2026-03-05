/**
 * Sentiment Detector — Analyzes user frustration, urgency, and escalation triggers
 *
 * Examines individual messages and conversation history to detect
 * frustrated users, urgent requests, and situations that warrant
 * automatic escalation to a human.
 */

// ─── Types ───────────────────────────────────────────────────

export interface SentimentResult {
  score: number; // -1 (very negative) to 1 (very positive)
  label: "frustrated" | "urgent" | "neutral" | "positive";
  shouldEscalate: boolean;
  urgencyLevel: "critical" | "high" | "normal";
  markers: string[];
}

// ─── Marker Definitions ──────────────────────────────────────

const FRUSTRATION_PATTERNS: { pattern: RegExp; weight: number; label: string }[] = [
  { pattern: /\bbeen waiting\b/i, weight: -0.3, label: "been waiting" },
  { pattern: /\bstill haven'?t\b/i, weight: -0.3, label: "still haven't" },
  { pattern: /\bthis is ridiculous\b/i, weight: -0.5, label: "this is ridiculous" },
  { pattern: /\bhow many times\b/i, weight: -0.4, label: "how many times" },
  { pattern: /\bnobody responds?\b/i, weight: -0.4, label: "nobody responds" },
  { pattern: /\bno one (?:has |is )?help(?:ing|ed)?\b/i, weight: -0.4, label: "no one helping" },
  { pattern: /\bwaste of time\b/i, weight: -0.5, label: "waste of time" },
  { pattern: /\bunacceptable\b/i, weight: -0.4, label: "unacceptable" },
  { pattern: /\bfrustrat(?:ed|ing)\b/i, weight: -0.4, label: "frustrated" },
  { pattern: /\bterrible\b/i, weight: -0.3, label: "terrible" },
  { pattern: /\buseless\b/i, weight: -0.4, label: "useless" },
  { pattern: /\bbroke(?:n|s)?\b/i, weight: -0.1, label: "broken" },
  { pattern: /\bnot working\b/i, weight: -0.1, label: "not working" },
  { pattern: /\bstill broken\b/i, weight: -0.3, label: "still broken" },
  { pattern: /\bkeeps? (?:failing|crashing|breaking)\b/i, weight: -0.3, label: "keeps failing" },
  { pattern: /\balready (?:told|asked|reported|submitted)\b/i, weight: -0.3, label: "already reported" },
  { pattern: /!{3,}/, weight: -0.3, label: "excessive exclamation marks" },
];

const URGENCY_PATTERNS: { pattern: RegExp; weight: number; label: string }[] = [
  { pattern: /\burgent\b/i, weight: -0.3, label: "urgent" },
  { pattern: /\basap\b/i, weight: -0.3, label: "ASAP" },
  { pattern: /\bimmediately\b/i, weight: -0.3, label: "immediately" },
  { pattern: /\bblocking my work\b/i, weight: -0.4, label: "blocking work" },
  { pattern: /\bdeadline\b/i, weight: -0.2, label: "deadline" },
  { pattern: /\bproduction (?:down|issue|outage|broken)\b/i, weight: -0.5, label: "production issue" },
  { pattern: /\bcritical\b/i, weight: -0.3, label: "critical" },
  { pattern: /\bemergency\b/i, weight: -0.4, label: "emergency" },
  { pattern: /\bcan'?t (?:do|continue|work|access|login|log in)\b/i, weight: -0.2, label: "can't work" },
  { pattern: /\bdown\b/i, weight: -0.1, label: "something down" },
  { pattern: /\boutage\b/i, weight: -0.3, label: "outage" },
  { pattern: /\btime.?sensitive\b/i, weight: -0.2, label: "time-sensitive" },
];

const POSITIVE_PATTERNS: { pattern: RegExp; weight: number; label: string }[] = [
  { pattern: /\bthanks?\b/i, weight: 0.3, label: "thanks" },
  { pattern: /\bthank you\b/i, weight: 0.3, label: "thank you" },
  { pattern: /\bgreat\b/i, weight: 0.2, label: "great" },
  { pattern: /\bperfect\b/i, weight: 0.3, label: "perfect" },
  { pattern: /\bthat worked\b/i, weight: 0.4, label: "that worked" },
  { pattern: /\bawesome\b/i, weight: 0.3, label: "awesome" },
  { pattern: /\bhelpful\b/i, weight: 0.2, label: "helpful" },
  { pattern: /\bexcellent\b/i, weight: 0.3, label: "excellent" },
  { pattern: /\bappreciate\b/i, weight: 0.3, label: "appreciate" },
  { pattern: /\bresolved?\b/i, weight: 0.2, label: "resolved" },
  { pattern: /\bfixed\b/i, weight: 0.2, label: "fixed" },
  { pattern: /\bworking now\b/i, weight: 0.4, label: "working now" },
];

// ─── Detection ───────────────────────────────────────────────

/**
 * Analyze sentiment of a message, optionally considering conversation history.
 */
export function detectSentiment(
  message: string,
  conversationHistory?: string[]
): SentimentResult {
  let score = 0;
  const markers: string[] = [];
  let hasFrustration = false;
  let hasUrgency = false;
  let hasPositive = false;

  // Check frustration markers
  for (const { pattern, weight, label } of FRUSTRATION_PATTERNS) {
    if (pattern.test(message)) {
      score += weight;
      markers.push(label);
      hasFrustration = true;
    }
  }

  // Check urgency markers
  for (const { pattern, weight, label } of URGENCY_PATTERNS) {
    if (pattern.test(message)) {
      score += weight;
      markers.push(label);
      hasUrgency = true;
    }
  }

  // Check positive markers
  for (const { pattern, weight, label } of POSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      score += weight;
      markers.push(label);
      hasPositive = true;
    }
  }

  // ALL CAPS detection (only for messages > 10 chars to avoid acronyms)
  if (message.length > 10 && message === message.toUpperCase() && /[A-Z]/.test(message)) {
    score -= 0.3;
    markers.push("ALL CAPS");
    hasFrustration = true;
  }

  // History analysis: repeated questions = frustration
  let repeatedQuestions = 0;
  if (conversationHistory && conversationHistory.length > 0) {
    const msgLower = message.toLowerCase().trim();
    for (const prev of conversationHistory) {
      // Fuzzy match: same question asked again
      if (
        prev.toLowerCase().trim() === msgLower ||
        levenshteinSimilarity(prev.toLowerCase(), msgLower) > 0.8
      ) {
        repeatedQuestions++;
      }
    }

    if (repeatedQuestions >= 2) {
      score -= 0.4;
      markers.push(`repeated question (${repeatedQuestions + 1}x)`);
      hasFrustration = true;
    }

    // Long conversation without resolution = increasing frustration
    if (conversationHistory.length >= 6) {
      score -= 0.2;
      markers.push(`long unresolved thread (${conversationHistory.length} messages)`);
    }
  }

  // Clamp score
  score = Math.max(-1, Math.min(1, score));

  // Determine label
  let label: SentimentResult["label"];
  if (hasPositive && !hasFrustration && !hasUrgency) {
    label = "positive";
  } else if (hasFrustration) {
    label = "frustrated";
  } else if (hasUrgency) {
    label = "urgent";
  } else {
    label = "neutral";
  }

  // Determine urgency level
  let urgencyLevel: SentimentResult["urgencyLevel"] = "normal";
  if (hasUrgency && hasFrustration) {
    urgencyLevel = "critical";
  } else if (hasUrgency || score <= -0.5) {
    urgencyLevel = "high";
  }

  // Determine escalation
  const shouldEscalate =
    (hasFrustration && hasUrgency) ||
    repeatedQuestions >= 2 ||
    score <= -0.6 ||
    urgencyLevel === "critical";

  return {
    score,
    label,
    shouldEscalate,
    urgencyLevel,
    markers,
  };
}

// ─── Slack Alert Formatting ──────────────────────────────────

/**
 * Format a sentiment alert as Slack blocks for IT admin notification.
 */
export function formatSentimentAlert(
  result: SentimentResult,
  userId: string
): { text: string; blocks: Record<string, unknown>[] } {
  const emoji =
    result.label === "frustrated"
      ? ":rage:"
      : result.label === "urgent"
        ? ":warning:"
        : ":information_source:";

  const urgencyEmoji =
    result.urgencyLevel === "critical"
      ? ":red_circle:"
      : result.urgencyLevel === "high"
        ? ":large_orange_circle:"
        : ":white_circle:";

  const text =
    `${emoji} *Sentiment Alert — ${result.label.toUpperCase()}*\n` +
    `*User:* ${userId}\n` +
    `${urgencyEmoji} *Urgency:* ${result.urgencyLevel}\n` +
    `*Score:* ${result.score.toFixed(2)}\n` +
    `*Markers:* ${result.markers.join(", ") || "none"}\n` +
    `*Escalate:* ${result.shouldEscalate ? "YES" : "no"}`;

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} *Sentiment Alert*`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*User:*\n${userId}` },
        { type: "mrkdwn", text: `*Label:*\n${result.label}` },
        { type: "mrkdwn", text: `*Urgency:*\n${urgencyEmoji} ${result.urgencyLevel}` },
        { type: "mrkdwn", text: `*Score:*\n${result.score.toFixed(2)}` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Markers:* ${result.markers.join(", ") || "none"}`,
      },
    },
  ];

  if (result.shouldEscalate) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:rotating_light: *Auto-escalation triggered* — a human should follow up with this user.`,
      },
    });
  }

  return { text, blocks };
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Simple Levenshtein-based similarity (0..1).
 * Used for fuzzy matching repeated questions.
 */
function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;

  // Quick exit for very different lengths
  if (longer.length - shorter.length > longer.length * 0.3) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      const cost = shorter[i - 1] === longer[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[shorter.length][longer.length];
  return 1 - distance / longer.length;
}
