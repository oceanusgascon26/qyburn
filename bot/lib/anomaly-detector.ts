/**
 * IT Anomaly Detection Engine
 *
 * Year 2 Q1 — Predictive IT: Scans recent activity for suspicious patterns
 * including bulk requests, off-hours activity, permission escalation,
 * unusual cross-department requests, and failed login patterns.
 */

import {
  auditLogs,
  licenseAssignments,
  groupAccessRequests,
  type AuditLogEntry,
} from "@/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────

export interface ITAnomaly {
  id: string;
  type:
    | "bulk_request"
    | "off_hours"
    | "permission_escalation"
    | "unusual_pattern"
    | "failed_logins";
  severity: "critical" | "high" | "medium" | "low";
  userId?: string;
  userEmail?: string;
  description: string;
  details: Record<string, unknown>;
  detectedAt: Date;
  acknowledged: boolean;
}

export interface AnomalySummary {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  unacknowledged: number;
  critical: number;
}

// ─── In-memory store ─────────────────────────────────────────

const detectedAnomalies: ITAnomaly[] = [];
let anomalyIdCounter = 0;

// ─── Mock activity data for detection ────────────────────────

interface ActivityRecord {
  userId: string;
  userEmail: string;
  action: string;
  target: string;
  timestamp: string;
  department: string;
}

const recentActivity: ActivityRecord[] = [
  // Bulk request pattern — james.patel made 6 requests in one day
  { userId: "user-004", userEmail: "james.patel@saga.com", action: "license.request", target: "Adobe CC", timestamp: "2026-03-04T09:00:00Z", department: "Engineering" },
  { userId: "user-004", userEmail: "james.patel@saga.com", action: "license.request", target: "Figma", timestamp: "2026-03-04T09:05:00Z", department: "Engineering" },
  { userId: "user-004", userEmail: "james.patel@saga.com", action: "license.request", target: "Miro", timestamp: "2026-03-04T09:10:00Z", department: "Engineering" },
  { userId: "user-004", userEmail: "james.patel@saga.com", action: "group.request", target: "SG-Finance-Sensitive", timestamp: "2026-03-04T09:15:00Z", department: "Engineering" },
  { userId: "user-004", userEmail: "james.patel@saga.com", action: "group.request", target: "SG-Lab-Admin", timestamp: "2026-03-04T09:20:00Z", department: "Engineering" },
  { userId: "user-004", userEmail: "james.patel@saga.com", action: "license.request", target: "Datadog", timestamp: "2026-03-04T09:25:00Z", department: "Engineering" },

  // Off-hours activity
  { userId: "user-010", userEmail: "sofia.berg@saga.com", action: "license.request", target: "JetBrains", timestamp: "2026-03-04T02:30:00Z", department: "Marketing" },
  { userId: "user-010", userEmail: "sofia.berg@saga.com", action: "group.request", target: "SG-Engineering-Admin", timestamp: "2026-03-04T03:15:00Z", department: "Marketing" },

  // Permission escalation — marketing user requesting engineering admin
  { userId: "user-003", userEmail: "maria.chen@saga.com", action: "group.request", target: "SG-Engineering-Admin", timestamp: "2026-03-03T14:00:00Z", department: "Marketing" },

  // Unusual pattern — finance user requesting engineering tools
  { userId: "user-012", userEmail: "lena.holm@saga.com", action: "license.request", target: "JetBrains All Products", timestamp: "2026-03-03T10:00:00Z", department: "Finance" },
  { userId: "user-012", userEmail: "lena.holm@saga.com", action: "license.request", target: "GitHub Copilot", timestamp: "2026-03-03T10:05:00Z", department: "Finance" },

  // Normal activity
  { userId: "user-002", userEmail: "erik.svensson@saga.com", action: "license.request", target: "Datadog", timestamp: "2026-03-04T10:00:00Z", department: "Engineering" },
  { userId: "user-001", userEmail: "anna.lindberg@saga.com", action: "kb.query", target: "VPN setup", timestamp: "2026-03-04T08:30:00Z", department: "Diagnostics" },
];

// Mock failed login data
interface FailedLogin {
  userId: string;
  userEmail: string;
  attempts: number;
  lastAttempt: string;
  ipAddress: string;
}

const failedLogins: FailedLogin[] = [
  { userId: "user-020", userEmail: "jonas.alm@saga.com", attempts: 5, lastAttempt: "2026-03-04T08:45:00Z", ipAddress: "185.220.101.42" },
  { userId: "user-011", userEmail: "karl.nilsson@saga.com", attempts: 3, lastAttempt: "2026-03-04T07:30:00Z", ipAddress: "10.0.1.55" },
  { userId: "user-050", userEmail: "alice.roth@saga.com", attempts: 4, lastAttempt: "2026-03-03T22:10:00Z", ipAddress: "92.63.194.12" },
];

// Department → typical tools mapping for anomaly detection
const departmentTools: Record<string, string[]> = {
  Engineering: ["JetBrains", "GitHub Copilot", "Datadog", "Figma", "Miro"],
  Marketing: ["Adobe CC", "Figma", "Canva", "HubSpot"],
  Diagnostics: ["LabVIEW", "LIMS", "Prism"],
  Finance: ["SAP", "Excel", "Power BI"],
  HR: ["BambooHR", "DocuSign"],
};

// Admin-level groups
const adminGroups = [
  "SG-Engineering-Admin",
  "SG-Lab-Instruments-Admin",
  "SG-Finance-Sensitive",
];

// ─── Detection Functions ─────────────────────────────────────

function detectBulkRequests(): ITAnomaly[] {
  const anomalies: ITAnomaly[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Group activity by user per day
  const userDailyRequests = new Map<string, ActivityRecord[]>();

  for (const activity of recentActivity) {
    if (
      activity.action === "license.request" ||
      activity.action === "group.request"
    ) {
      const actDate = activity.timestamp.split("T")[0];
      if (actDate === today || actDate === "2026-03-04") {
        const key = activity.userId;
        if (!userDailyRequests.has(key)) {
          userDailyRequests.set(key, []);
        }
        userDailyRequests.get(key)!.push(activity);
      }
    }
  }

  for (const [userId, requests] of userDailyRequests) {
    if (requests.length >= 5) {
      anomalyIdCounter++;
      anomalies.push({
        id: `anomaly-${anomalyIdCounter}`,
        type: "bulk_request",
        severity: requests.length >= 8 ? "critical" : "high",
        userId,
        userEmail: requests[0].userEmail,
        description: `${requests[0].userEmail} made ${requests.length} access requests in a single day`,
        details: {
          requestCount: requests.length,
          targets: requests.map((r) => r.target),
          timespan: `${requests[0].timestamp} to ${requests[requests.length - 1].timestamp}`,
        },
        detectedAt: new Date(),
        acknowledged: false,
      });
    }
  }

  return anomalies;
}

function detectOffHoursActivity(): ITAnomaly[] {
  const anomalies: ITAnomaly[] = [];

  for (const activity of recentActivity) {
    const hour = new Date(activity.timestamp).getUTCHours();
    // Off-hours: 11pm-5am (23-5 UTC, adjust for local)
    if (hour >= 23 || hour < 5) {
      anomalyIdCounter++;
      anomalies.push({
        id: `anomaly-${anomalyIdCounter}`,
        type: "off_hours",
        severity: "medium",
        userId: activity.userId,
        userEmail: activity.userEmail,
        description: `${activity.userEmail} submitted ${activity.action} for ${activity.target} at ${new Date(activity.timestamp).toLocaleTimeString()} (off-hours)`,
        details: {
          action: activity.action,
          target: activity.target,
          timestamp: activity.timestamp,
          hour,
        },
        detectedAt: new Date(),
        acknowledged: false,
      });
    }
  }

  return anomalies;
}

function detectPermissionEscalation(): ITAnomaly[] {
  const anomalies: ITAnomaly[] = [];

  for (const activity of recentActivity) {
    if (activity.action !== "group.request") continue;

    const isAdminGroup = adminGroups.some(
      (g) => activity.target.includes(g) || activity.target.includes("Admin")
    );

    if (isAdminGroup) {
      // Check if this user has ever been in an admin group (stub: assume they haven't)
      const hasHistory = false; // In production, check group membership history
      if (!hasHistory) {
        anomalyIdCounter++;
        anomalies.push({
          id: `anomaly-${anomalyIdCounter}`,
          type: "permission_escalation",
          severity: "high",
          userId: activity.userId,
          userEmail: activity.userEmail,
          description: `${activity.userEmail} (${activity.department}) requested admin-level group "${activity.target}" with no prior admin access`,
          details: {
            group: activity.target,
            department: activity.department,
            previousAdminAccess: false,
          },
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }
  }

  return anomalies;
}

function detectUnusualPatterns(): ITAnomaly[] {
  const anomalies: ITAnomaly[] = [];

  for (const activity of recentActivity) {
    if (activity.action !== "license.request") continue;

    const deptTools = departmentTools[activity.department] ?? [];
    const isTypical = deptTools.some((tool) =>
      activity.target.toLowerCase().includes(tool.toLowerCase())
    );

    if (!isTypical) {
      // Check if this is a tool typically associated with another department
      let associatedDept: string | null = null;
      for (const [dept, tools] of Object.entries(departmentTools)) {
        if (dept === activity.department) continue;
        if (
          tools.some((t) =>
            activity.target.toLowerCase().includes(t.toLowerCase())
          )
        ) {
          associatedDept = dept;
          break;
        }
      }

      if (associatedDept) {
        anomalyIdCounter++;
        anomalies.push({
          id: `anomaly-${anomalyIdCounter}`,
          type: "unusual_pattern",
          severity: "low",
          userId: activity.userId,
          userEmail: activity.userEmail,
          description: `${activity.userEmail} in ${activity.department} requested ${activity.target} (typically used by ${associatedDept})`,
          details: {
            userDepartment: activity.department,
            requestedTool: activity.target,
            typicalDepartment: associatedDept,
          },
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }
  }

  return anomalies;
}

function detectFailedLogins(): ITAnomaly[] {
  const anomalies: ITAnomaly[] = [];

  for (const record of failedLogins) {
    if (record.attempts >= 3) {
      anomalyIdCounter++;
      const isExternal = !record.ipAddress.startsWith("10.");
      anomalies.push({
        id: `anomaly-${anomalyIdCounter}`,
        type: "failed_logins",
        severity:
          record.attempts >= 5
            ? "critical"
            : isExternal
              ? "high"
              : "medium",
        userId: record.userId,
        userEmail: record.userEmail,
        description: `${record.userEmail} had ${record.attempts} failed login attempts${isExternal ? " from external IP" : ""}`,
        details: {
          attempts: record.attempts,
          lastAttempt: record.lastAttempt,
          ipAddress: record.ipAddress,
          isExternalIP: isExternal,
        },
        detectedAt: new Date(),
        acknowledged: false,
      });
    }
  }

  return anomalies;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Scan all recent activity for anomalies.
 * Runs all detection rules and returns combined results.
 */
export function detectAnomalies(): ITAnomaly[] {
  // Clear previous detections and re-scan
  detectedAnomalies.length = 0;
  anomalyIdCounter = 0;

  const allAnomalies = [
    ...detectBulkRequests(),
    ...detectOffHoursActivity(),
    ...detectPermissionEscalation(),
    ...detectUnusualPatterns(),
    ...detectFailedLogins(),
  ];

  // Deduplicate by user+type combo
  const seen = new Set<string>();
  for (const anomaly of allAnomalies) {
    const key = `${anomaly.userId}-${anomaly.type}-${anomaly.description}`;
    if (!seen.has(key)) {
      seen.add(key);
      detectedAnomalies.push(anomaly);
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  detectedAnomalies.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return [...detectedAnomalies];
}

/**
 * Get summary counts of anomalies by type and severity.
 */
export function getAnomalySummary(): AnomalySummary {
  if (detectedAnomalies.length === 0) {
    detectAnomalies();
  }

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let unacknowledged = 0;
  let critical = 0;

  for (const anomaly of detectedAnomalies) {
    byType[anomaly.type] = (byType[anomaly.type] ?? 0) + 1;
    bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] ?? 0) + 1;
    if (!anomaly.acknowledged) unacknowledged++;
    if (anomaly.severity === "critical") critical++;
  }

  return {
    total: detectedAnomalies.length,
    byType,
    bySeverity,
    unacknowledged,
    critical,
  };
}

/**
 * Mark an anomaly as reviewed/acknowledged.
 */
export function acknowledgeAnomaly(
  anomalyId: string
): ITAnomaly | null {
  const anomaly = detectedAnomalies.find((a) => a.id === anomalyId);
  if (!anomaly) return null;
  anomaly.acknowledged = true;
  return { ...anomaly };
}

/**
 * Get all detected anomalies (optionally filtered).
 */
export function getAnomalies(filters?: {
  type?: string;
  severity?: string;
  acknowledged?: boolean;
}): ITAnomaly[] {
  if (detectedAnomalies.length === 0) {
    detectAnomalies();
  }

  let result = [...detectedAnomalies];

  if (filters?.type) {
    result = result.filter((a) => a.type === filters.type);
  }
  if (filters?.severity) {
    result = result.filter((a) => a.severity === filters.severity);
  }
  if (filters?.acknowledged !== undefined) {
    result = result.filter((a) => a.acknowledged === filters.acknowledged);
  }

  return result;
}
