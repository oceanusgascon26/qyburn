/**
 * Shadow IT Detection — Year 3 Q4 Autonomous Operations.
 *
 * Scans for unauthorized SaaS usage, suggests sanctioned alternatives,
 * and notifies affected users.
 */

import { createAuditLog } from "../../src/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────

export interface ShadowITApp {
  name: string;
  category: string;
  usersDetected: number;
  firstSeen: Date;
  riskLevel: "high" | "medium" | "low";
  sanctionedAlternative?: string;
}

export interface ShadowITDetection {
  id: string;
  appName: string;
  category: string;
  usersDetected: number;
  riskLevel: "high" | "medium" | "low";
  sanctionedAlternative?: string;
  status: "detected" | "notified" | "resolved" | "accepted";
  affectedUsers: string[];
  firstSeen: Date;
  updatedAt: Date;
}

export interface ShadowITStats {
  totalAppsDetected: number;
  totalUsersAffected: number;
  riskDistribution: { high: number; medium: number; low: number };
  statusDistribution: {
    detected: number;
    notified: number;
    resolved: number;
    accepted: number;
  };
  topApps: { name: string; users: number; risk: string }[];
}

// ─── Sanctioned Alternatives Map ────────────────────────────

const SANCTIONED_ALTERNATIVES: Record<string, string> = {
  Dropbox: "OneDrive / SharePoint",
  "Google Drive": "OneDrive / SharePoint",
  Box: "OneDrive / SharePoint",
  Trello: "Jira / Azure DevOps",
  Asana: "Jira / Azure DevOps",
  Monday: "Jira / Azure DevOps",
  Notion: "Confluence / SharePoint",
  Coda: "Confluence / SharePoint",
  Airtable: "SharePoint Lists / Power Apps",
  Discord: "Microsoft Teams",
  "WhatsApp Business": "Microsoft Teams",
  Telegram: "Microsoft Teams",
  Canva: "Adobe Creative Cloud",
  Miro: "Microsoft Whiteboard",
  Loom: "Microsoft Stream",
  "Personal Gmail": "Microsoft 365 (corporate email)",
  "Yahoo Mail": "Microsoft 365 (corporate email)",
  ChatGPT: "Qyburn AI / Azure OpenAI",
  Grammarly: "Microsoft Editor",
};

// ─── In-Memory Store ────────────────────────────────────────

const detections: ShadowITDetection[] = [
  {
    id: "shadow-001",
    appName: "Dropbox",
    category: "Cloud Storage",
    usersDetected: 5,
    riskLevel: "medium",
    sanctionedAlternative: "OneDrive / SharePoint",
    status: "detected",
    affectedUsers: [
      "anna.lindberg@saga.com",
      "erik.svensson@saga.com",
      "maria.chen@saga.com",
      "james.patel@saga.com",
      "new.hire@saga.com",
    ],
    firstSeen: new Date("2025-01-15"),
    updatedAt: new Date("2025-02-26"),
  },
  {
    id: "shadow-002",
    appName: "Trello",
    category: "Project Management",
    usersDetected: 3,
    riskLevel: "low",
    sanctionedAlternative: "Jira / Azure DevOps",
    status: "notified",
    affectedUsers: [
      "erik.svensson@saga.com",
      "james.patel@saga.com",
      "dev.lead@saga.com",
    ],
    firstSeen: new Date("2025-01-20"),
    updatedAt: new Date("2025-02-20"),
  },
  {
    id: "shadow-003",
    appName: "Notion",
    category: "Documentation",
    usersDetected: 8,
    riskLevel: "medium",
    sanctionedAlternative: "Confluence / SharePoint",
    status: "detected",
    affectedUsers: [
      "anna.lindberg@saga.com",
      "erik.svensson@saga.com",
      "maria.chen@saga.com",
      "james.patel@saga.com",
      "product.manager@saga.com",
      "designer@saga.com",
      "qa.lead@saga.com",
      "intern@saga.com",
    ],
    firstSeen: new Date("2025-02-01"),
    updatedAt: new Date("2025-02-26"),
  },
  {
    id: "shadow-004",
    appName: "ChatGPT",
    category: "AI Tools",
    usersDetected: 12,
    riskLevel: "high",
    sanctionedAlternative: "Qyburn AI / Azure OpenAI",
    status: "detected",
    affectedUsers: [
      "anna.lindberg@saga.com",
      "erik.svensson@saga.com",
      "maria.chen@saga.com",
      "james.patel@saga.com",
      "dev.lead@saga.com",
      "product.manager@saga.com",
      "designer@saga.com",
      "qa.lead@saga.com",
      "intern@saga.com",
      "hr.manager@saga.com",
      "finance.analyst@saga.com",
      "lab.tech@saga.com",
    ],
    firstSeen: new Date("2025-01-10"),
    updatedAt: new Date("2025-02-26"),
  },
  {
    id: "shadow-005",
    appName: "Personal Gmail",
    category: "Email Forwarding",
    usersDetected: 2,
    riskLevel: "high",
    sanctionedAlternative: "Microsoft 365 (corporate email)",
    status: "detected",
    affectedUsers: ["intern@saga.com", "temp.contractor@saga.com"],
    firstSeen: new Date("2025-02-10"),
    updatedAt: new Date("2025-02-26"),
  },
];

// ─── Functions ───────────────────────────────────────────────

/**
 * Scan for unauthorized SaaS usage.
 * Stub: Checks audit logs for OAuth consents and SSO logs for unknown apps.
 */
export function detectShadowIT(): ShadowITApp[] {
  console.log(
    "[SHADOW-IT] Scanning OAuth app consents and SSO sign-in logs..."
  );

  createAuditLog({
    actor: "qyburn-bot",
    action: "shadow_it.scan",
    target: null,
    targetId: null,
    details: JSON.stringify({
      appsDetected: detections.length,
      timestamp: new Date().toISOString(),
    }),
    channel: null,
  });

  return detections.map((d) => ({
    name: d.appName,
    category: d.category,
    usersDetected: d.usersDetected,
    firstSeen: d.firstSeen,
    riskLevel: d.riskLevel,
    sanctionedAlternative: d.sanctionedAlternative,
  }));
}

/**
 * Suggest the approved corporate tool for a detected shadow IT app.
 */
export function getSanctionedAlternative(
  appName: string
): string | undefined {
  return SANCTIONED_ALTERNATIVES[appName];
}

/**
 * Notify detected users about the shadow IT finding and suggest alternatives.
 */
export function notifyUsers(
  appName: string
): { notified: number; users: string[] } {
  const detection = detections.find((d) => d.appName === appName);
  if (!detection) {
    return { notified: 0, users: [] };
  }

  const alternative =
    detection.sanctionedAlternative ??
    SANCTIONED_ALTERNATIVES[appName] ??
    "N/A";

  // Stub: Send Slack DM to each affected user
  for (const email of detection.affectedUsers) {
    console.log(
      `[SHADOW-IT] Notifying ${email}: "${appName}" is not a sanctioned tool. ` +
        `Please use "${alternative}" instead. Contact IT if you need help migrating.`
    );
  }

  detection.status = "notified";
  detection.updatedAt = new Date();

  createAuditLog({
    actor: "qyburn-bot",
    action: "shadow_it.notify",
    target: appName,
    targetId: detection.id,
    details: JSON.stringify({
      usersNotified: detection.affectedUsers.length,
      alternative,
    }),
    channel: null,
  });

  return {
    notified: detection.affectedUsers.length,
    users: detection.affectedUsers,
  };
}

/**
 * Get shadow IT statistics.
 */
export function getShadowITStats(): ShadowITStats {
  const uniqueUsers = new Set(detections.flatMap((d) => d.affectedUsers));

  const riskDistribution = { high: 0, medium: 0, low: 0 };
  const statusDistribution = {
    detected: 0,
    notified: 0,
    resolved: 0,
    accepted: 0,
  };

  for (const d of detections) {
    riskDistribution[d.riskLevel]++;
    statusDistribution[d.status]++;
  }

  const topApps = detections
    .sort((a, b) => b.usersDetected - a.usersDetected)
    .slice(0, 5)
    .map((d) => ({
      name: d.appName,
      users: d.usersDetected,
      risk: d.riskLevel,
    }));

  return {
    totalAppsDetected: detections.length,
    totalUsersAffected: uniqueUsers.size,
    riskDistribution,
    statusDistribution,
    topApps,
  };
}

/**
 * Get all detections.
 */
export function getDetections(
  status?: string
): ShadowITDetection[] {
  if (status) {
    return detections.filter((d) => d.status === status);
  }
  return [...detections];
}

/**
 * Update a detection status.
 */
export function updateDetectionStatus(
  id: string,
  status: ShadowITDetection["status"]
): ShadowITDetection | null {
  const detection = detections.find((d) => d.id === id);
  if (!detection) return null;

  detection.status = status;
  detection.updatedAt = new Date();
  return detection;
}
