/**
 * IT Budget Forecaster — Year 3 Q4 Autonomous Operations.
 *
 * Predicts IT spending based on license costs, renewals, hiring plans,
 * and historical trends. Identifies optimization opportunities.
 */

import { licenses, onboardingTemplates } from "../../src/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────

export interface BudgetForecast {
  period: string;
  predicted: number;
  breakdown: {
    category: string;
    amount: number;
    trend: "up" | "down" | "flat";
  }[];
  risks: string[];
  opportunities: string[];
  confidence: number;
}

export interface Optimization {
  id: string;
  category: string;
  description: string;
  potentialSavings: number;
  period: string;
  effort: "low" | "medium" | "high";
  priority: "high" | "medium" | "low";
}

export interface SpendVsBudget {
  period: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  categories: {
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[];
}

// ─── Helpers ────────────────────────────────────────────────

function getCurrentLicenseMonthlyCost(): number {
  return licenses.reduce((sum, l) => {
    return sum + l.usedSeats * (l.costPerSeat ?? 0);
  }, 0);
}

function getQuarterLabel(offset: number): string {
  const now = new Date();
  const month = now.getMonth() + offset * 3;
  const year = now.getFullYear() + Math.floor(month / 12);
  const q = Math.floor((month % 12) / 3) + 1;
  return `Q${q} ${year}`;
}

// ─── Functions ───────────────────────────────────────────────

/**
 * Predict IT spending for the next N quarters.
 */
export function forecastBudget(quarters: number = 4): BudgetForecast[] {
  const baseMonthlyCost = getCurrentLicenseMonthlyCost();
  const forecasts: BudgetForecast[] = [];

  // Growth assumptions
  const headcountGrowthRate = 0.03; // 3% per quarter
  const licenseInflationRate = 0.02; // 2% annual price increases
  const hiresPerQuarter = onboardingTemplates.length * 2; // estimate

  for (let q = 1; q <= quarters; q++) {
    const growthMultiplier = Math.pow(1 + headcountGrowthRate, q);
    const inflationMultiplier = Math.pow(
      1 + licenseInflationRate / 4,
      q
    );

    // License costs
    const licenseCost =
      baseMonthlyCost * 3 * growthMultiplier * inflationMultiplier;

    // Infrastructure costs (servers, cloud, network)
    const infraCost = 8500 * 3 * (1 + q * 0.01);

    // Support costs (tooling, contractors)
    const supportCost = 3200 * 3;

    // New hire provisioning costs
    const provisioningCost = hiresPerQuarter * 150;

    const total = licenseCost + infraCost + supportCost + provisioningCost;

    const risks: string[] = [];
    const opportunities: string[] = [];

    if (q <= 2) {
      risks.push("Adobe Creative Cloud renewal due — potential 8% price increase");
      opportunities.push(
        "Consolidate JetBrains licenses — 15% unused seats reclaimable"
      );
    }
    if (q === 2 || q === 4) {
      risks.push("Annual Microsoft EA renewal — budget for 5% increase");
    }
    if (q >= 3) {
      risks.push(
        "Headcount growth may require additional M365 E5 upgrades"
      );
      opportunities.push(
        "Negotiate volume discount at 200+ seat threshold"
      );
    }

    opportunities.push(
      "Automate offboarding reduces manual license recovery time by 4h/week"
    );

    forecasts.push({
      period: getQuarterLabel(q),
      predicted: Math.round(total * 100) / 100,
      breakdown: [
        {
          category: "Software Licenses",
          amount: Math.round(licenseCost * 100) / 100,
          trend: "up",
        },
        {
          category: "Infrastructure",
          amount: Math.round(infraCost * 100) / 100,
          trend: q > 2 ? "up" : "flat",
        },
        {
          category: "Support & Tooling",
          amount: Math.round(supportCost * 100) / 100,
          trend: "flat",
        },
        {
          category: "Provisioning",
          amount: Math.round(provisioningCost * 100) / 100,
          trend: "up",
        },
      ],
      risks,
      opportunities,
      confidence: Math.max(60, 95 - q * 8), // decreases further out
    });
  }

  return forecasts;
}

/**
 * Identify actionable cost reduction opportunities.
 */
export function identifyOptimizations(): Optimization[] {
  const optimizations: Optimization[] = [];

  // Analyze each license for underutilization
  for (const license of licenses) {
    const utilization = license.totalSeats > 0
      ? (license.usedSeats / license.totalSeats) * 100
      : 100;
    const unusedSeats = license.totalSeats - license.usedSeats;
    const monthlySavings = unusedSeats * (license.costPerSeat ?? 0);

    if (utilization < 80 && monthlySavings > 50) {
      optimizations.push({
        id: `opt-${license.id}`,
        category: "License Right-Sizing",
        description: `Reduce ${license.name} from ${license.totalSeats} to ${license.usedSeats + 5} seats (${unusedSeats} unused)`,
        potentialSavings: Math.round(monthlySavings * 12),
        period: "annual",
        effort: "low",
        priority: monthlySavings > 200 ? "high" : "medium",
      });
    }
  }

  // Generic optimizations
  optimizations.push(
    {
      id: "opt-auto-offboard",
      category: "Process Automation",
      description:
        "Enable automated offboarding — reclaim licenses within 24h of termination instead of avg 14 days",
      potentialSavings: 4800,
      period: "annual",
      effort: "medium",
      priority: "high",
    },
    {
      id: "opt-sso-consolidation",
      category: "Vendor Consolidation",
      description:
        "Consolidate SSO to single provider — eliminate redundant identity management costs",
      potentialSavings: 3600,
      period: "annual",
      effort: "high",
      priority: "medium",
    },
    {
      id: "opt-shadow-it",
      category: "Shadow IT Elimination",
      description:
        "Migrate shadow IT users to sanctioned tools — reduce security risk and duplicate spending",
      potentialSavings: 6200,
      period: "annual",
      effort: "medium",
      priority: "high",
    }
  );

  return optimizations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Compare actual spend vs planned budget.
 */
export function getSpendVsBudget(): SpendVsBudget {
  const currentMonthlyLicenseCost = getCurrentLicenseMonthlyCost();

  // Simulated budget figures (would come from finance system)
  const budgetedLicense = currentMonthlyLicenseCost * 1.1; // 10% buffer
  const budgetedInfra = 8500;
  const budgetedSupport = 3200;
  const budgetedTotal = budgetedLicense + budgetedInfra + budgetedSupport;

  // Actual figures
  const actualInfra = 8200;
  const actualSupport = 3400;
  const actualTotal =
    currentMonthlyLicenseCost + actualInfra + actualSupport;

  const variance = actualTotal - budgetedTotal;
  const variancePercent =
    budgetedTotal > 0 ? (variance / budgetedTotal) * 100 : 0;

  return {
    period: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    budgeted: Math.round(budgetedTotal * 100) / 100,
    actual: Math.round(actualTotal * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    variancePercent: Math.round(variancePercent * 10) / 10,
    categories: [
      {
        category: "Software Licenses",
        budgeted: Math.round(budgetedLicense * 100) / 100,
        actual: Math.round(currentMonthlyLicenseCost * 100) / 100,
        variance: Math.round(
          (currentMonthlyLicenseCost - budgetedLicense) * 100
        ) / 100,
      },
      {
        category: "Infrastructure",
        budgeted: budgetedInfra,
        actual: actualInfra,
        variance: actualInfra - budgetedInfra,
      },
      {
        category: "Support & Tooling",
        budgeted: budgetedSupport,
        actual: actualSupport,
        variance: actualSupport - budgetedSupport,
      },
    ],
  };
}
