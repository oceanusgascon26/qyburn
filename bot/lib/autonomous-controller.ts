/**
 * Autonomous Operations Controller — Year 3 Q4.
 *
 * Orchestrates and measures the system's autonomous capabilities.
 * Tracks deflection rates, auto-resolution, cost savings, and
 * recommends automation expansions.
 */

import {
  auditLogs,
  licenses,
  licenseAssignments,
} from "../../src/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────

export interface AutonomousMetrics {
  deflectionRate: number;
  autoResolvedCount: number;
  totalRequestCount: number;
  humanInterventions: number;
  avgAutoResolutionMinutes: number;
  costSavingsEstimate: number;
  topAutoResolvedCategories: { category: string; count: number }[];
}

export interface AutonomyScore {
  score: number; // 0–100
  components: {
    name: string;
    score: number;
    weight: number;
    description: string;
  }[];
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface AutomationRecommendation {
  id: string;
  process: string;
  currentState: string;
  proposedAutomation: string;
  estimatedVolume: number;
  estimatedTimeSaved: number; // hours per month
  effort: "low" | "medium" | "high";
  impact: "high" | "medium" | "low";
}

// ─── Constants ──────────────────────────────────────────────

const AVG_HUMAN_COST_PER_TICKET = 25; // $25 per manual resolution
const AVG_AUTO_RESOLUTION_MINUTES = 2.5;

// ─── Functions ───────────────────────────────────────────────

/**
 * Calculate autonomous operations metrics.
 */
export function getAutonomousMetrics(
  period?: string
): AutonomousMetrics {
  // Analyze audit logs for bot vs human actions
  const botActions = auditLogs.filter((l) => l.actor === "qyburn-bot");
  const humanActions = auditLogs.filter((l) => l.actor !== "qyburn-bot");

  // Categorize bot actions
  const categoryMap: Record<string, number> = {};
  for (const action of botActions) {
    const category = action.action.split(".")[0];
    categoryMap[category] = (categoryMap[category] ?? 0) + 1;
  }

  const topCategories = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  // Calculate metrics
  const totalRequests = auditLogs.length;
  const autoResolved = botActions.filter(
    (l) =>
      l.action.includes("assign") ||
      l.action.includes("provision") ||
      l.action.includes("revoke") ||
      l.action.includes("query") ||
      l.action.includes("onboarding")
  ).length;

  const humanInterventions = humanActions.filter(
    (l) =>
      l.action.includes("approve") ||
      l.action.includes("manual") ||
      l.action.includes("escalate")
  ).length;

  const deflectionRate =
    totalRequests > 0 ? (autoResolved / totalRequests) * 100 : 0;

  const costSavings = autoResolved * AVG_HUMAN_COST_PER_TICKET;

  return {
    deflectionRate: Math.round(deflectionRate * 10) / 10,
    autoResolvedCount: autoResolved,
    totalRequestCount: totalRequests,
    humanInterventions,
    avgAutoResolutionMinutes: AVG_AUTO_RESOLUTION_MINUTES,
    costSavingsEstimate: costSavings,
    topAutoResolvedCategories: topCategories,
  };
}

/**
 * Calculate 0-100 autonomy score.
 * Weights: deflection (40%), auto-provisioning (20%),
 * proactive resolution (20%), mean time to resolution (20%).
 */
export function getAutonomyScore(): AutonomyScore {
  const metrics = getAutonomousMetrics();

  // Deflection rate component (40%)
  const deflectionScore = Math.min(100, metrics.deflectionRate * 1.25);

  // Auto-provisioning rate (20%)
  const totalAssignments = licenseAssignments.length;
  const botAssignments = licenseAssignments.filter(
    (a) => a.assignedBy === "qyburn-bot" || a.assignedBy === "qyburn-onboarding"
  ).length;
  const autoProvisioningRate =
    totalAssignments > 0
      ? (botAssignments / totalAssignments) * 100
      : 0;
  const provisioningScore = Math.min(100, autoProvisioningRate * 1.2);

  // Proactive resolution rate (20%)
  const proactiveActions = auditLogs.filter(
    (l) =>
      l.action.includes("proactive") ||
      l.action.includes("anomaly") ||
      l.action.includes("shadow_it")
  ).length;
  const proactiveRate =
    auditLogs.length > 0
      ? (proactiveActions / auditLogs.length) * 100
      : 0;
  const proactiveScore = Math.min(100, proactiveRate * 5);

  // Mean time to resolution (20%)
  // Lower is better — 2.5 min average = 95 score, 30+ min = 30 score
  const mttrScore = Math.max(
    0,
    100 - (metrics.avgAutoResolutionMinutes - 1) * 3.5
  );

  const components = [
    {
      name: "Deflection Rate",
      score: Math.round(deflectionScore),
      weight: 40,
      description: `${metrics.deflectionRate}% of requests resolved without human intervention`,
    },
    {
      name: "Auto-Provisioning",
      score: Math.round(provisioningScore),
      weight: 20,
      description: `${Math.round(autoProvisioningRate)}% of licenses provisioned automatically`,
    },
    {
      name: "Proactive Resolution",
      score: Math.round(proactiveScore),
      weight: 20,
      description: `${proactiveActions} proactive actions taken this period`,
    },
    {
      name: "Mean Time to Resolution",
      score: Math.round(mttrScore),
      weight: 20,
      description: `${metrics.avgAutoResolutionMinutes} minutes average auto-resolution time`,
    },
  ];

  const overallScore = Math.round(
    components.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0)
  );

  const grade: AutonomyScore["grade"] =
    overallScore >= 90
      ? "A"
      : overallScore >= 75
        ? "B"
        : overallScore >= 60
          ? "C"
          : overallScore >= 40
            ? "D"
            : "F";

  return { score: overallScore, components, grade };
}

/**
 * Suggest which manual processes could be automated next.
 */
export function recommendAutonomyExpansion(): AutomationRecommendation[] {
  return [
    {
      id: "rec-001",
      process: "Software Access Requests",
      currentState: "Manager approval required for non-standard software",
      proposedAutomation:
        "Auto-approve based on department + role + cost threshold rules",
      estimatedVolume: 45,
      estimatedTimeSaved: 12,
      effort: "low",
      impact: "high",
    },
    {
      id: "rec-002",
      process: "Quarterly Access Reviews",
      currentState: "Manual spreadsheet-based review every 90 days",
      proposedAutomation:
        "Automated review notifications with one-click keep/revoke via Slack",
      estimatedVolume: 120,
      estimatedTimeSaved: 20,
      effort: "medium",
      impact: "high",
    },
    {
      id: "rec-003",
      process: "Password Reset Requests",
      currentState: "Users contact IT support for password resets",
      proposedAutomation:
        "Self-service via Qyburn with MFA verification — zero IT involvement",
      estimatedVolume: 80,
      estimatedTimeSaved: 15,
      effort: "low",
      impact: "high",
    },
    {
      id: "rec-004",
      process: "New Hire Equipment Ordering",
      currentState: "IT manually orders and configures equipment per new hire",
      proposedAutomation:
        "Auto-trigger equipment order when onboarding is initiated based on role template",
      estimatedVolume: 8,
      estimatedTimeSaved: 6,
      effort: "medium",
      impact: "medium",
    },
    {
      id: "rec-005",
      process: "License Reclamation on Departure",
      currentState: "Manual license recovery 7-14 days after offboarding",
      proposedAutomation:
        "Instant automated reclamation triggered by HR termination event",
      estimatedVolume: 5,
      estimatedTimeSaved: 4,
      effort: "low",
      impact: "medium",
    },
    {
      id: "rec-006",
      process: "Shadow IT Remediation",
      currentState: "Periodic manual audit of unauthorized SaaS usage",
      proposedAutomation:
        "Continuous monitoring with automated user notifications and migration guidance",
      estimatedVolume: 30,
      estimatedTimeSaved: 8,
      effort: "medium",
      impact: "high",
    },
    {
      id: "rec-007",
      process: "Security Alert Triage",
      currentState: "IT team manually reviews all Defender alerts",
      proposedAutomation:
        "AI-powered triage with auto-remediation for known patterns, escalation for novel threats",
      estimatedVolume: 200,
      estimatedTimeSaved: 25,
      effort: "high",
      impact: "high",
    },
  ];
}
