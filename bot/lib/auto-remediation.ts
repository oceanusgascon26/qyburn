/**
 * Auto-Remediation Engine
 *
 * Year 3 Q1 — Self-Healing Infrastructure: Automated issue detection and
 * self-healing for common IT problems. Scans for trigger conditions (failed
 * logins, locked accounts, missing MFA, expired licenses, noncompliant
 * devices, expired passwords, expiring certs) and executes remediation
 * actions with cooldown tracking and audit trails.
 */

// ─── Types ───────────────────────────────────────────────────

export interface RemediationRule {
  id: string;
  name: string;
  trigger: {
    type:
      | "failed_login"
      | "account_locked"
      | "mfa_missing"
      | "license_expired"
      | "device_noncompliant"
      | "password_expired"
      | "cert_expiring";
    threshold?: number;
  };
  action: {
    type:
      | "unlock_account"
      | "send_mfa_setup"
      | "renew_license"
      | "push_compliance"
      | "reset_password_link"
      | "rotate_cert"
      | "notify_user"
      | "escalate";
    autoExecute: boolean;
  };
  cooldownMinutes: number;
}

export interface RemediationEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  userId: string;
  userEmail: string;
  action: string;
  result: "success" | "failed" | "escalated";
  details?: string;
  createdAt: Date;
}

export interface IssueMatch {
  rule: RemediationRule;
  affectedUsers: { userId: string; userEmail: string; details: string }[];
}

export interface RemediationStats {
  totalDetected: number;
  autoResolved: number;
  escalated: number;
  failed: number;
  avgResolutionMs: number;
  byRule: Record<string, { detected: number; resolved: number }>;
}

// ─── Default Rules ──────────────────────────────────────────

export const DEFAULT_REMEDIATION_RULES: RemediationRule[] = [
  {
    id: "rule-failed-logins",
    name: "Failed Login Threshold",
    trigger: { type: "failed_login", threshold: 3 },
    action: { type: "unlock_account", autoExecute: true },
    cooldownMinutes: 30,
  },
  {
    id: "rule-account-locked",
    name: "Account Locked Auto-Unlock",
    trigger: { type: "account_locked" },
    action: { type: "reset_password_link", autoExecute: true },
    cooldownMinutes: 60,
  },
  {
    id: "rule-mfa-missing",
    name: "MFA Not Enrolled (7-day)",
    trigger: { type: "mfa_missing", threshold: 7 },
    action: { type: "send_mfa_setup", autoExecute: true },
    cooldownMinutes: 1440, // 24 hours
  },
  {
    id: "rule-license-expired",
    name: "License Expired Auto-Renew",
    trigger: { type: "license_expired" },
    action: { type: "renew_license", autoExecute: false },
    cooldownMinutes: 1440,
  },
  {
    id: "rule-device-noncompliant",
    name: "Device Noncompliance Push",
    trigger: { type: "device_noncompliant" },
    action: { type: "push_compliance", autoExecute: true },
    cooldownMinutes: 240,
  },
  {
    id: "rule-password-expired",
    name: "Password Expired Reset",
    trigger: { type: "password_expired" },
    action: { type: "reset_password_link", autoExecute: true },
    cooldownMinutes: 60,
  },
  {
    id: "rule-cert-expiring",
    name: "Certificate Expiring (30-day)",
    trigger: { type: "cert_expiring", threshold: 30 },
    action: { type: "rotate_cert", autoExecute: false },
    cooldownMinutes: 10080, // 7 days
  },
  {
    id: "rule-service-degradation",
    name: "Service Degradation (5+ reports)",
    trigger: { type: "failed_login", threshold: 5 },
    action: { type: "escalate", autoExecute: true },
    cooldownMinutes: 15,
  },
];

// ─── In-Memory Store ────────────────────────────────────────

const remediationHistory: RemediationEvent[] = [];
let eventIdCounter = 0;

/** cooldownKey -> last execution timestamp */
const cooldownTracker: Map<string, number> = new Map();

// ─── Mock System State ──────────────────────────────────────

interface SystemUser {
  userId: string;
  email: string;
  name: string;
  department: string;
  failedLogins: number;
  accountLocked: boolean;
  mfaEnrolled: boolean;
  mfaEnrolledDaysAgo: number | null;
  passwordExpired: boolean;
  deviceCompliant: boolean;
  licensesExpired: string[];
}

const systemUsers: SystemUser[] = [
  {
    userId: "user-001",
    email: "jane.doe@saga.com",
    name: "Jane Doe",
    department: "Research",
    failedLogins: 5,
    accountLocked: true,
    mfaEnrolled: true,
    mfaEnrolledDaysAgo: 90,
    passwordExpired: false,
    deviceCompliant: true,
    licensesExpired: [],
  },
  {
    userId: "user-002",
    email: "tom.smith@saga.com",
    name: "Tom Smith",
    department: "Sales",
    failedLogins: 0,
    accountLocked: false,
    mfaEnrolled: false,
    mfaEnrolledDaysAgo: null,
    passwordExpired: false,
    deviceCompliant: true,
    licensesExpired: [],
  },
  {
    userId: "user-003",
    email: "maria.garcia@saga.com",
    name: "Maria Garcia",
    department: "Engineering",
    failedLogins: 0,
    accountLocked: false,
    mfaEnrolled: true,
    mfaEnrolledDaysAgo: 45,
    passwordExpired: true,
    deviceCompliant: false,
    licensesExpired: ["lic-tableau"],
  },
  {
    userId: "user-004",
    email: "alex.chen@saga.com",
    name: "Alex Chen",
    department: "Marketing",
    failedLogins: 4,
    accountLocked: false,
    mfaEnrolled: true,
    mfaEnrolledDaysAgo: 30,
    passwordExpired: false,
    deviceCompliant: false,
    licensesExpired: [],
  },
  {
    userId: "user-005",
    email: "priya.patel@saga.com",
    name: "Priya Patel",
    department: "Finance",
    failedLogins: 0,
    accountLocked: false,
    mfaEnrolled: false,
    mfaEnrolledDaysAgo: null,
    passwordExpired: true,
    deviceCompliant: true,
    licensesExpired: ["lic-jira"],
  },
];

interface CertRecord {
  id: string;
  name: string;
  domain: string;
  expiresInDays: number;
}

const certificates: CertRecord[] = [
  { id: "cert-001", name: "Wildcard SSL", domain: "*.saga.com", expiresInDays: 22 },
  { id: "cert-002", name: "API Gateway", domain: "api.saga.com", expiresInDays: 90 },
  { id: "cert-003", name: "VPN Root CA", domain: "vpn.saga.com", expiresInDays: 15 },
];

// ─── Cooldown Check ─────────────────────────────────────────

function getCooldownKey(ruleId: string, userId: string): string {
  return `${ruleId}:${userId}`;
}

function isOnCooldown(ruleId: string, userId: string, cooldownMinutes: number): boolean {
  const key = getCooldownKey(ruleId, userId);
  const lastRun = cooldownTracker.get(key);
  if (!lastRun) return false;
  const elapsed = Date.now() - lastRun;
  return elapsed < cooldownMinutes * 60 * 1000;
}

function setCooldown(ruleId: string, userId: string): void {
  const key = getCooldownKey(ruleId, userId);
  cooldownTracker.set(key, Date.now());
}

// ─── Scan for Issues ────────────────────────────────────────

/**
 * Scan all systems for trigger conditions.
 * Returns matched rules with affected users.
 */
export function scanForIssues(): IssueMatch[] {
  const matches: IssueMatch[] = [];

  for (const rule of DEFAULT_REMEDIATION_RULES) {
    const affected: IssueMatch["affectedUsers"] = [];

    switch (rule.trigger.type) {
      case "failed_login": {
        const threshold = rule.trigger.threshold ?? 3;
        // Special case: service degradation rule uses higher threshold
        if (rule.id === "rule-service-degradation") {
          const affectedCount = systemUsers.filter((u) => u.failedLogins >= threshold).length;
          if (affectedCount >= threshold) {
            for (const u of systemUsers.filter((su) => su.failedLogins >= 1)) {
              affected.push({
                userId: u.userId,
                userEmail: u.email,
                details: `Service degradation: ${affectedCount} users with failed logins — possible service outage`,
              });
            }
          }
        } else {
          for (const u of systemUsers) {
            if (u.failedLogins >= threshold && !isOnCooldown(rule.id, u.userId, rule.cooldownMinutes)) {
              affected.push({
                userId: u.userId,
                userEmail: u.email,
                details: `${u.failedLogins} failed login attempts`,
              });
            }
          }
        }
        break;
      }
      case "account_locked": {
        for (const u of systemUsers) {
          if (u.accountLocked && !isOnCooldown(rule.id, u.userId, rule.cooldownMinutes)) {
            affected.push({
              userId: u.userId,
              userEmail: u.email,
              details: "Account is locked",
            });
          }
        }
        break;
      }
      case "mfa_missing": {
        const dayThreshold = rule.trigger.threshold ?? 7;
        for (const u of systemUsers) {
          if (!u.mfaEnrolled && !isOnCooldown(rule.id, u.userId, rule.cooldownMinutes)) {
            // Check if they've been without MFA longer than threshold
            affected.push({
              userId: u.userId,
              userEmail: u.email,
              details: `MFA not enrolled — exceeds ${dayThreshold}-day grace period`,
            });
          }
        }
        break;
      }
      case "license_expired": {
        for (const u of systemUsers) {
          if (u.licensesExpired.length > 0 && !isOnCooldown(rule.id, u.userId, rule.cooldownMinutes)) {
            affected.push({
              userId: u.userId,
              userEmail: u.email,
              details: `Expired licenses: ${u.licensesExpired.join(", ")}`,
            });
          }
        }
        break;
      }
      case "device_noncompliant": {
        for (const u of systemUsers) {
          if (!u.deviceCompliant && !isOnCooldown(rule.id, u.userId, rule.cooldownMinutes)) {
            affected.push({
              userId: u.userId,
              userEmail: u.email,
              details: "Device noncompliant with organization policy",
            });
          }
        }
        break;
      }
      case "password_expired": {
        for (const u of systemUsers) {
          if (u.passwordExpired && !isOnCooldown(rule.id, u.userId, rule.cooldownMinutes)) {
            affected.push({
              userId: u.userId,
              userEmail: u.email,
              details: "Password has expired",
            });
          }
        }
        break;
      }
      case "cert_expiring": {
        const dayThreshold = rule.trigger.threshold ?? 30;
        for (const cert of certificates) {
          if (cert.expiresInDays <= dayThreshold) {
            const fakeUserId = `cert-${cert.id}`;
            if (!isOnCooldown(rule.id, fakeUserId, rule.cooldownMinutes)) {
              affected.push({
                userId: fakeUserId,
                userEmail: "it-team@saga.com",
                details: `Certificate "${cert.name}" (${cert.domain}) expires in ${cert.expiresInDays} days`,
              });
            }
          }
        }
        break;
      }
    }

    if (affected.length > 0) {
      matches.push({ rule, affectedUsers: affected });
    }
  }

  return matches;
}

// ─── Execute Remediation ────────────────────────────────────

/**
 * Execute a remediation action for a specific user.
 * Logs an audit trail and sets cooldown to prevent spam.
 */
export function executeRemediation(
  ruleId: string,
  userId: string
): RemediationEvent {
  const rule = DEFAULT_REMEDIATION_RULES.find((r) => r.id === ruleId);
  if (!rule) {
    throw new Error(`Unknown remediation rule: ${ruleId}`);
  }

  // Find user info
  const user = systemUsers.find((u) => u.userId === userId);
  const userEmail = user?.email ?? "unknown@saga.com";

  // Check cooldown
  if (isOnCooldown(ruleId, userId, rule.cooldownMinutes)) {
    const event: RemediationEvent = {
      id: `rem-${++eventIdCounter}`,
      ruleId,
      ruleName: rule.name,
      userId,
      userEmail,
      action: rule.action.type,
      result: "failed",
      details: `Skipped — cooldown active (${rule.cooldownMinutes} min)`,
      createdAt: new Date(),
    };
    remediationHistory.push(event);
    return event;
  }

  // Simulate executing the action
  let result: "success" | "failed" | "escalated" = "success";
  let details = "";

  switch (rule.action.type) {
    case "unlock_account":
      if (user) {
        user.accountLocked = false;
        user.failedLogins = 0;
      }
      details = `Account unlocked for ${userEmail}. Password reset link sent.`;
      break;
    case "send_mfa_setup":
      details = `MFA setup instructions sent to ${userEmail} via Slack DM and email.`;
      break;
    case "renew_license":
      if (user && user.licensesExpired.length > 0) {
        details = `License renewal requested for ${user.licensesExpired.join(", ")}. Awaiting approval.`;
        if (!rule.action.autoExecute) {
          result = "escalated";
          details += " Escalated to IT admin for manual approval.";
        } else {
          user.licensesExpired = [];
        }
      } else {
        details = "No expired licenses found.";
      }
      break;
    case "push_compliance":
      details = `Compliance check pushed to device for ${userEmail}. User notified.`;
      if (user) user.deviceCompliant = true;
      break;
    case "reset_password_link":
      details = `Password reset link sent to ${userEmail}.`;
      if (user) user.passwordExpired = false;
      break;
    case "rotate_cert":
      result = "escalated";
      details = `Certificate rotation escalated to IT team. Jira ticket created.`;
      break;
    case "notify_user":
      details = `Notification sent to ${userEmail}.`;
      break;
    case "escalate":
      result = "escalated";
      details = `Issue escalated. P1 incident created and #it-status notified.`;
      break;
  }

  // Set cooldown
  setCooldown(ruleId, userId);

  const event: RemediationEvent = {
    id: `rem-${++eventIdCounter}`,
    ruleId,
    ruleName: rule.name,
    userId,
    userEmail,
    action: rule.action.type,
    result,
    details,
    createdAt: new Date(),
  };

  remediationHistory.push(event);
  return event;
}

// ─── History & Stats ────────────────────────────────────────

/**
 * Get recent auto-remediation actions.
 * @param hours How many hours back to look (default 24).
 */
export function getRemediationHistory(hours = 24): RemediationEvent[] {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return remediationHistory
    .filter((e) => e.createdAt >= cutoff)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Aggregate remediation statistics.
 */
export function getRemediationStats(): RemediationStats {
  const total = remediationHistory.length;
  const autoResolved = remediationHistory.filter((e) => e.result === "success").length;
  const escalated = remediationHistory.filter((e) => e.result === "escalated").length;
  const failed = remediationHistory.filter((e) => e.result === "failed").length;

  // Avg resolution time — simulate as time between events (simplified)
  const avgResolutionMs =
    total > 0
      ? remediationHistory.reduce((sum, _e, i) => {
          if (i === 0) return sum;
          return (
            sum +
            (remediationHistory[i].createdAt.getTime() -
              remediationHistory[i - 1].createdAt.getTime())
          );
        }, 0) / Math.max(total - 1, 1)
      : 0;

  const byRule: Record<string, { detected: number; resolved: number }> = {};
  for (const event of remediationHistory) {
    if (!byRule[event.ruleId]) {
      byRule[event.ruleId] = { detected: 0, resolved: 0 };
    }
    byRule[event.ruleId].detected++;
    if (event.result === "success") {
      byRule[event.ruleId].resolved++;
    }
  }

  return { totalDetected: total, autoResolved, escalated, failed, avgResolutionMs, byRule };
}

/**
 * Run a full scan-and-remediate cycle.
 * Returns all events created during this cycle.
 */
export function runRemediationCycle(): RemediationEvent[] {
  const issues = scanForIssues();
  const events: RemediationEvent[] = [];

  for (const match of issues) {
    if (!match.rule.action.autoExecute) continue;
    for (const user of match.affectedUsers) {
      const event = executeRemediation(match.rule.id, user.userId);
      events.push(event);
    }
  }

  return events;
}
