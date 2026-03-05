/**
 * IT Health Check Engine
 *
 * Year 2 Q1 — Predictive IT: Runs comprehensive health checks across
 * MFA adoption, license utilization, password compliance, device compliance,
 * and group hygiene. Produces scores and recommendations.
 */

import { analyzeLicenseUsage } from "./license-analytics";

// ─── Types ───────────────────────────────────────────────────

export type HealthCheckType =
  | "mfa_adoption"
  | "license_utilization"
  | "password_compliance"
  | "device_compliance"
  | "group_hygiene";

export interface HealthCheck {
  id: string;
  type: HealthCheckType;
  status: "healthy" | "warning" | "critical";
  score: number;
  details: string;
  recommendations: string[];
  lastChecked: Date;
}

export interface HealthTrendPoint {
  week: string;
  overallScore: number;
  checks: Record<HealthCheckType, number>;
}

// ─── In-memory store ─────────────────────────────────────────

const healthResults: HealthCheck[] = [];
let checkIdCounter = 0;

// ─── Check Implementations ──────────────────────────────────

function checkMFAAdoption(): HealthCheck {
  checkIdCounter++;
  // Stub: simulate 72% MFA adoption
  const totalUsers = 200;
  const mfaEnabled = 144;
  const pct = Math.round((mfaEnabled / totalUsers) * 100);

  const status: HealthCheck["status"] =
    pct >= 90 ? "healthy" : pct >= 75 ? "warning" : "critical";

  const recommendations: string[] = [];
  if (pct < 90) {
    recommendations.push(
      `${totalUsers - mfaEnabled} users still need MFA setup — send bulk reminders`
    );
  }
  if (pct < 80) {
    recommendations.push(
      "Consider enforcing MFA for all users within 30 days"
    );
  }
  if (pct < 70) {
    recommendations.push(
      "Critical: Over 30% of users lack MFA. Schedule mandatory enrollment"
    );
  }

  return {
    id: `hc-${checkIdCounter}`,
    type: "mfa_adoption",
    status,
    score: pct,
    details: `${mfaEnabled} of ${totalUsers} users (${pct}%) have MFA enabled`,
    recommendations,
    lastChecked: new Date(),
  };
}

function checkLicenseUtilization(): HealthCheck {
  checkIdCounter++;

  const usages = analyzeLicenseUsage();
  const totalSeats = usages.reduce((sum, u) => sum + u.totalSeats, 0);
  const usedSeats = usages.reduce((sum, u) => sum + u.usedSeats, 0);
  const pct = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

  const underutilized = usages.filter((u) => u.utilizationPct < 50);
  const status: HealthCheck["status"] =
    pct >= 70 ? "healthy" : pct >= 50 ? "warning" : "critical";

  const recommendations: string[] = [];
  if (underutilized.length > 0) {
    recommendations.push(
      `${underutilized.length} license(s) below 50% utilization — review and consolidate`
    );
  }

  const totalWaste = usages.reduce((sum, u) => sum + u.potentialSavings, 0);
  if (totalWaste > 0) {
    recommendations.push(
      `$${Math.round(totalWaste).toLocaleString()}/month in potential savings from inactive assignments`
    );
  }

  return {
    id: `hc-${checkIdCounter}`,
    type: "license_utilization",
    status,
    score: pct,
    details: `${usedSeats} of ${totalSeats} total seats in use (${pct}% utilization across ${usages.length} licenses)`,
    recommendations,
    lastChecked: new Date(),
  };
}

function checkPasswordCompliance(): HealthCheck {
  checkIdCounter++;

  // Stub: simulate password compliance
  const totalUsers = 200;
  const compliant = 148; // changed within 90 days
  const pct = Math.round((compliant / totalUsers) * 100);

  const status: HealthCheck["status"] =
    pct >= 85 ? "healthy" : pct >= 70 ? "warning" : "critical";

  const recommendations: string[] = [];
  const nonCompliant = totalUsers - compliant;
  if (nonCompliant > 0) {
    recommendations.push(
      `${nonCompliant} users have passwords older than 90 days`
    );
  }
  if (pct < 80) {
    recommendations.push(
      "Send password change reminders to non-compliant users"
    );
  }
  if (pct < 70) {
    recommendations.push(
      "Consider enforcing password expiration policy"
    );
  }

  return {
    id: `hc-${checkIdCounter}`,
    type: "password_compliance",
    status,
    score: pct,
    details: `${compliant} of ${totalUsers} users (${pct}%) have changed passwords within 90 days`,
    recommendations,
    lastChecked: new Date(),
  };
}

function checkDeviceCompliance(): HealthCheck {
  checkIdCounter++;

  // Stub: simulate device compliance
  const totalDevices = 230;
  const compliant = 195;
  const pct = Math.round((compliant / totalDevices) * 100);

  const status: HealthCheck["status"] =
    pct >= 90 ? "healthy" : pct >= 75 ? "warning" : "critical";

  const recommendations: string[] = [];
  const nonCompliant = totalDevices - compliant;
  if (nonCompliant > 0) {
    recommendations.push(
      `${nonCompliant} devices failing compliance checks`
    );
  }
  if (nonCompliant > 20) {
    recommendations.push(
      "Schedule a compliance remediation sprint for non-compliant devices"
    );
  }

  return {
    id: `hc-${checkIdCounter}`,
    type: "device_compliance",
    status,
    score: pct,
    details: `${compliant} of ${totalDevices} devices (${pct}%) passing compliance checks`,
    recommendations,
    lastChecked: new Date(),
  };
}

function checkGroupHygiene(): HealthCheck {
  checkIdCounter++;

  // Stub: groups with members who haven't been reviewed in 90+ days
  const totalGroups = 45;
  const reviewedRecently = 32;
  const staleGroups = totalGroups - reviewedRecently;
  const pct = Math.round((reviewedRecently / totalGroups) * 100);

  const status: HealthCheck["status"] =
    pct >= 85 ? "healthy" : pct >= 70 ? "warning" : "critical";

  const recommendations: string[] = [];
  if (staleGroups > 0) {
    recommendations.push(
      `${staleGroups} groups haven't been reviewed in 90+ days`
    );
  }
  if (staleGroups > 5) {
    recommendations.push(
      "Schedule quarterly group membership reviews with team leads"
    );
  }
  recommendations.push(
    "Consider automating group membership reviews with owner attestation"
  );

  return {
    id: `hc-${checkIdCounter}`,
    type: "group_hygiene",
    status,
    score: pct,
    details: `${reviewedRecently} of ${totalGroups} groups (${pct}%) reviewed in last 90 days`,
    recommendations,
    lastChecked: new Date(),
  };
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Run all health checks and store results.
 */
export function runHealthChecks(): HealthCheck[] {
  healthResults.length = 0;
  checkIdCounter = 0;

  const checks = [
    checkMFAAdoption(),
    checkLicenseUtilization(),
    checkPasswordCompliance(),
    checkDeviceCompliance(),
    checkGroupHygiene(),
  ];

  healthResults.push(...checks);
  return [...checks];
}

/**
 * Get the most recent health check results.
 * Runs checks if none have been performed yet.
 */
export function getHealthCheckResults(): HealthCheck[] {
  if (healthResults.length === 0) {
    runHealthChecks();
  }
  return [...healthResults];
}

/**
 * Get overall IT health score (0-100), weighted average of all checks.
 */
export function getOverallHealthScore(): {
  score: number;
  status: "healthy" | "warning" | "critical";
  checks: HealthCheck[];
} {
  const checks = getHealthCheckResults();

  // Weights for each check type
  const weights: Record<HealthCheckType, number> = {
    mfa_adoption: 0.25,
    license_utilization: 0.15,
    password_compliance: 0.25,
    device_compliance: 0.20,
    group_hygiene: 0.15,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const check of checks) {
    const weight = weights[check.type] ?? 0.2;
    weightedSum += check.score * weight;
    totalWeight += weight;
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const status: "healthy" | "warning" | "critical" =
    score >= 80 ? "healthy" : score >= 60 ? "warning" : "critical";

  return { score, status, checks };
}

/**
 * Get historical health scores (stub with trending data).
 */
export function getHealthTrend(weeks: number): HealthTrendPoint[] {
  const trend: HealthTrendPoint[] = [];
  const now = new Date();

  // Generate mock historical data with slight improvement trend
  for (let w = weeks; w >= 0; w--) {
    const weekDate = new Date(
      now.getTime() - w * 7 * 24 * 60 * 60 * 1000
    );
    const weekStr = weekDate.toISOString().split("T")[0];

    // Base scores that improve over time
    const progress = (weeks - w) / weeks; // 0 to 1
    const jitter = () => Math.floor(Math.random() * 6) - 3; // -3 to +3

    const mfa = Math.min(100, Math.round(60 + progress * 15 + jitter()));
    const license = Math.min(100, Math.round(65 + progress * 12 + jitter()));
    const password = Math.min(100, Math.round(62 + progress * 14 + jitter()));
    const device = Math.min(100, Math.round(70 + progress * 16 + jitter()));
    const group = Math.min(100, Math.round(58 + progress * 18 + jitter()));

    const overall = Math.round(
      mfa * 0.25 +
        license * 0.15 +
        password * 0.25 +
        device * 0.2 +
        group * 0.15
    );

    trend.push({
      week: weekStr,
      overallScore: overall,
      checks: {
        mfa_adoption: mfa,
        license_utilization: license,
        password_compliance: password,
        device_compliance: device,
        group_hygiene: group,
      },
    });
  }

  return trend;
}
