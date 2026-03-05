/**
 * Executive IT Dashboard Metrics Engine
 *
 * Year 3 Q2 — IT Intelligence Platform: Aggregates metrics across all
 * systems for executive-level reporting. Cost per user, bot deflection
 * rate, resolution time, license utilization, security score, and
 * department breakdowns.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ExecutiveMetrics {
  period: string;
  costPerUser: number;
  totalITSpend: number;
  botDeflectionRate: number;
  avgResolutionMinutes: number;
  ticketVolume: number;
  userSatisfaction: number;
  licenseUtilization: number;
  securityScore: number;
  complianceRate: number;
  topCostDrivers: { name: string; cost: number; trend: string }[];
  departmentBreakdown: {
    dept: string;
    users: number;
    spend: number;
    tickets: number;
    satisfaction: number;
  }[];
}

export interface CostAllocation {
  department: string;
  totalCost: number;
  perUserCost: number;
  userCount: number;
  breakdown: { category: string; cost: number }[];
}

export interface VendorSpend {
  vendor: string;
  totalSpend: number;
  licenses: { name: string; cost: number; seats: number; renewalDate: string }[];
  trend: "up" | "down" | "flat";
  changePercent: number;
}

export interface TrendDataPoint {
  month: string;
  costPerUser: number;
  deflectionRate: number;
  resolution: number;
  satisfaction: number;
  ticketVolume: number;
  securityScore: number;
}

// ─── Mock Data ──────────────────────────────────────────────

const DEPARTMENT_DATA = [
  { dept: "Engineering", users: 45, baseCost: 52000, tickets: 120, satisfaction: 4.2 },
  { dept: "Sales", users: 30, baseCost: 38000, tickets: 85, satisfaction: 3.8 },
  { dept: "Research", users: 25, baseCost: 41000, tickets: 60, satisfaction: 4.5 },
  { dept: "Finance", users: 15, baseCost: 18000, tickets: 35, satisfaction: 4.1 },
  { dept: "Marketing", users: 20, baseCost: 24000, tickets: 50, satisfaction: 3.9 },
  { dept: "HR", users: 10, baseCost: 12000, tickets: 25, satisfaction: 4.3 },
  { dept: "Operations", users: 12, baseCost: 15000, tickets: 30, satisfaction: 4.0 },
  { dept: "Legal", users: 8, baseCost: 11000, tickets: 18, satisfaction: 4.4 },
];

const VENDOR_DATA: VendorSpend[] = [
  {
    vendor: "Microsoft",
    totalSpend: 89000,
    licenses: [
      { name: "Microsoft 365 E5", cost: 57000, seats: 165, renewalDate: "2026-09-01" },
      { name: "Azure", cost: 22000, seats: 1, renewalDate: "2026-12-01" },
      { name: "Power BI Pro", cost: 10000, seats: 45, renewalDate: "2026-09-01" },
    ],
    trend: "up",
    changePercent: 8,
  },
  {
    vendor: "Atlassian",
    totalSpend: 18500,
    licenses: [
      { name: "Jira Software", cost: 12000, seats: 80, renewalDate: "2026-07-15" },
      { name: "Confluence", cost: 6500, seats: 120, renewalDate: "2026-07-15" },
    ],
    trend: "flat",
    changePercent: 2,
  },
  {
    vendor: "Slack",
    totalSpend: 15200,
    licenses: [
      { name: "Slack Business+", cost: 15200, seats: 165, renewalDate: "2026-11-01" },
    ],
    trend: "down",
    changePercent: -5,
  },
  {
    vendor: "Salesforce",
    totalSpend: 42000,
    licenses: [
      { name: "Sales Cloud Enterprise", cost: 36000, seats: 30, renewalDate: "2026-06-01" },
      { name: "Service Cloud", cost: 6000, seats: 10, renewalDate: "2026-06-01" },
    ],
    trend: "up",
    changePercent: 12,
  },
  {
    vendor: "Qualio",
    totalSpend: 24000,
    licenses: [
      { name: "Qualio eQMS", cost: 24000, seats: 50, renewalDate: "2027-01-01" },
    ],
    trend: "flat",
    changePercent: 0,
  },
  {
    vendor: "Palo Alto",
    totalSpend: 8500,
    licenses: [
      { name: "GlobalProtect VPN", cost: 8500, seats: 165, renewalDate: "2026-10-15" },
    ],
    trend: "flat",
    changePercent: 1,
  },
];

const TOP_COST_DRIVERS = [
  { name: "Microsoft 365 E5", cost: 57000, trend: "up" },
  { name: "Salesforce Enterprise", cost: 36000, trend: "up" },
  { name: "Qualio eQMS", cost: 24000, trend: "flat" },
  { name: "Azure Cloud", cost: 22000, trend: "up" },
  { name: "Slack Business+", cost: 15200, trend: "down" },
];

// ─── Calculate Executive Metrics ────────────────────────────

/**
 * Aggregate executive-level IT metrics for a given period.
 */
export function calculateExecutiveMetrics(
  period: "month" | "quarter" | "year" = "month"
): ExecutiveMetrics {
  const totalUsers = DEPARTMENT_DATA.reduce((sum, d) => sum + d.users, 0);
  const totalSpend = VENDOR_DATA.reduce((sum, v) => sum + v.totalSpend, 0);

  const periodMultiplier = period === "year" ? 12 : period === "quarter" ? 3 : 1;
  const periodLabel =
    period === "year"
      ? "Annual"
      : period === "quarter"
        ? "Q1 2026"
        : "March 2026";

  const periodSpend = totalSpend * periodMultiplier;
  const costPerUser = Math.round(periodSpend / totalUsers);

  const totalTickets = DEPARTMENT_DATA.reduce((sum, d) => sum + d.tickets, 0);
  const botDeflected = Math.round(totalTickets * 0.68); // 68% deflection rate
  const avgSatisfaction =
    DEPARTMENT_DATA.reduce((sum, d) => sum + d.satisfaction * d.users, 0) / totalUsers;

  return {
    period: periodLabel,
    costPerUser,
    totalITSpend: periodSpend,
    botDeflectionRate: 68,
    avgResolutionMinutes: 12,
    ticketVolume: totalTickets * periodMultiplier,
    userSatisfaction: Math.round(avgSatisfaction * 10) / 10,
    licenseUtilization: 82,
    securityScore: 87,
    complianceRate: 94,
    topCostDrivers: TOP_COST_DRIVERS,
    departmentBreakdown: DEPARTMENT_DATA.map((d) => ({
      dept: d.dept,
      users: d.users,
      spend: d.baseCost * periodMultiplier,
      tickets: d.tickets * periodMultiplier,
      satisfaction: d.satisfaction,
    })),
  };
}

// ─── Cost Allocation ────────────────────────────────────────

/**
 * Allocate IT costs to departments by actual usage.
 */
export function getCostAllocation(): CostAllocation[] {
  return DEPARTMENT_DATA.map((dept) => ({
    department: dept.dept,
    totalCost: dept.baseCost,
    perUserCost: Math.round(dept.baseCost / dept.users),
    userCount: dept.users,
    breakdown: [
      { category: "Licenses", cost: Math.round(dept.baseCost * 0.55) },
      { category: "Infrastructure", cost: Math.round(dept.baseCost * 0.25) },
      { category: "Support", cost: Math.round(dept.baseCost * 0.12) },
      { category: "Security", cost: Math.round(dept.baseCost * 0.08) },
    ],
  }));
}

// ─── Vendor Spend ───────────────────────────────────────────

/**
 * Per-vendor license spending with renewal dates.
 */
export function getVendorSpend(): VendorSpend[] {
  return [...VENDOR_DATA].sort((a, b) => b.totalSpend - a.totalSpend);
}

// ─── Trend Data ─────────────────────────────────────────────

/**
 * Monthly metrics over time for charting.
 */
export function getTrendData(months = 6): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = date.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    // Simulate improving trends over time
    const progress = (months - i) / months;

    data.push({
      month: monthLabel,
      costPerUser: Math.round(1400 - progress * 120 + Math.random() * 40),
      deflectionRate: Math.round(55 + progress * 15 + Math.random() * 5),
      resolution: Math.round(25 - progress * 13 + Math.random() * 3),
      satisfaction: Math.round((3.5 + progress * 0.8 + Math.random() * 0.3) * 10) / 10,
      ticketVolume: Math.round(420 - progress * 80 + Math.random() * 30),
      securityScore: Math.round(75 + progress * 14 + Math.random() * 3),
    });
  }

  return data;
}
