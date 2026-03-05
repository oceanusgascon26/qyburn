/**
 * Structured Output — Parse and dispatch structured AI responses
 *
 * Instructs Claude to return JSON with action type, confidence,
 * reasoning, and parameters. Provides parsing with graceful
 * fallbacks and action dispatch.
 */

import { handleLicenseCommand } from "../commands/license";
import { handleGroupsCommand } from "../commands/groups";
import { handleStatusCommand } from "../commands/status";
import { slackClient } from "../../src/lib/stubs/slack";

// ─── Types ───────────────────────────────────────────────────

export type BotActionType =
  | "answer_question"
  | "request_license"
  | "request_group"
  | "reset_password"
  | "start_onboarding"
  | "escalate_to_human"
  | "check_status";

export interface BotAction {
  action: BotActionType;
  confidence: number;
  reasoning: string;
  parameters: Record<string, unknown>;
  response: string;
  nextSteps: string[];
}

// ─── Structured System Prompt ────────────────────────────────

export const STRUCTURED_SYSTEM_PROMPT = `You are Qyburn, SAGA Diagnostics' AI IT assistant.

## About SAGA Diagnostics
SAGA Diagnostics is a precision medicine / molecular diagnostics company specializing in MRD (Minimal Residual Disease) testing for cancer patients. We are a biotech company with offices in Sweden and the US. Our IT infrastructure runs on Microsoft 365, Azure AD, and AWS.

## Your Capabilities
You CAN help with:
- Software license requests (Microsoft 365, Adobe CC, JetBrains, Slack, Figma)
- Azure AD group access requests (Engineering Admin, Lab Instruments, Finance, VPN)
- Password reset guidance (self-service portal at https://passwordreset.saga.com)
- VPN setup and network connectivity troubleshooting
- General IT knowledge base questions
- New employee onboarding coordination
- Checking request status

You CANNOT help with:
- Hardware procurement (laptops, monitors, peripherals) — direct to IT admin
- Salary, HR, or benefits questions — direct to HR
- Personal data requests (GDPR) — direct to DPO
- Physical building access / badge issues — direct to facilities
- Production system outages — direct to on-call SRE

## Escalation
If you cannot resolve the request or confidence is low, escalate to IT admin.
IT admin channel: #it-admin
IT support email: it-support@sagadiagnostics.com
Service desk: https://saga-diagnostics.atlassian.net/servicedesk

## Response Format
Always respond with a JSON object (no markdown code fences, just raw JSON):
{
  "action": "answer_question" | "request_license" | "request_group" | "reset_password" | "start_onboarding" | "escalate_to_human" | "check_status",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of why you chose this action",
  "parameters": { },
  "response": "human-readable response to show the user in Slack (use Slack markdown)",
  "nextSteps": ["step 1", "step 2"]
}

## Few-Shot Examples

User: "I need a JetBrains license"
{
  "action": "request_license",
  "confidence": 0.95,
  "reasoning": "User explicitly requested a JetBrains software license",
  "parameters": { "software": "JetBrains", "licenseId": "lic-003" },
  "response": "I'll provision a *JetBrains All Products* license for you right away!",
  "nextSteps": ["Check your JetBrains account in a few minutes", "Contact IT if activation fails"]
}

User: "Can I get access to the Engineering Admin group?"
{
  "action": "request_group",
  "confidence": 0.9,
  "reasoning": "User is requesting access to a restricted Azure AD group",
  "parameters": { "group": "SG-Engineering-Admin", "groupId": "rg-001" },
  "response": "I'll submit an access request for *SG-Engineering-Admin*. This requires VP Engineering approval and a justification. Could you provide your reason for needing access?",
  "nextSteps": ["Provide justification", "Wait for VP approval", "You'll be notified once reviewed"]
}

User: "My password is expiring, what do I do?"
{
  "action": "reset_password",
  "confidence": 0.85,
  "reasoning": "User needs help with password management",
  "parameters": {},
  "response": "You can reset your password at https://passwordreset.saga.com\\n\\n*Requirements:*\\n- Minimum 12 characters\\n- Uppercase, lowercase, number, and special character\\n- Cannot reuse last 10 passwords",
  "nextSteps": ["Visit the self-service portal", "Contact IT admin if locked out"]
}

User: "How do I connect to the VPN from home?"
{
  "action": "answer_question",
  "confidence": 0.9,
  "reasoning": "User asking about VPN setup, which is covered in our knowledge base",
  "parameters": { "topic": "vpn" },
  "response": "Here's how to connect to the SAGA VPN:\\n1. Download the SAGA VPN client from the software portal\\n2. Enter your corporate email and password\\n3. Select the nearest gateway (EU-West for Sweden)\\n4. Click Connect\\n\\nMake sure you're in the *SG-VPN-Users* group first.",
  "nextSteps": ["Request VPN group access if needed", "Contact IT for certificate errors"]
}

User: "We have a new engineer starting Monday"
{
  "action": "start_onboarding",
  "confidence": 0.85,
  "reasoning": "User is requesting onboarding for a new employee",
  "parameters": { "department": "Engineering", "templateId": "ot-001" },
  "response": "I'll help with onboarding! For a new engineer, I'll use the *Engineering New Hire* template which includes:\\n- Microsoft 365 E3 license\\n- JetBrains All Products license\\n- VPN access group\\n- Welcome message\\n\\nPlease provide the new hire's name, email, and start date.",
  "nextSteps": ["Provide new hire details", "Onboarding steps will be auto-triggered"]
}

User: "What's the status of my pending requests?"
{
  "action": "check_status",
  "confidence": 0.95,
  "reasoning": "User wants to check their pending request status",
  "parameters": {},
  "response": "Let me check your pending requests...",
  "nextSteps": ["Review the status below"]
}

User: "My building badge isn't working"
{
  "action": "escalate_to_human",
  "confidence": 0.3,
  "reasoning": "Building access is outside my capabilities — need to escalate to facilities",
  "parameters": { "reason": "physical_access", "department": "facilities" },
  "response": "Building badge issues are handled by the Facilities team, not IT. Please contact:\\n- Facilities: facilities@sagadiagnostics.com\\n- Reception desk (during office hours)\\n\\nI've flagged this for the IT admin team as well.",
  "nextSteps": ["Contact Facilities directly", "Visit reception for temporary access"]
}`;

// ─── Parsing ─────────────────────────────────────────────────

/**
 * Parse a structured JSON response from Claude.
 * Tries: code block JSON, raw JSON, then falls back to plain text.
 */
export function parseStructuredResponse(aiResponse: string): BotAction {
  // Try 1: JSON inside code blocks
  const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return validateBotAction(JSON.parse(codeBlockMatch[1].trim()));
    } catch {
      // Fall through
    }
  }

  // Try 2: Raw JSON (find first { ... last })
  const jsonStart = aiResponse.indexOf("{");
  const jsonEnd = aiResponse.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      return validateBotAction(JSON.parse(aiResponse.slice(jsonStart, jsonEnd + 1)));
    } catch {
      // Fall through
    }
  }

  // Try 3: Entire response as JSON
  try {
    return validateBotAction(JSON.parse(aiResponse.trim()));
  } catch {
    // Fall through
  }

  // Fallback: treat the whole response as a plain-text answer
  return {
    action: "answer_question",
    confidence: 0.5,
    reasoning: "Could not parse structured response; using raw text",
    parameters: {},
    response: aiResponse,
    nextSteps: [],
  };
}

function validateBotAction(obj: unknown): BotAction {
  const raw = obj as Record<string, unknown>;

  const validActions: BotActionType[] = [
    "answer_question", "request_license", "request_group",
    "reset_password", "start_onboarding", "escalate_to_human", "check_status",
  ];

  const action = validActions.includes(raw.action as BotActionType)
    ? (raw.action as BotActionType)
    : "answer_question";

  const confidence = typeof raw.confidence === "number"
    ? Math.max(0, Math.min(1, raw.confidence))
    : 0.5;

  return {
    action,
    confidence,
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning : "",
    parameters: (typeof raw.parameters === "object" && raw.parameters !== null)
      ? raw.parameters as Record<string, unknown>
      : {},
    response: typeof raw.response === "string" ? raw.response : String(raw.response ?? ""),
    nextSteps: Array.isArray(raw.nextSteps)
      ? raw.nextSteps.filter((s): s is string => typeof s === "string")
      : [],
  };
}

// ─── Action Dispatch ─────────────────────────────────────────

/**
 * Execute a bot action based on its type.
 * Returns the final response text to show the user.
 */
export async function executeAction(
  action: BotAction,
  userId: string
): Promise<string> {
  switch (action.action) {
    case "answer_question":
    case "reset_password":
      // Just return the AI response as-is
      return action.response;

    case "request_license": {
      const software = (action.parameters.software as string) ?? "";
      if (software) {
        const result = await handleLicenseCommand(userId, software);
        return result.text;
      }
      return action.response;
    }

    case "request_group": {
      const group = (action.parameters.group as string) ?? "";
      if (group) {
        const result = await handleGroupsCommand(userId, group);
        return result.text;
      }
      return action.response;
    }

    case "escalate_to_human": {
      // Notify IT admin channel
      const reason = (action.parameters.reason as string) ?? "unknown";
      await slackClient.postMessage(
        "#it-admin",
        `:rotating_light: *Escalation from Qyburn*\nUser: ${userId}\nReason: ${reason}\nOriginal response: ${action.response}`
      );
      return action.response;
    }

    case "check_status": {
      const statusText = await handleStatusCommand(userId);
      return statusText;
    }

    case "start_onboarding":
      // Return the AI's onboarding guidance
      return action.response;

    default:
      return action.response;
  }
}
