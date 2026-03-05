/**
 * IT Change Management Engine
 *
 * Year 3 Q1 — Self-Healing Infrastructure: Manages scheduled IT changes
 * with notification to affected users, status tracking, rollback support,
 * and calendar views.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ScheduledChange {
  id: string;
  title: string;
  description: string;
  type: "maintenance" | "upgrade" | "migration" | "security_patch" | "configuration";
  scheduledStart: Date;
  scheduledEnd: Date;
  affectedSystems: string[];
  affectedUsers: string[];
  riskLevel: "low" | "medium" | "high";
  status: "planned" | "in_progress" | "completed" | "rolled_back";
  rollbackPlan: string;
  owner: string;
  notes?: string;
  createdAt: Date;
}

export interface ChangeCalendarEntry {
  id: string;
  title: string;
  type: string;
  scheduledStart: string;
  scheduledEnd: string;
  riskLevel: string;
  status: string;
  owner: string;
  affectedSystems: string[];
}

// ─── In-Memory Store ────────────────────────────────────────

let changeIdCounter = 0;

const scheduledChanges: ScheduledChange[] = [
  {
    id: "chg-001",
    title: "Exchange Online Cumulative Update",
    description: "Apply latest Exchange Online cumulative update to improve mail flow reliability and patch CVE-2026-1234.",
    type: "security_patch",
    scheduledStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    scheduledEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    affectedSystems: ["Exchange Online", "Outlook", "Mail Flow"],
    affectedUsers: ["all-staff@saga.com"],
    riskLevel: "medium",
    status: "planned",
    rollbackPlan: "Revert CU via Exchange rollback procedure. ETA 2 hours.",
    owner: "chris.gascon@saga.com",
    createdAt: new Date(),
  },
  {
    id: "chg-002",
    title: "Azure AD Connect Server Migration",
    description: "Migrate Azure AD Connect to new Windows Server 2025 instance. Directory sync will be paused during migration.",
    type: "migration",
    scheduledStart: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    affectedSystems: ["Azure AD Connect", "Active Directory", "Azure AD"],
    affectedUsers: ["it-team@saga.com"],
    riskLevel: "high",
    status: "planned",
    rollbackPlan: "Repoint sync to old server. Verify delta sync completes successfully.",
    owner: "chris.gascon@saga.com",
    createdAt: new Date(),
  },
  {
    id: "chg-003",
    title: "Network Switch Firmware Update",
    description: "Update firmware on core switches in server room. Brief connectivity blips expected.",
    type: "maintenance",
    scheduledStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    affectedSystems: ["Network Infrastructure", "Wi-Fi", "VPN"],
    affectedUsers: ["all-staff@saga.com"],
    riskLevel: "low",
    status: "planned",
    rollbackPlan: "Roll back firmware to previous version via console. ETA 30 min.",
    owner: "chris.gascon@saga.com",
    createdAt: new Date(),
  },
  {
    id: "chg-004",
    title: "Intune Policy Refresh — Compliance Baselines",
    description: "Update device compliance baselines to enforce BitLocker and Windows Defender ATP. Non-compliant devices will be flagged.",
    type: "configuration",
    scheduledStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
    affectedSystems: ["Intune", "Endpoint Manager", "Windows Devices"],
    affectedUsers: ["all-staff@saga.com"],
    riskLevel: "low",
    status: "planned",
    rollbackPlan: "Revert compliance policy to previous version in Intune console.",
    owner: "chris.gascon@saga.com",
    createdAt: new Date(),
  },
];

// ─── Schedule Change ────────────────────────────────────────

/**
 * Register a new planned change.
 */
export function scheduleChange(
  change: Omit<ScheduledChange, "id" | "status" | "createdAt">
): ScheduledChange {
  const newChange: ScheduledChange = {
    ...change,
    id: `chg-${String(++changeIdCounter).padStart(3, "0")}`,
    status: "planned",
    createdAt: new Date(),
  };
  scheduledChanges.push(newChange);
  return newChange;
}

// ─── Notify Affected Users ──────────────────────────────────

/**
 * Message all affected users via Slack about an upcoming change.
 * In production, sends actual Slack messages.
 */
export function notifyAffectedUsers(changeId: string): {
  success: boolean;
  notified: string[];
  message: string;
} {
  const change = scheduledChanges.find((c) => c.id === changeId);
  if (!change) {
    return { success: false, notified: [], message: `Change ${changeId} not found` };
  }

  // Simulate notification
  const startStr = change.scheduledStart.toLocaleString();
  const endStr = change.scheduledEnd.toLocaleString();
  const message = [
    `:construction: *Scheduled Change Notice*`,
    `*${change.title}*`,
    `> ${change.description}`,
    `*Window:* ${startStr} — ${endStr}`,
    `*Affected Systems:* ${change.affectedSystems.join(", ")}`,
    `*Risk Level:* ${change.riskLevel.toUpperCase()}`,
    `*Owner:* ${change.owner}`,
  ].join("\n");

  return {
    success: true,
    notified: change.affectedUsers,
    message: `Notification sent to ${change.affectedUsers.length} user(s): ${message}`,
  };
}

// ─── Start Change ───────────────────────────────────────────

/**
 * Mark a change as in-progress and post to #it-status.
 */
export function startChange(changeId: string): ScheduledChange | null {
  const change = scheduledChanges.find((c) => c.id === changeId);
  if (!change || change.status !== "planned") return null;

  change.status = "in_progress";
  // In production: post to #it-status Slack channel
  return change;
}

// ─── Complete Change ────────────────────────────────────────

/**
 * Mark a change as completed with notes and run a health check.
 */
export function completeChange(
  changeId: string,
  notes: string
): ScheduledChange | null {
  const change = scheduledChanges.find((c) => c.id === changeId);
  if (!change || change.status !== "in_progress") return null;

  change.status = "completed";
  change.notes = notes;
  // In production: run health checks on affected systems
  return change;
}

// ─── Rollback Change ────────────────────────────────────────

/**
 * Trigger the rollback plan for a change.
 */
export function rollbackChange(
  changeId: string,
  reason: string
): ScheduledChange | null {
  const change = scheduledChanges.find((c) => c.id === changeId);
  if (!change || (change.status !== "in_progress" && change.status !== "completed")) {
    return null;
  }

  change.status = "rolled_back";
  change.notes = `ROLLED BACK: ${reason}\n\nRollback plan executed: ${change.rollbackPlan}`;
  // In production: execute rollback commands, post to #it-status
  return change;
}

// ─── Queries ────────────────────────────────────────────────

/**
 * List upcoming planned changes.
 */
export function getUpcomingChanges(): ScheduledChange[] {
  return scheduledChanges
    .filter((c) => c.status === "planned" || c.status === "in_progress")
    .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());
}

/**
 * Get all changes for calendar view.
 */
export function getChangeCalendar(): ChangeCalendarEntry[] {
  return scheduledChanges
    .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())
    .map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      scheduledStart: c.scheduledStart.toISOString(),
      scheduledEnd: c.scheduledEnd.toISOString(),
      riskLevel: c.riskLevel,
      status: c.status,
      owner: c.owner,
      affectedSystems: c.affectedSystems,
    }));
}

/**
 * Get a single change by ID.
 */
export function getChange(changeId: string): ScheduledChange | null {
  return scheduledChanges.find((c) => c.id === changeId) ?? null;
}

/**
 * Get all changes (including completed/rolled back).
 */
export function getAllChanges(): ScheduledChange[] {
  return [...scheduledChanges].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}
