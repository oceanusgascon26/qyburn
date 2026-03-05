/**
 * License Usage Analytics & Cost Optimization
 *
 * Year 2 Q1 — Predictive IT: Analyzes license utilization across the org,
 * identifies waste, generates optimization recommendations, and predicts
 * future license needs based on department growth patterns.
 */

import {
  licenses,
  licenseAssignments,
  type License,
  type LicenseAssignment,
} from "@/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────

export interface LicenseUsageAssignment {
  userId: string;
  email: string;
  assignedAt: Date;
  lastActiveAt?: Date;
  isActive: boolean;
}

export interface LicenseUsage {
  licenseId: string;
  name: string;
  vendor: string;
  totalSeats: number;
  usedSeats: number;
  costPerSeat: number;
  monthlyTotal: number;
  assignments: LicenseUsageAssignment[];
  utilizationPct: number;
  unusedSeats: number;
  potentialSavings: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: "reclaim" | "downgrade" | "billing_change" | "consolidate";
  licenseId: string;
  licenseName: string;
  description: string;
  savingsAmount: number;
  savingsPeriod: "month" | "year";
  affectedUsers: number;
  priority: "high" | "medium" | "low";
}

export interface LicenseNeedPrediction {
  department: string;
  licenseId: string;
  licenseName: string;
  currentAssigned: number;
  projectedNeed: number;
  monthsOut: number;
  additionalNeeded: number;
  estimatedCost: number;
  explanation: string;
}

export interface DepartmentCostBreakdown {
  department: string;
  totalMonthlyCost: number;
  licenses: {
    licenseId: string;
    licenseName: string;
    seats: number;
    monthlyCost: number;
  }[];
}

// ─── Mock Extended Data ──────────────────────────────────────
// Extends the base mock data with activity and department info

interface ExtendedAssignment extends LicenseAssignment {
  lastActiveAt?: string;
  department?: string;
}

const extendedAssignments: ExtendedAssignment[] = [
  // M365 E3 assignments
  { id: "la-001", licenseId: "lic-001", userId: "user-001", userEmail: "anna.lindberg@saga.com", assignedAt: "2024-07-01T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-03-03T14:00:00Z", department: "Diagnostics" },
  { id: "la-002", licenseId: "lic-001", userId: "user-002", userEmail: "erik.svensson@saga.com", assignedAt: "2024-07-01T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-03-04T09:00:00Z", department: "Engineering" },
  { id: "la-010", licenseId: "lic-001", userId: "user-010", userEmail: "sofia.berg@saga.com", assignedAt: "2024-08-15T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2025-12-10T09:00:00Z", department: "Marketing" },
  { id: "la-011", licenseId: "lic-001", userId: "user-011", userEmail: "karl.nilsson@saga.com", assignedAt: "2024-09-01T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-01-05T09:00:00Z", department: "Engineering" },
  { id: "la-012", licenseId: "lic-001", userId: "user-012", userEmail: "lena.holm@saga.com", assignedAt: "2024-10-01T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-03-01T11:00:00Z", department: "Finance" },

  // Adobe CC assignments
  { id: "la-004", licenseId: "lic-002", userId: "user-003", userEmail: "maria.chen@saga.com", assignedAt: "2024-10-01T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2026-03-02T15:00:00Z", department: "Marketing" },
  { id: "la-020", licenseId: "lic-002", userId: "user-020", userEmail: "jonas.alm@saga.com", assignedAt: "2024-11-01T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2025-11-15T09:00:00Z", department: "Engineering" },
  { id: "la-021", licenseId: "lic-002", userId: "user-021", userEmail: "nina.dahl@saga.com", assignedAt: "2024-12-01T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2025-12-20T09:00:00Z", department: "Marketing" },
  { id: "la-022", licenseId: "lic-002", userId: "user-022", userEmail: "oskar.falk@saga.com", assignedAt: "2025-01-15T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2025-10-01T09:00:00Z", department: "Diagnostics" },
  { id: "la-023", licenseId: "lic-002", userId: "user-023", userEmail: "emma.gran@saga.com", assignedAt: "2025-02-01T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2025-09-15T09:00:00Z", department: "HR" },
  { id: "la-024", licenseId: "lic-002", userId: "user-024", userEmail: "lars.hall@saga.com", assignedAt: "2025-03-01T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2025-11-20T09:00:00Z", department: "Engineering" },
  { id: "la-025", licenseId: "lic-002", userId: "user-025", userEmail: "ida.jong@saga.com", assignedAt: "2025-04-01T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2025-08-10T09:00:00Z", department: "Finance" },
  { id: "la-026", licenseId: "lic-002", userId: "user-026", userEmail: "per.kvist@saga.com", assignedAt: "2025-05-01T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2025-07-01T09:00:00Z", department: "Diagnostics" },

  // JetBrains assignments
  { id: "la-003", licenseId: "lic-003", userId: "user-002", userEmail: "erik.svensson@saga.com", assignedAt: "2024-08-15T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-03-04T08:30:00Z", department: "Engineering" },
  { id: "la-030", licenseId: "lic-003", userId: "user-030", userEmail: "viktor.lund@saga.com", assignedAt: "2024-09-01T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-03-03T17:00:00Z", department: "Engineering" },
  { id: "la-031", licenseId: "lic-003", userId: "user-031", userEmail: "hanna.nord@saga.com", assignedAt: "2024-10-01T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-02-28T16:00:00Z", department: "Engineering" },
  { id: "la-032", licenseId: "lic-003", userId: "user-032", userEmail: "tobias.oberg@saga.com", assignedAt: "2025-01-01T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2025-12-15T09:00:00Z", department: "Engineering" },
  { id: "la-033", licenseId: "lic-003", userId: "user-033", userEmail: "sara.palm@saga.com", assignedAt: "2025-02-01T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-01-20T09:00:00Z", department: "Engineering" },

  // Slack Pro — everyone active
  { id: "la-040", licenseId: "lic-004", userId: "user-001", userEmail: "anna.lindberg@saga.com", assignedAt: "2024-06-15T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-03-04T09:00:00Z", department: "Diagnostics" },
  { id: "la-041", licenseId: "lic-004", userId: "user-002", userEmail: "erik.svensson@saga.com", assignedAt: "2024-06-15T10:00:00Z", assignedBy: "qyburn-bot", lastActiveAt: "2026-03-04T09:00:00Z", department: "Engineering" },

  // Figma
  { id: "la-050", licenseId: "lic-005", userId: "user-050", userEmail: "alice.roth@saga.com", assignedAt: "2024-09-15T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2026-03-03T12:00:00Z", department: "Marketing" },
  { id: "la-051", licenseId: "lic-005", userId: "user-051", userEmail: "ben.storm@saga.com", assignedAt: "2024-10-01T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2025-06-01T09:00:00Z", department: "Engineering" },
  { id: "la-052", licenseId: "lic-005", userId: "user-052", userEmail: "clara.vik@saga.com", assignedAt: "2025-01-15T10:00:00Z", assignedBy: "admin@saga.com", lastActiveAt: "2026-02-25T16:00:00Z", department: "Marketing" },
];

// Department growth rates (mock) — monthly new hires per dept
const departmentGrowthRates: Record<string, number> = {
  Engineering: 2.5,
  Marketing: 1.0,
  Diagnostics: 1.5,
  Finance: 0.5,
  HR: 0.3,
};

// Department → license mapping (which licenses each dept typically needs)
const departmentLicenses: Record<string, string[]> = {
  Engineering: ["lic-001", "lic-003", "lic-004"],
  Marketing: ["lic-001", "lic-002", "lic-004", "lic-005"],
  Diagnostics: ["lic-001", "lic-004"],
  Finance: ["lic-001", "lic-004"],
  HR: ["lic-001", "lic-004"],
};

// ─── Public API ──────────────────────────────────────────────

/**
 * Analyze license usage across all licenses.
 * Calculates utilization, identifies waste, and sorts by savings potential.
 */
export function analyzeLicenseUsage(): LicenseUsage[] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return licenses
    .map((license) => {
      const assignments = extendedAssignments
        .filter((a) => a.licenseId === license.id)
        .map((a) => {
          const lastActive = a.lastActiveAt
            ? new Date(a.lastActiveAt)
            : undefined;
          const isActive = lastActive ? lastActive >= thirtyDaysAgo : false;

          return {
            userId: a.userId,
            email: a.userEmail,
            assignedAt: new Date(a.assignedAt),
            lastActiveAt: lastActive,
            isActive,
          };
        });

      const costPerSeat = license.costPerSeat ?? 0;
      const unusedSeats = license.totalSeats - license.usedSeats;
      const inactiveAssignments = assignments.filter((a) => !a.isActive);
      const potentialSavings = inactiveAssignments.length * costPerSeat;
      const utilizationPct =
        license.totalSeats > 0
          ? Math.round(
              (license.usedSeats / license.totalSeats) * 100 * 10
            ) / 10
          : 0;

      return {
        licenseId: license.id,
        name: license.name,
        vendor: license.vendor,
        totalSeats: license.totalSeats,
        usedSeats: license.usedSeats,
        costPerSeat,
        monthlyTotal: license.usedSeats * costPerSeat,
        assignments,
        utilizationPct,
        unusedSeats,
        potentialSavings,
      };
    })
    .sort((a, b) => b.potentialSavings - a.potentialSavings);
}

/**
 * Generate specific optimization recommendations.
 * Returns actionable suggestions with cost savings estimates.
 */
export function getOptimizationRecommendations(): OptimizationRecommendation[] {
  const usages = analyzeLicenseUsage();
  const recommendations: OptimizationRecommendation[] = [];
  let recId = 0;

  for (const usage of usages) {
    const inactiveCount = usage.assignments.filter((a) => !a.isActive).length;

    // Reclaim unused licenses
    if (inactiveCount > 0 && usage.costPerSeat > 0) {
      recId++;
      const savings = Math.round(inactiveCount * usage.costPerSeat * 100) / 100;
      recommendations.push({
        id: `rec-${recId}`,
        type: "reclaim",
        licenseId: usage.licenseId,
        licenseName: usage.name,
        description: `Reclaim ${inactiveCount} unused ${usage.name} license${inactiveCount !== 1 ? "s" : ""} (inactive >30 days) → save $${savings.toLocaleString()}/month`,
        savingsAmount: savings,
        savingsPeriod: "month",
        affectedUsers: inactiveCount,
        priority: savings > 500 ? "high" : savings > 100 ? "medium" : "low",
      });
    }

    // Downgrade M365 E5 → E3 for email-only users (hypothetical)
    if (usage.name === "Microsoft 365 E3") {
      const emailOnlyCount = 5; // stub: users who only use Outlook/Teams
      const downgradeSavings = emailOnlyCount * 13; // E5→E3 price diff
      recId++;
      recommendations.push({
        id: `rec-${recId}`,
        type: "downgrade",
        licenseId: usage.licenseId,
        licenseName: usage.name,
        description: `Downgrade ${emailOnlyCount} M365 E5 to E3 for users only using email → save $${downgradeSavings}/month`,
        savingsAmount: downgradeSavings,
        savingsPeriod: "month",
        affectedUsers: emailOnlyCount,
        priority: "medium",
      });
    }

    // Annual billing recommendation for JetBrains
    if (usage.vendor === "JetBrains") {
      const annualDiscount = 0.15;
      const annualSavings = Math.round(
        usage.monthlyTotal * 12 * annualDiscount * 100
      ) / 100;
      recId++;
      recommendations.push({
        id: `rec-${recId}`,
        type: "billing_change",
        licenseId: usage.licenseId,
        licenseName: usage.name,
        description: `Consider annual billing for ${usage.name} (15% discount) → save $${annualSavings.toLocaleString()}/year`,
        savingsAmount: annualSavings,
        savingsPeriod: "year",
        affectedUsers: usage.usedSeats,
        priority: annualSavings > 300 ? "medium" : "low",
      });
    }

    // Low utilization warning
    if (usage.utilizationPct < 50 && usage.totalSeats > 10) {
      recId++;
      const excessSeats = Math.floor(usage.unusedSeats * 0.5);
      const savings = excessSeats * usage.costPerSeat;
      recommendations.push({
        id: `rec-${recId}`,
        type: "consolidate",
        licenseId: usage.licenseId,
        licenseName: usage.name,
        description: `${usage.name} utilization is only ${usage.utilizationPct}%. Consider reducing total seats by ${excessSeats} → save $${Math.round(savings).toLocaleString()}/month`,
        savingsAmount: Math.round(savings * 100) / 100,
        savingsPeriod: "month",
        affectedUsers: 0,
        priority: "low",
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Predict future license needs for a department.
 * Uses linear projection from hiring rate and current assignment patterns.
 */
export function predictLicenseNeeds(
  department: string,
  months: number
): LicenseNeedPrediction[] {
  const growthRate = departmentGrowthRates[department] ?? 1.0;
  const deptLicenses = departmentLicenses[department] ?? ["lic-001", "lic-004"];
  const predictions: LicenseNeedPrediction[] = [];

  for (const licId of deptLicenses) {
    const license = licenses.find((l) => l.id === licId);
    if (!license) continue;

    const currentDeptAssignments = extendedAssignments.filter(
      (a) => a.licenseId === licId && a.department === department
    ).length;

    // Project: current + (growth_rate * months)
    const projectedNew = Math.ceil(growthRate * months);
    const projectedNeed = currentDeptAssignments + projectedNew;
    const costPerSeat = license.costPerSeat ?? 0;
    const additionalNeeded = projectedNew;
    const estimatedCost = additionalNeeded * costPerSeat;

    const quarterLabel =
      months <= 3
        ? "this quarter"
        : months <= 6
          ? "next quarter"
          : `in ${months} months`;

    predictions.push({
      department,
      licenseId: licId,
      licenseName: license.name,
      currentAssigned: currentDeptAssignments,
      projectedNeed,
      monthsOut: months,
      additionalNeeded,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      explanation: `${department} will need ~${additionalNeeded} more ${license.name} licenses ${quarterLabel} based on hiring rate of ${growthRate}/month`,
    });
  }

  return predictions.filter((p) => p.additionalNeeded > 0);
}

/**
 * Get per-department cost allocation breakdown.
 */
export function getLicenseCostBreakdown(): DepartmentCostBreakdown[] {
  const deptMap = new Map<
    string,
    Map<string, { licenseId: string; licenseName: string; seats: number; monthlyCost: number }>
  >();

  for (const assignment of extendedAssignments) {
    const dept = assignment.department ?? "Unknown";
    const license = licenses.find((l) => l.id === assignment.licenseId);
    if (!license) continue;

    if (!deptMap.has(dept)) {
      deptMap.set(dept, new Map());
    }

    const deptLicenses = deptMap.get(dept)!;
    const costPerSeat = license.costPerSeat ?? 0;

    if (!deptLicenses.has(license.id)) {
      deptLicenses.set(license.id, {
        licenseId: license.id,
        licenseName: license.name,
        seats: 0,
        monthlyCost: 0,
      });
    }

    const entry = deptLicenses.get(license.id)!;
    entry.seats += 1;
    entry.monthlyCost += costPerSeat;
  }

  const breakdowns: DepartmentCostBreakdown[] = [];

  for (const [department, licMap] of deptMap) {
    const licenseEntries = Array.from(licMap.values());
    const totalMonthlyCost = licenseEntries.reduce(
      (sum, l) => sum + l.monthlyCost,
      0
    );

    breakdowns.push({
      department,
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      licenses: licenseEntries.sort((a, b) => b.monthlyCost - a.monthlyCost),
    });
  }

  return breakdowns.sort((a, b) => b.totalMonthlyCost - a.totalMonthlyCost);
}

/**
 * Get total monthly spend across all licenses.
 */
export function getTotalMonthlySpend(): number {
  return licenses.reduce(
    (sum, l) => sum + l.usedSeats * (l.costPerSeat ?? 0),
    0
  );
}

/**
 * Get total potential savings from all recommendations.
 */
export function getTotalPotentialSavings(): {
  monthly: number;
  annual: number;
} {
  const recs = getOptimizationRecommendations();
  let monthly = 0;
  let annual = 0;

  for (const rec of recs) {
    if (rec.savingsPeriod === "month") {
      monthly += rec.savingsAmount;
    } else {
      annual += rec.savingsAmount;
    }
  }

  return {
    monthly: Math.round(monthly * 100) / 100,
    annual: Math.round((monthly * 12 + annual) * 100) / 100,
  };
}
