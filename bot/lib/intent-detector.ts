/**
 * Intent Detector — Multi-pattern intent classification
 *
 * Replaces naive keyword matching with regex-based pattern matching,
 * entity extraction, multi-intent detection, and confidence scoring.
 */

// ─── Types ───────────────────────────────────────────────────

export interface DetectedIntent {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  subIntents: string[];
}

// ─── Pattern definitions ─────────────────────────────────────

interface IntentPattern {
  intent: string;
  patterns: RegExp[];
  weight: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // License / software requests
  {
    intent: "license",
    patterns: [
      /\bneed\s+(?:a\s+)?(?:license|software)\b/i,
      /\brequest\s+(?:a\s+)?license\b/i,
      /\bget\s+(?:access\s+to|me)\s+(?:a\s+)?(?:license|software)\b/i,
      /\binstall\s+\w+/i,
      /\bsubscription\b/i,
      /\bprovision\s+(?:a\s+)?license\b/i,
      /\blicense\s+(?:for|request)\b/i,
      /\bsoftware\s+(?:request|license|access)\b/i,
      /\bneed\s+(?:adobe|jetbrains|figma|slack|microsoft|office|m365)\b/i,
      /\bcan\s+(?:i|you)\s+get\s+(?:me\s+)?(?:a\s+)?\w+\s+license\b/i,
    ],
    weight: 1.0,
  },
  // Group access
  {
    intent: "group",
    patterns: [
      /\bjoin\s+(?:a\s+)?group\b/i,
      /\baccess\s+to\s+(?:the\s+)?(?:sg-|group)\w*/i,
      /\badd\s+me\s+to\b/i,
      /\brestricted\s+group\b/i,
      /\bteam\s+access\b/i,
      /\bgroup\s+(?:access|membership|request)\b/i,
      /\bneed\s+(?:access|permission)\s+(?:to|for)\b/i,
      /\brequest\s+access\b/i,
      /\bsg-\w+/i,
      /\bazure\s+(?:ad\s+)?group\b/i,
    ],
    weight: 1.0,
  },
  // Password / auth
  {
    intent: "password",
    patterns: [
      /\breset\s+(?:my\s+)?password\b/i,
      /\bforgot\s+(?:my\s+)?password\b/i,
      /\bchange\s+(?:my\s+)?password\b/i,
      /\blocked\s+out\b/i,
      /\baccount\s+locked\b/i,
      /\bmfa\b/i,
      /\bmulti.?factor\b/i,
      /\bauthenticator\b/i,
      /\bpassword\s+(?:is\s+)?(?:about\s+to\s+)?(?:expir|reset|policy|change|issue)\w*/i,
      /\bpassword\b/i,
      /\bcan'?t\s+(?:log\s*in|sign\s*in)\b/i,
      /\blogin\s+(?:issue|problem|fail)\w*/i,
      /\b2fa\b/i,
    ],
    weight: 1.0,
  },
  // VPN / network
  {
    intent: "vpn",
    patterns: [
      /\bvpn\b/i,
      /\bremote\s+access\b/i,
      /\bconnect\s+from\s+home\b/i,
      /\bnetwork\s+(?:issue|problem|setup|connect)\w*/i,
      /\bproxy\b/i,
      /\bwi-?fi\b/i,
      /\binternet\s+(?:not\s+working|issue|problem|down)\b/i,
      /\bconnectivity\b/i,
      /\bwork\s+(?:from\s+home|remotely)\b/i,
    ],
    weight: 1.0,
  },
  // Onboarding
  {
    intent: "onboarding",
    patterns: [
      /\bnew\s+(?:hire|employee|team\s+member|starter|joiner)\b/i,
      /\bonboarding\b/i,
      /\bfirst\s+day\b/i,
      /\bsetup\s+(?:my|their|an?)\s+account\b/i,
      /\bstarting\s+(?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|next\s+week|tomorrow)\b/i,
      /\bnew\s+person\s+(?:starting|joining)\b/i,
      /\bprovision\s+(?:a\s+)?new\s+(?:user|employee|account)\b/i,
    ],
    weight: 1.0,
  },
  // Status check
  {
    intent: "status",
    patterns: [
      /\bmy\s+requests?\b/i,
      /\bpending\s+(?:request|approval)\w*/i,
      /\bcheck\s+status\b/i,
      /\bapproval\s+(?:status|update)\b/i,
      /\bwhere\s+is\s+my\b/i,
      /\bstatus\s+(?:of|on|update)\b/i,
      /\btrack\s+(?:my\s+)?request\b/i,
      /\bany\s+update\b/i,
    ],
    weight: 1.0,
  },
  // Hardware
  {
    intent: "hardware",
    patterns: [
      /\bnew\s+(?:laptop|monitor|keyboard|mouse|headset|dock(?:ing)?)\b/i,
      /\bmonitor\b/i,
      /\bkeyboard\b/i,
      /\bdocking\s+station\b/i,
      /\bequipment\b/i,
      /\bhardware\s+(?:request|issue|problem)\b/i,
      /\bperipherals?\b/i,
      /\bbroken\s+(?:laptop|screen|keyboard|mouse)\b/i,
      /\breplace\s+(?:my\s+)?(?:laptop|monitor|keyboard)\b/i,
    ],
    weight: 1.0,
  },
  // Email / calendar / Teams
  {
    intent: "email",
    patterns: [
      /\bemail\s+(?:issue|problem|not\s+working|setup)\b/i,
      /\boutlook\b/i,
      /\bcalendar\s+(?:issue|problem|sync|not\s+working)\b/i,
      /\bteams?\s+(?:issue|problem|not\s+working|call)\b/i,
      /\bshared\s+mailbox\b/i,
      /\bdistribution\s+(?:list|group)\b/i,
      /\bmail\s+(?:flow|rule|forward)\b/i,
      /\bout\s+of\s+office\b/i,
      /\bauto.?reply\b/i,
    ],
    weight: 1.0,
  },
];

// ─── Entity extraction patterns ──────────────────────────────

const ENTITY_PATTERNS: { name: string; pattern: RegExp }[] = [
  // Software names
  { name: "software", pattern: /\b(adobe\s*(?:cc|creative\s*cloud)?|jetbrains|figma|slack|microsoft\s*365|m365|office\s*365|visual\s*studio|vs\s*code|zoom|jira|confluence)\b/i },
  // Group names
  { name: "group", pattern: /\b(sg-[\w-]+|engineering[- ]admin|lab[- ](?:instruments?|users?|admin)|finance[- ]sensitive|vpn[- ]users)\b/i },
  // Ticket numbers
  { name: "ticket", pattern: /\b(IT-\d+|TICKET-\d+|REQ-\d+|INC-\d+|#\d{4,})\b/i },
  // Email addresses
  { name: "email", pattern: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/ },
  // Department names
  { name: "department", pattern: /\b(engineering|diagnostics|r&d|operations|finance|hr|marketing|sales|lab|it)\b/i },
];

// ─── Intent Detection ────────────────────────────────────────

/**
 * Detect one or more intents from a user message.
 * Uses multi-pattern matching with confidence scoring.
 */
export function detectIntent(message: string): DetectedIntent {
  const messageLower = message.toLowerCase();
  const results: { intent: string; matchCount: number; totalPatterns: number; weight: number }[] = [];

  // Score each intent category
  for (const intentDef of INTENT_PATTERNS) {
    let matchCount = 0;
    for (const pattern of intentDef.patterns) {
      if (pattern.test(message)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      results.push({
        intent: intentDef.intent,
        matchCount,
        totalPatterns: intentDef.patterns.length,
        weight: intentDef.weight,
      });
    }
  }

  // Sort by match count (descending)
  results.sort((a, b) => b.matchCount - a.matchCount);

  // Extract entities
  const entities: Record<string, string> = {};
  for (const ep of ENTITY_PATTERNS) {
    const match = message.match(ep.pattern);
    if (match) {
      entities[ep.name] = match[1];
    }
  }

  // No matches
  if (results.length === 0) {
    return {
      intent: "general",
      confidence: 0.3,
      entities,
      subIntents: [],
    };
  }

  const primary = results[0];

  // Confidence: based on number of pattern matches relative to total
  // More matches = higher confidence, but diminishing returns
  const matchRatio = primary.matchCount / primary.totalPatterns;
  let confidence = Math.min(0.5 + matchRatio * 0.5, 0.98);

  // Boost if entities match the intent
  if (primary.intent === "license" && entities.software) {
    confidence = Math.min(confidence + 0.1, 0.99);
  }
  if (primary.intent === "group" && entities.group) {
    confidence = Math.min(confidence + 0.1, 0.99);
  }

  // Detect sub-intents (secondary matches)
  const subIntents = results
    .slice(1)
    .filter((r) => r.matchCount >= 1)
    .map((r) => r.intent);

  // If there's a strong secondary intent, this is a multi-intent message
  // Slightly reduce primary confidence since the message is ambiguous
  if (subIntents.length > 0 && results[1] && results[1].matchCount >= 2) {
    confidence = Math.max(confidence - 0.05, 0.3);
  }

  // Short messages get a small confidence penalty (less signal)
  if (messageLower.split(/\s+/).length < 4) {
    confidence = Math.max(confidence - 0.1, 0.2);
  }

  return {
    intent: primary.intent,
    confidence,
    entities,
    subIntents,
  };
}

// ─── Clarification ───────────────────────────────────────────

/**
 * Suggest a clarification if intent confidence is low.
 */
export function suggestClarification(intent: DetectedIntent): string | null {
  if (intent.confidence >= 0.6) {
    return null;
  }

  const suggestions: Record<string, string> = {
    license:
      "It sounds like you might need a software license. Could you specify which software? Available options include Microsoft 365, Adobe Creative Cloud, JetBrains, Figma, and Slack.",
    group:
      "It seems like you might need group access. Could you specify which group? Available restricted groups include SG-Engineering-Admin, SG-Lab-Instruments-Admin, and SG-Finance-Sensitive.",
    password:
      "Are you having trouble with your password or account access? I can help with password resets, MFA setup, or account unlocks.",
    vpn:
      "Are you trying to connect to the SAGA VPN? I can walk you through the setup or help troubleshoot connectivity issues.",
    onboarding:
      "Are you setting up a new employee? I'll need their name, email, department, and start date to begin the onboarding process.",
    status:
      "Would you like to check the status of your pending requests? I can look up license requests, group access requests, and more.",
    hardware:
      "Hardware requests need to go through IT admin directly. Would you like me to escalate this, or did you mean something else?",
    email:
      "Are you having trouble with email, calendar, or Teams? Please describe the specific issue and I'll try to help.",
    general:
      "I'm not quite sure what you need. I can help with:\n- Software license requests\n- Group access requests\n- Password resets\n- VPN setup\n- General IT questions\n\nCould you rephrase your request?",
  };

  return suggestions[intent.intent] ?? suggestions.general;
}
