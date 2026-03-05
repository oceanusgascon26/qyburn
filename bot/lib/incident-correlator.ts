/**
 * Incident Correlation Engine
 *
 * Year 3 Q1 — Self-Healing Infrastructure: Scans recent conversations
 * and issues to detect incident clusters. Groups similar reports within
 * time windows, auto-creates P1 incidents when thresholds are met,
 * and provides status update broadcasting.
 */

// ─── Types ───────────────────────────────────────────────────

export interface IncidentCluster {
  id: string;
  title: string;
  severity: "P1" | "P2" | "P3";
  affectedUsers: string[];
  relatedConversations: string[];
  symptoms: string[];
  possibleCause: string;
  status: "detecting" | "confirmed" | "mitigating" | "resolved";
  startedAt: Date;
  resolvedAt?: Date;
  statusUpdates: IncidentStatusUpdate[];
  jiraTicketKey?: string;
}

export interface IncidentStatusUpdate {
  timestamp: Date;
  status: string;
  message: string;
  author: string;
}

export interface ConversationSignal {
  conversationId: string;
  userId: string;
  userEmail: string;
  intent: string;
  keywords: string[];
  timestamp: Date;
}

export interface CorrelationResult {
  newIncidents: IncidentCluster[];
  updatedIncidents: IncidentCluster[];
  signals: ConversationSignal[];
}

// ─── In-Memory Store ────────────────────────────────────────

const activeIncidents: IncidentCluster[] = [];
const resolvedIncidents: IncidentCluster[] = [];
let incidentIdCounter = 0;

// ─── Mock Conversation Signals ──────────────────────────────

const recentSignals: ConversationSignal[] = [
  {
    conversationId: "conv-201",
    userId: "user-010",
    userEmail: "anna.berg@saga.com",
    intent: "email_not_working",
    keywords: ["email", "outlook", "not loading", "stuck"],
    timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 min ago
  },
  {
    conversationId: "conv-202",
    userId: "user-011",
    userEmail: "karl.lund@saga.com",
    intent: "email_not_working",
    keywords: ["outlook", "cannot send", "error"],
    timestamp: new Date(Date.now() - 6 * 60 * 1000),
  },
  {
    conversationId: "conv-203",
    userId: "user-012",
    userEmail: "lisa.ek@saga.com",
    intent: "email_not_working",
    keywords: ["email", "down", "not receiving"],
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    conversationId: "conv-204",
    userId: "user-013",
    userEmail: "erik.nils@saga.com",
    intent: "email_not_working",
    keywords: ["outlook", "frozen", "exchange"],
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
  },
  {
    conversationId: "conv-205",
    userId: "user-014",
    userEmail: "sara.blom@saga.com",
    intent: "email_not_working",
    keywords: ["email", "outage", "not working"],
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
  },
  {
    conversationId: "conv-206",
    userId: "user-015",
    userEmail: "johan.dahl@saga.com",
    intent: "vpn_issues",
    keywords: ["vpn", "disconnect", "remote"],
    timestamp: new Date(Date.now() - 7 * 60 * 1000),
  },
  {
    conversationId: "conv-207",
    userId: "user-016",
    userEmail: "emma.sven@saga.com",
    intent: "vpn_issues",
    keywords: ["vpn", "slow", "timeout"],
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    conversationId: "conv-208",
    userId: "user-017",
    userEmail: "oscar.ring@saga.com",
    intent: "vpn_issues",
    keywords: ["vpn", "cannot connect", "globalprotect"],
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
  },
];

// ─── Keyword-to-Cause Mapping ───────────────────────────────

const CAUSE_MAP: Record<string, string> = {
  email_not_working: "Exchange Online service disruption — possible mailbox server issue or network connectivity to Microsoft 365",
  vpn_issues: "VPN gateway overload or certificate issue — GlobalProtect concentrator may need restart",
  login_failed: "Azure AD authentication service degradation — possible conditional access policy misconfiguration",
  slow_performance: "Network congestion or endpoint resource exhaustion — check bandwidth utilization and CPU/memory",
  teams_issues: "Microsoft Teams service incident — check Microsoft 365 service health dashboard",
  printer_issues: "Print server spooler crash — restart spooler service on print servers",
};

// ─── Correlation Logic ──────────────────────────────────────

/**
 * Scan recent conversations and issues for correlated incidents.
 * Groups by similar intents within a 10-minute window.
 * - 3+ users reporting similar issues -> cluster as potential incident
 * - 5+ users -> auto-create P1 incident
 */
export function correlateIncidents(): CorrelationResult {
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const now = Date.now();
  const result: CorrelationResult = {
    newIncidents: [],
    updatedIncidents: [],
    signals: recentSignals,
  };

  // Group signals by intent within the time window
  const intentGroups: Map<string, ConversationSignal[]> = new Map();

  for (const signal of recentSignals) {
    if (now - signal.timestamp.getTime() > windowMs) continue;

    const group = intentGroups.get(signal.intent) ?? [];
    group.push(signal);
    intentGroups.set(signal.intent, group);
  }

  // Check each group against thresholds
  for (const [intent, signals] of intentGroups) {
    if (signals.length < 3) continue;

    // Check if we already have an active incident for this intent
    const existing = activeIncidents.find(
      (inc) =>
        inc.status !== "resolved" &&
        inc.possibleCause === (CAUSE_MAP[intent] ?? `Unknown cause for ${intent}`)
    );

    if (existing) {
      // Update existing incident with new affected users
      let updated = false;
      for (const signal of signals) {
        if (!existing.affectedUsers.includes(signal.userEmail)) {
          existing.affectedUsers.push(signal.userEmail);
          updated = true;
        }
        if (!existing.relatedConversations.includes(signal.conversationId)) {
          existing.relatedConversations.push(signal.conversationId);
        }
      }

      // Upgrade severity if more users affected
      if (existing.affectedUsers.length >= 5 && existing.severity !== "P1") {
        existing.severity = "P1";
        existing.statusUpdates.push({
          timestamp: new Date(),
          status: "escalated",
          message: `Upgraded to P1 — ${existing.affectedUsers.length} users affected`,
          author: "qyburn-bot",
        });
        updated = true;
      }

      if (updated) {
        result.updatedIncidents.push(existing);
      }
    } else {
      // Create new incident cluster
      const severity = signals.length >= 5 ? "P1" : "P2";
      const allSymptoms = [...new Set(signals.flatMap((s) => s.keywords))];
      const cause = CAUSE_MAP[intent] ?? `Multiple users reporting: ${intent}`;

      const incident: IncidentCluster = {
        id: `inc-${++incidentIdCounter}`,
        title: `${intent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — ${signals.length} Reports`,
        severity,
        affectedUsers: signals.map((s) => s.userEmail),
        relatedConversations: signals.map((s) => s.conversationId),
        symptoms: allSymptoms,
        possibleCause: cause,
        status: severity === "P1" ? "confirmed" : "detecting",
        startedAt: new Date(Math.min(...signals.map((s) => s.timestamp.getTime()))),
        statusUpdates: [
          {
            timestamp: new Date(),
            status: "created",
            message: `Incident detected: ${signals.length} users reporting ${intent.replace(/_/g, " ")}`,
            author: "qyburn-bot",
          },
        ],
      };

      activeIncidents.push(incident);
      result.newIncidents.push(incident);
    }
  }

  return result;
}

// ─── Create Incident ────────────────────────────────────────

/**
 * Manually create an incident. In production, this would create a Jira P1
 * ticket and post to #it-status.
 */
export function createIncident(
  cluster: Omit<IncidentCluster, "id" | "statusUpdates">
): IncidentCluster {
  const incident: IncidentCluster = {
    ...cluster,
    id: `inc-${++incidentIdCounter}`,
    statusUpdates: [
      {
        timestamp: new Date(),
        status: "created",
        message: `Incident created: ${cluster.title}`,
        author: "qyburn-bot",
      },
    ],
  };

  // Simulate Jira ticket creation
  incident.jiraTicketKey = `IT-${300 + incidentIdCounter}`;
  incident.statusUpdates.push({
    timestamp: new Date(),
    status: "jira_created",
    message: `Jira ticket ${incident.jiraTicketKey} created. #it-status notified.`,
    author: "qyburn-bot",
  });

  activeIncidents.push(incident);
  return incident;
}

// ─── Update Incident Status ────────────────────────────────

/**
 * Post a status update to an incident. Broadcasts to all affected users.
 */
export function updateIncidentStatus(
  incidentId: string,
  status: string,
  update: string
): IncidentCluster | null {
  const incident = activeIncidents.find((inc) => inc.id === incidentId);
  if (!incident) return null;

  incident.statusUpdates.push({
    timestamp: new Date(),
    status,
    message: update,
    author: "qyburn-bot",
  });

  // Update incident status if applicable
  if (status === "mitigating") {
    incident.status = "mitigating";
  } else if (status === "resolved") {
    incident.status = "resolved";
    incident.resolvedAt = new Date();
    // Move to resolved list
    const idx = activeIncidents.indexOf(incident);
    if (idx >= 0) {
      activeIncidents.splice(idx, 1);
      resolvedIncidents.push(incident);
    }
  } else if (status === "confirmed") {
    incident.status = "confirmed";
  }

  return incident;
}

// ─── Queries ────────────────────────────────────────────────

/**
 * Get all active (non-resolved) incidents.
 */
export function getActiveIncidents(): IncidentCluster[] {
  return activeIncidents
    .filter((inc) => inc.status !== "resolved")
    .sort((a, b) => {
      const severityOrder = { P1: 0, P2: 1, P3: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

/**
 * Get all incidents including resolved, sorted by start time descending.
 */
export function getAllIncidents(): IncidentCluster[] {
  return [...activeIncidents, ...resolvedIncidents].sort(
    (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
  );
}

/**
 * Get a single incident by ID.
 */
export function getIncident(incidentId: string): IncidentCluster | null {
  return (
    activeIncidents.find((inc) => inc.id === incidentId) ??
    resolvedIncidents.find((inc) => inc.id === incidentId) ??
    null
  );
}
