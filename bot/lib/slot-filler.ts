/**
 * Slot Filler — Multi-turn slot filling for structured requests
 *
 * Defines required and optional slots per intent, checks for
 * completeness, extracts values from free-text messages, and
 * generates natural follow-up questions.
 */

// ─── Types ───────────────────────────────────────────────────

export interface SlotDefinition {
  name: string;
  type: "string" | "enum" | "number" | "boolean";
  required: boolean;
  prompt: string;
  options?: string[];
  validator?: (value: string) => boolean;
}

export interface SlotCheckResult {
  complete: boolean;
  missingSlots: SlotDefinition[];
  nextPrompt: string;
}

// ─── Validators ──────────────────────────────────────────────

function isValidEmail(value: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
}

function isValidDate(value: string): boolean {
  // Accept: YYYY-MM-DD, MM/DD/YYYY, "next Monday", "March 15", etc.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return true;
  if (
    /^(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(
      value
    )
  )
    return true;
  if (
    /^(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s+\d{4})?$/i.test(
      value
    )
  )
    return true;
  if (/^tomorrow$/i.test(value)) return true;
  return false;
}

// ─── Intent Slot Definitions ─────────────────────────────────

export const INTENT_SLOTS: Record<string, SlotDefinition[]> = {
  license_request: [
    {
      name: "licenseName",
      type: "string",
      required: true,
      prompt:
        "Which software license do you need? Available options include *Microsoft 365*, *Adobe Creative Cloud*, *JetBrains*, *Figma*, and *Slack*.",
    },
    {
      name: "justification",
      type: "string",
      required: false, // Required only if not auto-approve
      prompt:
        "Could you briefly explain why you need this license? (e.g., for a specific project or role)",
    },
    {
      name: "urgency",
      type: "enum",
      required: false,
      prompt:
        "How urgent is this request? (`normal` or `urgent`)",
      options: ["normal", "urgent"],
    },
  ],

  group_access: [
    {
      name: "groupName",
      type: "string",
      required: true,
      prompt:
        "Which group do you need access to? Available restricted groups include *SG-Engineering-Admin*, *SG-Lab-Instruments-Admin*, and *SG-Finance-Sensitive*.",
    },
    {
      name: "justification",
      type: "string",
      required: true,
      prompt:
        "Please provide a justification for this group access request. This will be reviewed by the approver.",
    },
    {
      name: "duration",
      type: "enum",
      required: false,
      prompt:
        "Should this access be `permanent` or `temporary`?",
      options: ["permanent", "temporary"],
    },
  ],

  password_reset: [
    {
      name: "userEmail",
      type: "string",
      required: true,
      prompt:
        "Please confirm the email address for the password reset.",
      validator: isValidEmail,
    },
    {
      name: "verificationMethod",
      type: "enum",
      required: true,
      prompt:
        "How would you like to verify your identity? (`mfa` or `manager`)",
      options: ["mfa", "manager"],
    },
  ],

  onboarding: [
    {
      name: "newHireName",
      type: "string",
      required: true,
      prompt: "What is the new employee's full name?",
    },
    {
      name: "department",
      type: "string",
      required: true,
      prompt:
        "Which department will they be joining? (e.g., Engineering, Diagnostics, Operations, Finance, HR)",
    },
    {
      name: "startDate",
      type: "string",
      required: true,
      prompt:
        "When is their start date? (e.g., `2026-03-15`, `next Monday`)",
      validator: isValidDate,
    },
    {
      name: "role",
      type: "string",
      required: true,
      prompt: "What is their job title/role?",
    },
  ],

  offboarding: [
    {
      name: "employeeName",
      type: "string",
      required: true,
      prompt: "What is the departing employee's full name?",
    },
    {
      name: "lastDay",
      type: "string",
      required: true,
      prompt: "When is their last day? (e.g., `2026-03-15`, `this Friday`)",
      validator: isValidDate,
    },
    {
      name: "transferMailboxTo",
      type: "string",
      required: false,
      prompt:
        "Should their mailbox be transferred to someone? If so, provide the recipient's email address.",
      validator: isValidEmail,
    },
  ],
};

// ─── Slot Checking ───────────────────────────────────────────

/**
 * Check which required slots are still missing for a given intent.
 * Returns whether all slots are filled, the list of missing ones,
 * and the next prompt to ask.
 */
export function checkSlots(
  intent: string,
  collectedSlots: Record<string, unknown>
): SlotCheckResult {
  const slotDefs = INTENT_SLOTS[intent];
  if (!slotDefs) {
    return { complete: true, missingSlots: [], nextPrompt: "" };
  }

  const missing: SlotDefinition[] = [];

  for (const slot of slotDefs) {
    if (!slot.required) continue;

    const value = collectedSlots[slot.name];
    if (value === undefined || value === null || value === "") {
      missing.push(slot);
    }
  }

  if (missing.length === 0) {
    return { complete: true, missingSlots: [], nextPrompt: "" };
  }

  // Ask for the first missing slot
  const nextPrompt = formatSlotQuestion(missing[0]);

  return {
    complete: false,
    missingSlots: missing,
    nextPrompt,
  };
}

// ─── Slot Extraction ─────────────────────────────────────────

/**
 * Try to extract a slot value from a user's free-text message.
 * Uses regex patterns and keyword matching based on the slot definition.
 */
export function extractSlotFromMessage(
  slotDef: SlotDefinition,
  message: string
): string | null {
  const trimmed = message.trim();

  // For enum types, check if the message contains one of the options
  if (slotDef.type === "enum" && slotDef.options) {
    const lower = trimmed.toLowerCase();
    for (const option of slotDef.options) {
      if (lower.includes(option.toLowerCase())) {
        return option;
      }
    }
    return null;
  }

  // For boolean types
  if (slotDef.type === "boolean") {
    const lower = trimmed.toLowerCase();
    if (/^(?:yes|y|true|yep|sure|ok|okay|absolutely|definitely)$/i.test(lower)) {
      return "true";
    }
    if (/^(?:no|n|false|nope|nah|not really)$/i.test(lower)) {
      return "false";
    }
    return null;
  }

  // For number types
  if (slotDef.type === "number") {
    const numMatch = trimmed.match(/\d+/);
    return numMatch ? numMatch[0] : null;
  }

  // For string types with specific validators
  if (slotDef.validator) {
    // Try the whole message first
    if (slotDef.validator(trimmed)) {
      return trimmed;
    }
    // Try to find an email in the message
    if (slotDef.validator === isValidEmail) {
      const emailMatch = trimmed.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      );
      if (emailMatch && slotDef.validator(emailMatch[0])) {
        return emailMatch[0];
      }
    }
    // Try date extraction
    if (slotDef.validator === isValidDate) {
      // Try ISO date
      const isoMatch = trimmed.match(/\d{4}-\d{2}-\d{2}/);
      if (isoMatch) return isoMatch[0];
      // Try US date
      const usMatch = trimmed.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
      if (usMatch) return usMatch[0];
      // Try day name
      const dayMatch = trimmed.match(
        /(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
      );
      if (dayMatch) return dayMatch[0];
      // Try month + day
      const monthMatch = trimmed.match(
        /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s+\d{4})?/i
      );
      if (monthMatch) return monthMatch[0];
      // Try "tomorrow"
      if (/tomorrow/i.test(trimmed)) return "tomorrow";
    }
    return null;
  }

  // For generic string types, try name-specific extraction based on slot name
  if (slotDef.name === "licenseName" || slotDef.name === "softwareName") {
    return extractSoftwareName(trimmed);
  }

  if (slotDef.name === "groupName") {
    return extractGroupName(trimmed);
  }

  if (
    slotDef.name === "newHireName" ||
    slotDef.name === "employeeName"
  ) {
    return extractPersonName(trimmed);
  }

  if (slotDef.name === "department") {
    return extractDepartment(trimmed);
  }

  if (slotDef.name === "role") {
    // For role/title, accept the whole message if it's short enough
    if (trimmed.length > 0 && trimmed.length <= 100) {
      return trimmed;
    }
    return null;
  }

  // Default: use the whole message if it's reasonably short
  if (trimmed.length > 0 && trimmed.length <= 500) {
    return trimmed;
  }

  return null;
}

// ─── Slot Question Formatting ────────────────────────────────

/**
 * Generate a natural Slack message asking for missing slot info.
 */
export function formatSlotQuestion(slot: SlotDefinition): string {
  let question = slot.prompt;

  // Add options hint for enum types
  if (slot.type === "enum" && slot.options && !question.includes("`")) {
    const optionList = slot.options.map((o) => `\`${o}\``).join(", ");
    question += `\nOptions: ${optionList}`;
  }

  return question;
}

// ─── Extraction Helpers ──────────────────────────────────────

const SOFTWARE_NAMES: Record<string, string> = {
  "microsoft 365": "Microsoft 365",
  m365: "Microsoft 365",
  "office 365": "Microsoft 365",
  office: "Microsoft 365",
  adobe: "Adobe Creative Cloud",
  "adobe cc": "Adobe Creative Cloud",
  "creative cloud": "Adobe Creative Cloud",
  photoshop: "Adobe Creative Cloud",
  illustrator: "Adobe Creative Cloud",
  jetbrains: "JetBrains",
  intellij: "JetBrains",
  pycharm: "JetBrains",
  webstorm: "JetBrains",
  rider: "JetBrains",
  figma: "Figma",
  slack: "Slack",
  zoom: "Zoom",
  jira: "Jira",
  confluence: "Confluence",
  "vs code": "VS Code",
  "visual studio": "Visual Studio",
};

function extractSoftwareName(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [key, canonical] of Object.entries(SOFTWARE_NAMES)) {
    if (lower.includes(key)) {
      return canonical;
    }
  }
  // If the message is short, treat it as the software name
  if (message.length <= 50 && !message.includes(" ")) {
    return message;
  }
  return null;
}

const GROUP_NAMES: Record<string, string> = {
  "engineering-admin": "SG-Engineering-Admin",
  "engineering admin": "SG-Engineering-Admin",
  "lab-instruments": "SG-Lab-Instruments-Admin",
  "lab instruments": "SG-Lab-Instruments-Admin",
  "finance-sensitive": "SG-Finance-Sensitive",
  "finance sensitive": "SG-Finance-Sensitive",
  "vpn-users": "SG-VPN-Users",
  "vpn users": "SG-VPN-Users",
  vpn: "SG-VPN-Users",
};

function extractGroupName(message: string): string | null {
  const lower = message.toLowerCase();

  // Check for SG- prefixed group names
  const sgMatch = message.match(/SG-[\w-]+/i);
  if (sgMatch) return sgMatch[0];

  for (const [key, canonical] of Object.entries(GROUP_NAMES)) {
    if (lower.includes(key)) {
      return canonical;
    }
  }
  return null;
}

function extractPersonName(message: string): string | null {
  // If it looks like a name (2-4 words, capitalized), use it
  const words = message.trim().split(/\s+/);
  if (words.length >= 1 && words.length <= 4) {
    // Check if words look like names (start with uppercase or are all lowercase)
    const looksLikeName = words.every(
      (w) => /^[A-Z][a-z]+$/.test(w) || /^[a-z]+$/.test(w)
    );
    if (looksLikeName) {
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  // Try to extract "name is X" or "called X" patterns
  const nameMatch = message.match(
    /(?:name\s+is|called|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  );
  if (nameMatch) return nameMatch[1];

  // Short message — probably just the name
  if (message.trim().length <= 50) {
    return message.trim();
  }

  return null;
}

const DEPARTMENTS = [
  "Engineering",
  "Diagnostics",
  "R&D",
  "Operations",
  "Finance",
  "HR",
  "Marketing",
  "Sales",
  "Lab",
  "IT",
  "Legal",
  "Clinical",
];

function extractDepartment(message: string): string | null {
  const lower = message.toLowerCase();
  for (const dept of DEPARTMENTS) {
    if (lower.includes(dept.toLowerCase())) {
      return dept;
    }
  }
  // Short message — probably just the department name
  if (message.trim().length <= 30) {
    return message.trim();
  }
  return null;
}

/**
 * Map from intent detector names to slot filler intent keys.
 * The intent detector uses short names, slot filler uses action-style names.
 */
export function mapIntentToSlotIntent(detectedIntent: string): string | null {
  const mapping: Record<string, string> = {
    license: "license_request",
    group: "group_access",
    password: "password_reset",
    onboarding: "onboarding",
    offboarding: "offboarding",
  };
  return mapping[detectedIntent] ?? null;
}
