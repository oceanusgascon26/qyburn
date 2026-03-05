"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  HeartPulse,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

interface LicenseUsage {
  licenseId: string;
  name: string;
  vendor: string;
  totalSeats: number;
  usedSeats: number;
  costPerSeat: number;
  monthlyTotal: number;
  utilizationPct: number;
  unusedSeats: number;
  potentialSavings: number;
}

interface Recommendation {
  id: string;
  type: string;
  licenseId: string;
  licenseName: string;
  description: string;
  savingsAmount: number;
  savingsPeriod: string;
  affectedUsers: number;
  priority: "high" | "medium" | "low";
}

interface Anomaly {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  userId?: string;
  userEmail?: string;
  description: string;
  details: Record<string, unknown>;
  detectedAt: string;
  acknowledged: boolean;
}

interface AnomalySummary {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  unacknowledged: number;
  critical: number;
}

interface HealthCheck {
  id: string;
  type: string;
  status: "healthy" | "warning" | "critical";
  score: number;
  details: string;
  recommendations: string[];
  lastChecked: string;
}

interface ChurnPrediction {
  userId: string;
  email: string;
  riskLevel: "high" | "medium" | "low";
  signals: string[];
  predictedNeed: string;
  suggestedAction: string;
}

interface DeptCost {
  department: string;
  totalMonthlyCost: number;
  licenses: {
    licenseId: string;
    licenseName: string;
    seats: number;
    monthlyCost: number;
  }[];
}

// ─── Component ───────────────────────────────────────────────

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [licenseData, setLicenseData] = useState<{
    usage: LicenseUsage[];
    recommendations: Recommendation[];
    costBreakdown: DeptCost[];
    totalMonthlySpend: number;
    potentialSavings: { monthly: number; annual: number };
  } | null>(null);
  const [anomalyData, setAnomalyData] = useState<{
    anomalies: Anomaly[];
    summary: AnomalySummary;
  } | null>(null);
  const [healthData, setHealthData] = useState<{
    overallScore: number;
    overallStatus: string;
    checks: HealthCheck[];
    churnPredictions: ChurnPrediction[];
  } | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [licRes, anomRes, healthRes] = await Promise.all([
        fetch("/api/analytics/licenses"),
        fetch("/api/analytics/anomalies"),
        fetch("/api/analytics/health"),
      ]);
      setLicenseData(await licRes.json());
      setAnomalyData(await anomRes.json());
      setHealthData(await healthRes.json());
    } catch (err) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcknowledge = async (anomalyId: string) => {
    const res = await fetch("/api/analytics/anomalies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anomalyId }),
    });
    if (res.ok) {
      toast.success("Anomaly acknowledged");
      fetchData();
    }
  };

  const handleRunHealthCheck = async () => {
    setRunningHealthCheck(true);
    try {
      const res = await fetch("/api/analytics/health", { method: "POST" });
      if (res.ok) {
        toast.success("Health checks completed");
        fetchData();
      }
    } finally {
      setRunningHealthCheck(false);
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "critical":
        return "text-red-400 bg-red-900/30";
      case "high":
        return "text-orange-400 bg-orange-900/30";
      case "medium":
        return "text-yellow-400 bg-yellow-900/30";
      case "low":
        return "text-blue-400 bg-blue-900/30";
      default:
        return "text-silver-400 bg-qy-surface";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "healthy":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-silver-400";
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "healthy":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const riskColor = (r: string) => {
    switch (r) {
      case "high":
        return "text-red-400 bg-red-900/30";
      case "medium":
        return "text-yellow-400 bg-yellow-900/30";
      case "low":
        return "text-green-400 bg-green-900/30";
      default:
        return "text-silver-400 bg-qy-surface";
    }
  };

  const healthCheckLabel = (type: string) => {
    const labels: Record<string, string> = {
      mfa_adoption: "MFA Adoption",
      license_utilization: "License Utilization",
      password_compliance: "Password Compliance",
      device_compliance: "Device Compliance",
      group_hygiene: "Group Hygiene",
    };
    return labels[type] ?? type;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">IT Analytics</h1>
          <p className="text-sm text-silver-400 mt-1">Loading analytics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="qy-skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="qy-skeleton h-64 rounded-xl" />
          <div className="qy-skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">IT Analytics</h1>
          <p className="text-sm text-silver-400 mt-1">
            Predictive insights, anomaly detection, and health monitoring
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-silver-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="qy-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-silver-400">Monthly Spend</p>
              <p className="text-3xl font-bold text-white mt-1">
                ${licenseData?.totalMonthlySpend?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? "0"}
              </p>
              <p className="text-xs text-silver-500 mt-2">
                {licenseData?.usage.length ?? 0} licenses tracked
              </p>
            </div>
            <div className="bg-qyburn-900/40 rounded-lg p-2.5">
              <DollarSign className="h-5 w-5 text-qyburn-400" />
            </div>
          </div>
        </div>

        <div className="qy-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-silver-400">Potential Savings</p>
              <p className="text-3xl font-bold text-wildfire-400 mt-1">
                ${licenseData?.potentialSavings?.monthly?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? "0"}
                <span className="text-sm font-normal text-silver-500">/mo</span>
              </p>
              <p className="text-xs text-silver-500 mt-2">
                ${licenseData?.potentialSavings?.annual?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "0"}/year estimated
              </p>
            </div>
            <div className="bg-wildfire-900/40 rounded-lg p-2.5">
              <TrendingDown className="h-5 w-5 text-wildfire-400" />
            </div>
          </div>
        </div>

        <div className="qy-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-silver-400">Anomalies</p>
              <p className="text-3xl font-bold text-white mt-1">
                {anomalyData?.summary.total ?? 0}
              </p>
              <p className="text-xs text-red-400 mt-2">
                {anomalyData?.summary.critical ?? 0} critical, {anomalyData?.summary.unacknowledged ?? 0} unreviewed
              </p>
            </div>
            <div className="bg-red-900/40 rounded-lg p-2.5">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </div>

        <div className="qy-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-silver-400">Health Score</p>
              <p className={`text-3xl font-bold mt-1 ${statusColor(healthData?.overallStatus ?? "")}`}>
                {healthData?.overallScore ?? 0}
                <span className="text-sm font-normal text-silver-500">/100</span>
              </p>
              <p className="text-xs text-silver-500 mt-2 capitalize">
                {healthData?.overallStatus ?? "unknown"} status
              </p>
            </div>
            <div className="bg-green-900/40 rounded-lg p-2.5">
              <HeartPulse className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* License Cost & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Utilization */}
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-qyburn-400" />
            License Utilization
          </h2>
          <div className="space-y-3">
            {licenseData?.usage.map((lic) => (
              <div key={lic.licenseId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-silver-200">
                    {lic.name}
                  </span>
                  <span className="text-xs text-silver-400">
                    {lic.usedSeats}/{lic.totalSeats} seats ({lic.utilizationPct}%)
                  </span>
                </div>
                <div className="h-2 bg-qy-surface-light rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      lic.utilizationPct >= 90
                        ? "bg-red-500"
                        : lic.utilizationPct >= 70
                          ? "bg-wildfire-500"
                          : lic.utilizationPct >= 50
                            ? "bg-yellow-500"
                            : "bg-qyburn-500"
                    }`}
                    style={{ width: `${Math.min(100, lic.utilizationPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-silver-500">
                  <span>
                    ${lic.monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                  </span>
                  {lic.potentialSavings > 0 && (
                    <span className="text-wildfire-400">
                      ${lic.potentialSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo savings
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Recommendations */}
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-wildfire-400" />
            Optimization Recommendations
          </h2>
          <div className="space-y-2">
            {licenseData?.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="border border-qy-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedRec(expandedRec === rec.id ? null : rec.id)
                  }
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-qy-surface-light/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        rec.priority === "high"
                          ? "bg-red-900/30 text-red-400"
                          : rec.priority === "medium"
                            ? "bg-yellow-900/30 text-yellow-400"
                            : "bg-blue-900/30 text-blue-400"
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <span className="text-sm text-silver-200 truncate">
                      {rec.description}
                    </span>
                  </div>
                  {expandedRec === rec.id ? (
                    <ChevronUp className="h-4 w-4 text-silver-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-silver-500 flex-shrink-0" />
                  )}
                </button>
                {expandedRec === rec.id && (
                  <div className="px-3 pb-3 border-t border-qy-border pt-2">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-silver-500">Type</span>
                        <p className="text-silver-200 capitalize mt-0.5">
                          {rec.type.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <span className="text-silver-500">Savings</span>
                        <p className="text-wildfire-400 font-medium mt-0.5">
                          ${rec.savingsAmount.toLocaleString()}/{rec.savingsPeriod}
                        </p>
                      </div>
                      <div>
                        <span className="text-silver-500">Affected</span>
                        <p className="text-silver-200 mt-0.5">
                          {rec.affectedUsers} user{rec.affectedUsers !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {(!licenseData?.recommendations || licenseData.recommendations.length === 0) && (
              <p className="text-sm text-silver-500 text-center py-4">
                No recommendations at this time
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Anomalies & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Alerts */}
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            Anomaly Alerts
          </h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {anomalyData?.anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`flex items-start gap-3 p-3 rounded-lg border border-qy-border ${
                  anomaly.acknowledged ? "opacity-50" : ""
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${severityColor(anomaly.severity)}`}
                >
                  {anomaly.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-silver-200">{anomaly.description}</p>
                  <p className="text-xs text-silver-500 mt-1 capitalize">
                    {anomaly.type.replace(/_/g, " ")}
                  </p>
                </div>
                {!anomaly.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(anomaly.id)}
                    className="text-xs text-silver-400 hover:text-white px-2 py-1 rounded border border-qy-border hover:border-silver-600 transition-colors flex-shrink-0"
                    title="Acknowledge"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {(!anomalyData?.anomalies || anomalyData.anomalies.length === 0) && (
              <p className="text-sm text-silver-500 text-center py-4">
                No anomalies detected
              </p>
            )}
          </div>
        </div>

        {/* IT Health Score */}
        <div className="qy-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-green-400" />
              IT Health Score
            </h2>
            <button
              onClick={handleRunHealthCheck}
              disabled={runningHealthCheck}
              className="text-xs text-silver-400 hover:text-white px-3 py-1.5 rounded-lg border border-qy-border hover:border-silver-600 transition-colors"
            >
              {runningHealthCheck ? "Running..." : "Run checks"}
            </button>
          </div>

          {/* Overall score gauge */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative h-28 w-28">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-qy-surface-light"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthData?.overallScore ?? 0) * 2.64} 264`}
                  className={statusColor(healthData?.overallStatus ?? "")}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${statusColor(healthData?.overallStatus ?? "")}`}>
                  {healthData?.overallScore ?? 0}
                </span>
                <span className="text-[10px] text-silver-500 uppercase tracking-wider">
                  score
                </span>
              </div>
            </div>
          </div>

          {/* Individual checks */}
          <div className="space-y-3">
            {healthData?.checks.map((check) => (
              <div key={check.id} className="flex items-center gap-3">
                {statusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-silver-200">
                      {healthCheckLabel(check.type)}
                    </span>
                    <span className={`text-sm font-medium ${statusColor(check.status)}`}>
                      {check.score}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-qy-surface-light rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        check.status === "healthy"
                          ? "bg-green-500"
                          : check.status === "warning"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${check.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Churn Predictions */}
      <div className="qy-card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-qyburn-400" />
          Churn Predictions
          <span className="text-xs font-normal text-silver-500 ml-2">
            Users likely to need help soon
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="qy-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Risk</th>
                <th>Signals</th>
                <th>Predicted Need</th>
                <th>Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {healthData?.churnPredictions?.map((pred) => (
                <tr key={pred.userId}>
                  <td>
                    <span className="text-sm font-medium text-white">
                      {pred.email}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor(pred.riskLevel)}`}
                    >
                      {pred.riskLevel}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {pred.signals.map((s, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-qy-surface-light text-silver-400"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-sm text-silver-300">{pred.predictedNeed}</td>
                  <td className="text-sm text-silver-400">{pred.suggestedAction}</td>
                </tr>
              ))}
              {(!healthData?.churnPredictions || healthData.churnPredictions.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center text-silver-500 py-8">
                    No at-risk users detected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Cost Breakdown */}
      <div className="qy-card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-qyburn-400" />
          Department Cost Allocation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {licenseData?.costBreakdown.map((dept) => (
            <div
              key={dept.department}
              className="border border-qy-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">
                  {dept.department}
                </span>
                <span className="text-sm font-medium text-qyburn-400">
                  ${dept.totalMonthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                </span>
              </div>
              <div className="space-y-1.5">
                {dept.licenses.map((lic) => (
                  <div
                    key={lic.licenseId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-silver-400">{lic.licenseName}</span>
                    <span className="text-silver-500">
                      {lic.seats} seat{lic.seats !== 1 ? "s" : ""} - $
                      {lic.monthlyCost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
