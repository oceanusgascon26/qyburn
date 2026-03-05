/**
 * Confidence Scoring — Evaluates bot response quality
 *
 * Scores responses based on RAG hits, intent clarity, hedging
 * language, specificity, and user memory depth. Determines
 * whether to escalate to a human and formats Slack-appropriate
 * confidence indicators.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ConfidenceResult {
  score: number;
  level: "high" | "medium" | "low";
  factors: string[];
  shouldEscalate: boolean;
  fallbackSuggestions: string[];
}

export interface ConfidenceContext {
  intent: string;
  ragHits: number;
  userMemoryDepth: number;
  queryLength: number;
}

// ─── Constants ───────────────────────────────────────────────

const KNOWN_INTENTS = new Set([
  "license", "group", "password", "vpn", "network",
  "onboarding", "status", "hardware", "email",
]);

const HEDGING_PHRASES = [
  "might", "possibly", "i think", "not sure", "maybe",
  "perhaps", "could be", "i believe", "uncertain",
  "not certain", "hard to say", "it depends",
];

const SPECIFICITY_MARKERS = [
  /https?:\/\/\S+/,              // URLs
  /\d+\.\s/,                      // Numbered steps
  /step\s+\d/i,                   // "Step 1", "Step 2"
  /click\s/i,                     // Actionable instructions
  /navigate\s+to/i,               // Navigation instructions
  /select\s/i,                    // Selection instructions
  /open\s/i,                      // "Open the..."
  /go\s+to/i,                     // "Go to..."
  /download\s/i,                  // Download instructions
  /install\s/i,                   // Install instructions
];

// ─── Scoring ─────────────────────────────────────────────────

/**
 * Calculate confidence score for a bot response.
 */
export function calculateConfidence(
  response: string,
  context: ConfidenceContext
): ConfidenceResult {
  let score = 30; // Base score
  const factors: string[] = [];
  const responseLower = response.toLowerCase();

  // RAG hit boost: +20 per hit, max +40
  const ragBoost = Math.min(context.ragHits * 20, 40);
  if (ragBoost > 0) {
    score += ragBoost;
    factors.push(`+${ragBoost} RAG knowledge base matches (${context.ragHits} hits)`);
  }

  // Intent clarity: known intent = +30, general/unknown = +10
  if (KNOWN_INTENTS.has(context.intent)) {
    score += 30;
    factors.push(`+30 recognized intent: ${context.intent}`);
  } else {
    score += 10;
    factors.push("+10 general/unrecognized intent");
  }

  // Hedging penalty: -15 for each hedging phrase detected
  let hedgingPenalty = 0;
  for (const phrase of HEDGING_PHRASES) {
    if (responseLower.includes(phrase)) {
      hedgingPenalty += 15;
      factors.push(`-15 hedging language: "${phrase}"`);
    }
  }
  score -= hedgingPenalty;

  // Specificity bonus: +10 for each specificity marker, max +30
  let specificityBonus = 0;
  for (const pattern of SPECIFICITY_MARKERS) {
    if (pattern.test(response)) {
      specificityBonus += 10;
    }
  }
  specificityBonus = Math.min(specificityBonus, 30);
  if (specificityBonus > 0) {
    score += specificityBonus;
    factors.push(`+${specificityBonus} specific instructions detected`);
  }

  // Memory boost: returning user with context = +10
  if (context.userMemoryDepth > 0) {
    score += 10;
    factors.push("+10 returning user with context");
  }

  // Query length penalty: very short queries are harder to answer well
  if (context.queryLength < 10) {
    score -= 5;
    factors.push("-5 very short query");
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: "high" | "medium" | "low";
  if (score >= 70) {
    level = "high";
  } else if (score >= 40) {
    level = "medium";
  } else {
    level = "low";
  }

  // Build fallback suggestions
  const fallbackSuggestions: string[] = [
    "Contact IT: it-support@sagadiagnostics.com",
  ];
  if (level === "low") {
    fallbackSuggestions.unshift("Try rephrasing your question with more detail");
    fallbackSuggestions.push("Open a ticket at https://saga-diagnostics.atlassian.net/servicedesk");
  }

  return {
    score,
    level,
    factors,
    shouldEscalate: score < 40,
    fallbackSuggestions,
  };
}

// ─── Slack Formatting ────────────────────────────────────────

export interface SlackConfidenceBlock {
  type: string;
  color?: string;
  text?: { type: string; text: string };
  fields?: { type: string; text: string }[];
}

/**
 * Format confidence result as Slack attachment blocks.
 */
export function formatConfidenceForSlack(result: ConfidenceResult): SlackConfidenceBlock[] {
  if (result.level === "high") {
    // High confidence: green sidebar, no extra messaging
    return [
      {
        type: "attachment",
        color: "#2eb886",
        fields: [
          {
            type: "mrkdwn",
            text: `*Confidence:* ${result.score}% :white_check_mark:`,
          },
        ],
      },
    ];
  }

  if (result.level === "medium") {
    // Medium confidence: yellow sidebar with note
    return [
      {
        type: "attachment",
        color: "#daa038",
        text: {
          type: "mrkdwn",
          text: `_I'm fairly confident about this answer (${result.score}%). If it doesn't fully address your question, please provide more details._`,
        },
        fields: [
          {
            type: "mrkdwn",
            text: `*Confidence:* ${result.score}% :large_yellow_circle:`,
          },
        ],
      },
    ];
  }

  // Low confidence: red sidebar with escalation note
  return [
    {
      type: "attachment",
      color: "#e01e5a",
      text: {
        type: "mrkdwn",
        text: `_I'm not sure about this answer (${result.score}%). You may want to contact IT directly._`,
      },
      fields: [
        {
          type: "mrkdwn",
          text: `*Confidence:* ${result.score}% :red_circle:`,
        },
        {
          type: "mrkdwn",
          text: `*Suggestions:*\n${result.fallbackSuggestions.map((s) => `- ${s}`).join("\n")}`,
        },
      ],
    },
  ];
}
