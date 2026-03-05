/**
 * Proactive Messaging System
 *
 * Year 2 Q2 — Proactive Bot: Generates, schedules, and tracks proactive
 * outreach messages to users. Covers MFA reminders, license expiry warnings,
 * password age nudges, onboarding check-ins, security nudges, and SLA warnings.
 * All messages use Slack Block Kit formatting.
 */

// ─── Types ───────────────────────────────────────────────────

export type ProactiveMessageType =
  | "mfa_reminder"
  | "license_expiry"
  | "password_age"
  | "onboarding_checkin"
  | "security_nudge"
  | "sla_warning";

export interface ScheduledMessage {
  id: string;
  type: ProactiveMessageType;
  userId: string;
  userEmail: string;
  channel?: string;
  message: string;
  blocks: unknown[];
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  response?: string;
}

// ─── In-memory store ─────────────────────────────────────────

const scheduledMessages: ScheduledMessage[] = [];
let messageIdCounter = 0;

// ─── Mock User Data ──────────────────────────────────────────

interface ProactiveUserProfile {
  userId: string;
  email: string;
  name: string;
  department: string;
  hasMFA: boolean;
  startDate: string;
  lastPasswordChange: string;
  deviceComplianceStatus: "compliant" | "overdue" | "unknown";
  assignedLicenses: {
    licenseId: string;
    licenseName: string;
    expiresAt?: string;
  }[];
}

const proactiveUsers: ProactiveUserProfile[] = [
  {
    userId: "user-060",
    email: "new.hire1@saga.com",
    name: "Nils Ekberg",
    department: "Engineering",
    hasMFA: false,
    startDate: "2026-03-03T09:00:00Z",
    lastPasswordChange: "2026-03-03T09:00:00Z",
    deviceComplianceStatus: "unknown",
    assignedLicenses: [],
  },
  {
    userId: "user-061",
    email: "new.hire2@saga.com",
    name: "Lisa Forsberg",
    department: "Marketing",
    hasMFA: false,
    startDate: "2026-03-01T09:00:00Z",
    lastPasswordChange: "2026-03-01T09:00:00Z",
    deviceComplianceStatus: "unknown",
    assignedLicenses: [
      { licenseId: "lic-001", licenseName: "Microsoft 365 E3" },
    ],
  },
  {
    userId: "user-010",
    email: "sofia.berg@saga.com",
    name: "Sofia Berg",
    department: "Marketing",
    hasMFA: false,
    startDate: "2024-08-15T09:00:00Z",
    lastPasswordChange: "2025-04-01T09:00:00Z",
    deviceComplianceStatus: "overdue",
    assignedLicenses: [
      { licenseId: "lic-001", licenseName: "Microsoft 365 E3" },
      { licenseId: "lic-004", licenseName: "Slack Pro" },
    ],
  },
  {
    userId: "user-020",
    email: "jonas.alm@saga.com",
    name: "Jonas Alm",
    department: "Engineering",
    hasMFA: true,
    startDate: "2024-03-15T09:00:00Z",
    lastPasswordChange: "2025-05-20T09:00:00Z",
    deviceComplianceStatus: "compliant",
    assignedLicenses: [
      { licenseId: "lic-001", licenseName: "Microsoft 365 E3" },
      { licenseId: "lic-002", licenseName: "Adobe Creative Cloud" },
      { licenseId: "lic-003", licenseName: "JetBrains All Products", expiresAt: "2026-03-11T00:00:00Z" },
      { licenseId: "lic-004", licenseName: "Slack Pro" },
    ],
  },
  {
    userId: "user-030",
    email: "viktor.lund@saga.com",
    name: "Viktor Lund",
    department: "Engineering",
    hasMFA: true,
    startDate: "2024-05-01T09:00:00Z",
    lastPasswordChange: "2025-09-01T09:00:00Z",
    deviceComplianceStatus: "compliant",
    assignedLicenses: [
      { licenseId: "lic-001", licenseName: "Microsoft 365 E3" },
      { licenseId: "lic-003", licenseName: "JetBrains All Products", expiresAt: "2026-04-01T00:00:00Z" },
      { licenseId: "lic-004", licenseName: "Slack Pro" },
    ],
  },
  {
    userId: "user-050",
    email: "alice.roth@saga.com",
    name: "Alice Roth",
    department: "Marketing",
    hasMFA: true,
    startDate: "2024-09-01T09:00:00Z",
    lastPasswordChange: "2025-06-15T09:00:00Z",
    deviceComplianceStatus: "overdue",
    assignedLicenses: [
      { licenseId: "lic-001", licenseName: "Microsoft 365 E3" },
      { licenseId: "lic-004", licenseName: "Slack Pro" },
      { licenseId: "lic-005", licenseName: "Figma Organization" },
    ],
  },
];

// Mock pending requests for SLA tracking
interface PendingRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: string;
  target: string;
  createdAt: string;
  slaHours: number;
}

const pendingRequests: PendingRequest[] = [
  {
    id: "req-001",
    userId: "user-004",
    userEmail: "james.patel@saga.com",
    userName: "James Patel",
    type: "group.request",
    target: "SG-Engineering-Admin",
    createdAt: "2026-03-03T08:30:00Z",
    slaHours: 24,
  },
  {
    id: "req-002",
    userId: "user-061",
    userEmail: "new.hire2@saga.com",
    userName: "Lisa Forsberg",
    type: "license.request",
    target: "Adobe Creative Cloud",
    createdAt: "2026-03-03T14:00:00Z",
    slaHours: 24,
  },
];

// ─── Helpers ─────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function daysUntil(dateStr: string): number {
  return Math.floor(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function hoursSince(dateStr: string): number {
  return Math.round(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
  );
}

function genId(): string {
  messageIdCounter++;
  return `pm-${Date.now()}-${messageIdCounter}`;
}

// ─── Block Kit Builders ──────────────────────────────────────

function buildMFAReminderBlocks(name: string): unknown[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hey ${name}! :lock: Your MFA isn't set up yet. Multi-factor authentication keeps your account secure and will be required soon.`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Set up MFA now" },
          style: "primary",
          action_id: "mfa_setup",
          url: "https://mysignins.microsoft.com/security-info",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Remind me later" },
          action_id: "mfa_remind_later",
        },
      ],
    },
  ];
}

function buildLicenseExpiryBlocks(
  name: string,
  licenseName: string,
  daysLeft: number
): unknown[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hi ${name}! :warning: Your *${licenseName}* subscription expires in *${daysLeft} days*. Shall I request a renewal?`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Request renewal" },
          style: "primary",
          action_id: "license_renew",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "I don't need it" },
          action_id: "license_decline",
        },
      ],
    },
  ];
}

function buildPasswordAgeBlocks(name: string, days: number): unknown[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hi ${name}! :key: Your password hasn't been changed in *${days} days*. Our policy recommends changing it every 90 days. Want to update it now?`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Change password" },
          style: "primary",
          action_id: "password_change",
          url: "https://passwordreset.saga.com",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Remind me next week" },
          action_id: "password_remind_later",
        },
      ],
    },
  ];
}

function buildOnboardingCheckinBlocks(
  name: string,
  dayNumber: number
): unknown[] {
  const greetings: Record<number, string> = {
    1: `Welcome to SAGA, ${name}! :wave: I'm Qyburn, your IT assistant. I can help you get set up with software, access, and more. Need anything?`,
    7: `Hi ${name}! :wave: It's been a week since you started. How's your setup going? Need access to anything else?`,
    30: `Hey ${name}! :tada: You've been with us for a month now. Just checking in — is there any software or access you're missing?`,
  };

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: greetings[dayNumber] ?? `Hi ${name}! How are things going? Need any IT help?`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "I need access to something" },
          style: "primary",
          action_id: "onboard_request_access",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "All good, thanks!" },
          action_id: "onboard_all_good",
        },
      ],
    },
  ];
}

function buildSecurityNudgeBlocks(name: string, issue: string): unknown[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hi ${name}! :shield: ${issue}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Fix it now" },
          style: "primary",
          action_id: "security_fix",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "I need help" },
          action_id: "security_help",
        },
      ],
    },
  ];
}

function buildSLAWarningBlocks(
  name: string,
  requestType: string,
  target: string,
  hoursElapsed: number,
  slaHours: number
): unknown[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hi ${name}! :clock3: Your ${requestType} for *${target}* has been pending for ${hoursElapsed} of ${slaHours} allowed hours. We're working on it!`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `SLA: ${slaHours}h | Elapsed: ${hoursElapsed}h | Remaining: ${Math.max(0, slaHours - hoursElapsed)}h`,
        },
      ],
    },
  ];
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Scan for conditions and generate proactive messages.
 * Returns newly created scheduled messages.
 */
export function generateProactiveMessages(): ScheduledMessage[] {
  const newMessages: ScheduledMessage[] = [];
  const now = new Date();

  for (const user of proactiveUsers) {
    // MFA reminders
    if (!user.hasMFA) {
      const msg: ScheduledMessage = {
        id: genId(),
        type: "mfa_reminder",
        userId: user.userId,
        userEmail: user.email,
        channel: `@${user.email.split("@")[0]}`,
        message: `Your MFA isn't set up yet. Want me to help?`,
        blocks: buildMFAReminderBlocks(user.name),
        scheduledFor: new Date(now.getTime() + 30 * 60 * 1000), // 30 min from now
        sent: false,
      };
      newMessages.push(msg);
      scheduledMessages.push(msg);
    }

    // License expiry warnings
    for (const lic of user.assignedLicenses) {
      if (lic.expiresAt) {
        const days = daysUntil(lic.expiresAt);
        if (days <= 30 && days > 0) {
          const msg: ScheduledMessage = {
            id: genId(),
            type: "license_expiry",
            userId: user.userId,
            userEmail: user.email,
            channel: `@${user.email.split("@")[0]}`,
            message: `Your ${lic.licenseName} subscription expires in ${days} days. Shall I request renewal?`,
            blocks: buildLicenseExpiryBlocks(user.name, lic.licenseName, days),
            scheduledFor:
              days <= 7
                ? new Date(now.getTime() + 15 * 60 * 1000)
                : new Date(now.getTime() + 2 * 60 * 60 * 1000),
            sent: false,
          };
          newMessages.push(msg);
          scheduledMessages.push(msg);
        }
      }
    }

    // Password age warnings
    const passwordAge = daysSince(user.lastPasswordChange);
    if (passwordAge > 180) {
      const msg: ScheduledMessage = {
        id: genId(),
        type: "password_age",
        userId: user.userId,
        userEmail: user.email,
        channel: `@${user.email.split("@")[0]}`,
        message: `Your password hasn't been changed in ${passwordAge} days. Want to update it?`,
        blocks: buildPasswordAgeBlocks(user.name, passwordAge),
        scheduledFor: new Date(now.getTime() + 60 * 60 * 1000),
        sent: false,
      };
      newMessages.push(msg);
      scheduledMessages.push(msg);
    }

    // Onboarding check-ins (Day 1, 7, 30)
    const daysAtCompany = daysSince(user.startDate);
    const checkInDays = [1, 7, 30];
    for (const checkDay of checkInDays) {
      if (daysAtCompany === checkDay || (daysAtCompany <= checkDay && daysAtCompany >= checkDay - 1)) {
        const msg: ScheduledMessage = {
          id: genId(),
          type: "onboarding_checkin",
          userId: user.userId,
          userEmail: user.email,
          channel: `@${user.email.split("@")[0]}`,
          message:
            checkDay === 1
              ? `Welcome to SAGA! I'm Qyburn, your IT assistant.`
              : checkDay === 7
                ? `It's been a week! How's your setup going?`
                : `You've been here a month. Missing any software?`,
          blocks: buildOnboardingCheckinBlocks(user.name, checkDay),
          scheduledFor: new Date(now.getTime() + 10 * 60 * 1000),
          sent: false,
        };
        newMessages.push(msg);
        scheduledMessages.push(msg);
        break; // Only one onboarding message per user
      }
    }

    // Security nudges
    if (user.deviceComplianceStatus === "overdue") {
      const msg: ScheduledMessage = {
        id: genId(),
        type: "security_nudge",
        userId: user.userId,
        userEmail: user.email,
        channel: `@${user.email.split("@")[0]}`,
        message: `Your device compliance check is overdue.`,
        blocks: buildSecurityNudgeBlocks(
          user.name,
          "Your device compliance check is overdue. Please run the compliance scan to keep your access active."
        ),
        scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        sent: false,
      };
      newMessages.push(msg);
      scheduledMessages.push(msg);
    }
  }

  // SLA warnings for pending requests
  for (const req of pendingRequests) {
    const elapsed = hoursSince(req.createdAt);
    if (elapsed >= req.slaHours * 0.75) {
      const msg: ScheduledMessage = {
        id: genId(),
        type: "sla_warning",
        userId: req.userId,
        userEmail: req.userEmail,
        channel: `@${req.userEmail.split("@")[0]}`,
        message: `Your ${req.type} for ${req.target} has been pending for ${elapsed} of ${req.slaHours} allowed hours.`,
        blocks: buildSLAWarningBlocks(
          req.userName,
          req.type === "group.request" ? "group access request" : "license request",
          req.target,
          elapsed,
          req.slaHours
        ),
        scheduledFor: new Date(now.getTime() + 5 * 60 * 1000),
        sent: false,
      };
      newMessages.push(msg);
      scheduledMessages.push(msg);
    }
  }

  return newMessages;
}

/**
 * Query scheduled messages with optional filters.
 */
export function getScheduledMessages(options?: {
  sent?: boolean;
  type?: string;
}): ScheduledMessage[] {
  let result = [...scheduledMessages];

  if (options?.sent !== undefined) {
    result = result.filter((m) => m.sent === options.sent);
  }
  if (options?.type) {
    result = result.filter((m) => m.type === options.type);
  }

  return result.sort(
    (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
  );
}

/**
 * Mark a message as sent.
 */
export function markSent(messageId: string): ScheduledMessage | null {
  const msg = scheduledMessages.find((m) => m.id === messageId);
  if (!msg) return null;
  msg.sent = true;
  msg.sentAt = new Date();
  return { ...msg };
}

/**
 * Record a user's response to a proactive message.
 */
export function recordResponse(
  messageId: string,
  response: string
): ScheduledMessage | null {
  const msg = scheduledMessages.find((m) => m.id === messageId);
  if (!msg) return null;
  msg.response = response;
  return { ...msg };
}

/**
 * Get messages that are due to be sent now.
 */
export function getDueMessages(): ScheduledMessage[] {
  const now = new Date();
  return scheduledMessages.filter(
    (m) => !m.sent && m.scheduledFor <= now
  );
}

/**
 * Get message type breakdown with counts.
 */
export function getMessageTypeBreakdown(): {
  type: ProactiveMessageType;
  total: number;
  sent: number;
  pending: number;
}[] {
  const types: ProactiveMessageType[] = [
    "mfa_reminder",
    "license_expiry",
    "password_age",
    "onboarding_checkin",
    "security_nudge",
    "sla_warning",
  ];

  return types.map((type) => {
    const ofType = scheduledMessages.filter((m) => m.type === type);
    return {
      type,
      total: ofType.length,
      sent: ofType.filter((m) => m.sent).length,
      pending: ofType.filter((m) => !m.sent).length,
    };
  });
}

/**
 * Delete a scheduled (unsent) message.
 */
export function deleteMessage(messageId: string): boolean {
  const idx = scheduledMessages.findIndex(
    (m) => m.id === messageId && !m.sent
  );
  if (idx === -1) return false;
  scheduledMessages.splice(idx, 1);
  return true;
}
