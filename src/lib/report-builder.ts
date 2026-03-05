/**
 * IT Report Builder Engine
 *
 * Year 3 Q2 — IT Intelligence Platform: Custom report generation with
 * templates for license audit, security posture, cost analysis, bot
 * performance, compliance status, and access reviews. Supports scheduling
 * and output caching.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ITReport {
  id: string;
  name: string;
  type:
    | "license_audit"
    | "security_posture"
    | "cost_analysis"
    | "bot_performance"
    | "compliance_status"
    | "access_review";
  config: Record<string, unknown>;
  schedule?: string;
  recipients: string[];
  lastGenerated?: Date;
  output?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReportType = ITReport["type"];

export interface ReportTemplate {
  type: ReportType;
  name: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  estimatedMinutes: number;
}

// ─── Report Templates ───────────────────────────────────────

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: "license_audit",
    name: "License Audit Report",
    description: "Seat counts, utilization rates, cost analysis, unused licenses, and optimization recommendations across all vendors.",
    defaultConfig: { includeInactive: true, periodMonths: 3 },
    estimatedMinutes: 2,
  },
  {
    type: "security_posture",
    name: "Security Posture Report",
    description: "Defender secure score, open vulnerabilities, MFA adoption rate, conditional access compliance, and threat trends.",
    defaultConfig: { includeDefenderDetails: true, includeMFA: true },
    estimatedMinutes: 3,
  },
  {
    type: "cost_analysis",
    name: "Cost Analysis Report",
    description: "Per-department and per-vendor spend breakdown, optimization opportunities, projected savings, and renewal calendar.",
    defaultConfig: { period: "quarter", includeTrends: true },
    estimatedMinutes: 2,
  },
  {
    type: "bot_performance",
    name: "Bot Performance Report",
    description: "Qyburn resolution rate, intent breakdown, user satisfaction scores, response times, and knowledge gap analysis.",
    defaultConfig: { periodDays: 30, includeIntents: true },
    estimatedMinutes: 1,
  },
  {
    type: "compliance_status",
    name: "Compliance Status Report",
    description: "Password policy adherence, device compliance rates, group membership hygiene, and policy violation trends.",
    defaultConfig: { includeDevices: true, includePasswords: true },
    estimatedMinutes: 2,
  },
  {
    type: "access_review",
    name: "Access Review Report",
    description: "Groups with stale members, over-privileged users, inactive accounts with active access, and external sharing audit.",
    defaultConfig: { staleDays: 90, includeExternal: true },
    estimatedMinutes: 3,
  },
];

// ─── In-Memory Store ────────────────────────────────────────

const reports: ITReport[] = [];
let reportIdCounter = 0;

// ─── Report Generators ──────────────────────────────────────

function generateLicenseAudit(config: Record<string, unknown>): string {
  const includeInactive = config.includeInactive !== false;
  return [
    "# License Audit Report",
    `Generated: ${new Date().toLocaleString()}`,
    `Period: ${config.periodMonths ?? 3} months`,
    "",
    "## Summary",
    "| Metric | Value |",
    "|--------|-------|",
    "| Total Licenses | 12 |",
    "| Total Seats | 892 |",
    "| Used Seats | 731 |",
    "| Utilization Rate | 82% |",
    "| Monthly Spend | $18,450 |",
    "| Potential Savings | $2,340/mo |",
    "",
    "## By Vendor",
    "| Vendor | Licenses | Seats | Used | Cost/mo | Utilization |",
    "|--------|----------|-------|------|---------|-------------|",
    "| Microsoft | 3 | 375 | 330 | $7,400 | 88% |",
    "| Atlassian | 2 | 200 | 155 | $1,540 | 78% |",
    "| Slack | 1 | 165 | 158 | $1,267 | 96% |",
    "| Salesforce | 2 | 40 | 32 | $3,500 | 80% |",
    "| Qualio | 1 | 50 | 42 | $2,000 | 84% |",
    "| Palo Alto | 1 | 165 | 140 | $708 | 85% |",
    "",
    includeInactive
      ? [
          "## Inactive Licenses (No Activity 30+ Days)",
          "| User | License | Last Active | Action |",
          "|------|---------|-------------|--------|",
          "| tom.smith@saga.com | Tableau | 45 days ago | Recommend reclaim |",
          "| old.contractor@saga.com | M365 E5 | 60 days ago | Recommend disable |",
          "| intern.summer@saga.com | Jira | 90 days ago | Auto-reclaimed |",
          "",
        ].join("\n")
      : "",
    "## Recommendations",
    "1. **Reclaim 8 unused Jira licenses** — Save $960/year",
    "2. **Downgrade 5 M365 E5 to E3** — Save $3,600/year",
    "3. **Consolidate Confluence to free tier** for read-only users — Save $780/year",
  ].join("\n");
}

function generateSecurityPosture(_config: Record<string, unknown>): string {
  return [
    "# Security Posture Report",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "## Microsoft Defender Secure Score",
    "| Metric | Value |",
    "|--------|-------|",
    "| Current Score | 87/100 |",
    "| Industry Average | 72/100 |",
    "| Improvement (30d) | +4 points |",
    "",
    "## MFA Adoption",
    "| Status | Users | Percentage |",
    "|--------|-------|------------|",
    "| Enrolled | 152 | 92% |",
    "| Pending | 8 | 5% |",
    "| Exempt | 5 | 3% |",
    "",
    "## Open Vulnerabilities",
    "| Severity | Count | SLA Status |",
    "|----------|-------|------------|",
    "| Critical | 0 | On track |",
    "| High | 2 | 1 nearing SLA |",
    "| Medium | 7 | On track |",
    "| Low | 12 | On track |",
    "",
    "## Conditional Access",
    "- 12 policies active",
    "- 3 policies in report-only mode",
    "- 0 policies with sign-in failures > 5%",
    "",
    "## Recommendations",
    "1. Complete MFA enrollment for 8 remaining users",
    "2. Patch 2 high-severity vulnerabilities before SLA deadline",
    "3. Move 3 report-only CA policies to enforced mode",
  ].join("\n");
}

function generateCostAnalysis(config: Record<string, unknown>): string {
  const period = (config.period as string) ?? "quarter";
  return [
    "# Cost Analysis Report",
    `Generated: ${new Date().toLocaleString()}`,
    `Period: ${period}`,
    "",
    "## Total IT Spend",
    "| Metric | Value |",
    "|--------|-------|",
    `| Total Spend | $${period === "year" ? "2,373,600" : period === "quarter" ? "593,400" : "197,800"} |`,
    "| Active Users | 165 |",
    `| Cost Per User | $${period === "year" ? "14,385" : period === "quarter" ? "3,596" : "1,199"} |`,
    "| YoY Change | +6% |",
    "",
    "## By Department",
    "| Department | Users | Spend | Per User | Tickets |",
    "|------------|-------|-------|----------|---------|",
    "| Engineering | 45 | $52,000 | $1,156 | 120 |",
    "| Sales | 30 | $38,000 | $1,267 | 85 |",
    "| Research | 25 | $41,000 | $1,640 | 60 |",
    "| Finance | 15 | $18,000 | $1,200 | 35 |",
    "| Marketing | 20 | $24,000 | $1,200 | 50 |",
    "",
    "## Optimization Opportunities",
    "| Opportunity | Est. Savings | Effort |",
    "|-------------|-------------|--------|",
    "| Reclaim unused licenses | $5,340/yr | Low |",
    "| Reserved instance pricing | $8,400/yr | Medium |",
    "| Consolidate redundant tools | $12,000/yr | High |",
    "| Renegotiate Salesforce contract | $6,000/yr | Medium |",
  ].join("\n");
}

function generateBotPerformance(config: Record<string, unknown>): string {
  const days = (config.periodDays as number) ?? 30;
  return [
    "# Bot Performance Report — Qyburn",
    `Generated: ${new Date().toLocaleString()}`,
    `Period: Last ${days} days`,
    "",
    "## Key Metrics",
    "| Metric | Value | Trend |",
    "|--------|-------|-------|",
    "| Total Conversations | 423 | +12% |",
    "| Resolution Rate | 68% | +5% |",
    "| Avg Response Time | 2.3s | -0.4s |",
    "| User Satisfaction | 4.2/5 | +0.3 |",
    "| Escalation Rate | 18% | -3% |",
    "| Knowledge Gaps | 14 | -6 |",
    "",
    "## Top Intents",
    "| Intent | Volume | Resolution | Satisfaction |",
    "|--------|--------|------------|-------------|",
    "| Password Reset | 89 | 94% | 4.5 |",
    "| License Request | 72 | 78% | 4.1 |",
    "| VPN Issues | 58 | 62% | 3.8 |",
    "| Group Access | 45 | 85% | 4.3 |",
    "| New Employee Setup | 38 | 72% | 4.0 |",
    "",
    "## Deflection Impact",
    "- **287 tickets deflected** (68% of total)",
    "- **Estimated savings: $14,350** (@ $50/ticket avg)",
    "- **574 hours saved** for IT team",
    "",
    "## Knowledge Gaps (Top 5)",
    "1. VPN split-tunnel configuration (12 queries)",
    "2. Shared mailbox delegation process (8 queries)",
    "3. Azure MFA recovery options (7 queries)",
    "4. Printer driver installation on Mac (6 queries)",
    "5. Teams phone system setup (5 queries)",
  ].join("\n");
}

function generateComplianceStatus(_config: Record<string, unknown>): string {
  return [
    "# Compliance Status Report",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "## Overall Compliance: 94%",
    "",
    "## Password Policy",
    "| Metric | Value | Status |",
    "|--------|-------|--------|",
    "| Compliant Users | 158/165 | 96% |",
    "| Passwords > 90 days | 7 | Warning |",
    "| Passwords > 180 days | 0 | OK |",
    "| Complexity Failures | 2 | Action needed |",
    "",
    "## Device Compliance",
    "| Metric | Value | Status |",
    "|--------|-------|--------|",
    "| Compliant Devices | 148/162 | 91% |",
    "| Missing BitLocker | 6 | Warning |",
    "| Outdated OS | 5 | Warning |",
    "| Missing Defender | 3 | Critical |",
    "",
    "## Group Hygiene",
    "| Metric | Value |",
    "|--------|-------|",
    "| Total Groups | 47 |",
    "| Groups with No Owner | 3 |",
    "| Stale Groups (no activity 90d) | 8 |",
    "| Nested Group Depth > 3 | 2 |",
    "",
    "## Action Items",
    "1. Contact 7 users with expired passwords",
    "2. Enable BitLocker on 6 unencrypted devices",
    "3. Install Defender on 3 missing endpoints",
    "4. Assign owners to 3 orphaned groups",
  ].join("\n");
}

function generateAccessReview(config: Record<string, unknown>): string {
  const staleDays = (config.staleDays as number) ?? 90;
  return [
    "# Access Review Report",
    `Generated: ${new Date().toLocaleString()}`,
    `Stale threshold: ${staleDays} days`,
    "",
    "## Stale Group Members",
    "| Group | Stale Members | Last Activity |",
    "|-------|--------------|---------------|",
    "| SG-VPN-Users | 4 | 95+ days |",
    "| SG-Tableau-Viewers | 6 | 120+ days |",
    "| SG-Dev-Staging | 3 | 180+ days |",
    "",
    "## Over-Privileged Users",
    "| User | Excess Privileges | Recommendation |",
    "|------|-------------------|----------------|",
    "| former.lead@saga.com | Global Admin | Downgrade to User |",
    "| temp.contractor@saga.com | Exchange Admin | Remove role |",
    "| intern.dev@saga.com | Application Admin | Downgrade to Developer |",
    "",
    "## Inactive Accounts with Active Access",
    "| Account | Last Sign-in | Active Licenses | Active Groups |",
    "|---------|-------------|-----------------|---------------|",
    "| old.intern@saga.com | 120 days | 3 | 5 |",
    "| departed.sales@saga.com | 90 days | 2 | 8 |",
    "",
    "## External Sharing",
    "| Resource | External Users | Risk Level |",
    "|----------|---------------|------------|",
    "| SharePoint - Projects | 12 | Medium |",
    "| Teams - Partners | 8 | Low |",
    "| OneDrive - Shared | 3 | High |",
    "",
    "## Recommendations",
    "1. Remove 13 stale group memberships",
    "2. Revoke 3 over-privileged role assignments",
    "3. Disable 2 inactive accounts and reclaim licenses",
    "4. Review 3 high-risk external sharing instances",
  ].join("\n");
}

// ─── Generate Report ────────────────────────────────────────

/**
 * Generate a report by type with optional config overrides.
 */
export function generateReport(
  type: ReportType,
  config?: Record<string, unknown>
): ITReport {
  const template = REPORT_TEMPLATES.find((t) => t.type === type);
  if (!template) {
    throw new Error(`Unknown report type: ${type}`);
  }

  const mergedConfig = { ...template.defaultConfig, ...config };
  let output: string;

  switch (type) {
    case "license_audit":
      output = generateLicenseAudit(mergedConfig);
      break;
    case "security_posture":
      output = generateSecurityPosture(mergedConfig);
      break;
    case "cost_analysis":
      output = generateCostAnalysis(mergedConfig);
      break;
    case "bot_performance":
      output = generateBotPerformance(mergedConfig);
      break;
    case "compliance_status":
      output = generateComplianceStatus(mergedConfig);
      break;
    case "access_review":
      output = generateAccessReview(mergedConfig);
      break;
  }

  const report: ITReport = {
    id: `rpt-${++reportIdCounter}`,
    name: template.name,
    type,
    config: mergedConfig,
    recipients: [],
    lastGenerated: new Date(),
    output,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  reports.push(report);
  return report;
}

// ─── Schedule Report ────────────────────────────────────────

/**
 * Schedule a recurring report.
 */
export function scheduleReport(
  reportId: string,
  cron: string,
  recipients: string[]
): ITReport | null {
  const report = reports.find((r) => r.id === reportId);
  if (!report) return null;

  report.schedule = cron;
  report.recipients = recipients;
  report.updatedAt = new Date();
  return report;
}

// ─── Queries ────────────────────────────────────────────────

/**
 * List all generated reports.
 */
export function getReports(): ITReport[] {
  return [...reports].sort(
    (a, b) => (b.lastGenerated?.getTime() ?? 0) - (a.lastGenerated?.getTime() ?? 0)
  );
}

/**
 * Get a single report by ID.
 */
export function getReport(reportId: string): ITReport | null {
  return reports.find((r) => r.id === reportId) ?? null;
}

/**
 * Get report templates.
 */
export function getReportTemplates(): ReportTemplate[] {
  return [...REPORT_TEMPLATES];
}
