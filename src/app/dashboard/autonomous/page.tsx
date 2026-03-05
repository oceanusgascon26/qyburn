"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Bot,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Eye,
  AlertTriangle,
  ClipboardCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

interface AutonomousMetrics {
  deflectionRate: number;
  autoResolvedCount: number;
  totalRequestCount: number;
  humanInterventions: number;
  avgAutoResolutionMinutes: number;
  costSavingsEstimate: number;
  topAutoResolvedCategories: { category: string; count: number }[];
}

interface AutonomyScore {
  score: number;
  components: {
    name: string;
    score: number;
    weight: number;
    description: string;
  }[];
  grade: string;
}

interface AutomationRecommendation {
  id: string;
  process: string;
  currentState: string;
  proposedAutomation: string;
  estimatedVolume: number;
  estimatedTimeSaved: number;
  effort: string;
  impact: string;
}

interface AccessReviewData {
  id: string;
  groupName: string;
  reviewerEmail: string;
  members: { userId: string; email: string; decision?: string }[];
  status: string;
  dueDate: string;
}

interface ReviewStats {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  overdueReviews: number;
  completionRate: number;
  avgRevocationRate: number;
}

interface ShadowITDetection {
  id: string;
  appName: string;
  category: string;
  usersDetected: number;
  riskLevel: string;
  sanctionedAlternative?: string;
  status: string;
}

interface ShadowITStats {
  totalAppsDetected: number;
  totalUsersAffected: number;
  riskDistribution: { high: number; medium: number; low: number };
}

interface BudgetForecast {
  period: string;
  predicted: number;
  confidence: number;
  breakdown: { category: string; amount: number; trend: string }[];
}

interface SpendVsBudget {
  period: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

// ─── Component ───────────────────────────────────────────────

export default function AutonomousPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AutonomousMetrics | null>(null);
  const [score, setScore] = useState<AutonomyScore | null>(null);
  const [recommendations, setRecommendations] = useState<AutomationRecommendation[]>([]);
  const [reviews, setReviews] = useState<AccessReviewData[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [shadowIT, setShadowIT] = useState<ShadowITDetection[]>([]);
  const [shadowStats, setShadowStats] = useState<ShadowITStats | null>(null);
  const [budgetForecast, setBudgetForecast] = useState<BudgetForecast[]>([]);
  const [spendVsBudget, setSpendVsBudget] = useState<SpendVsBudget | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [autoRes, reviewRes, shadowRes, budgetRes] = await Promise.all([
        fetch("/api/autonomous"),
        fetch("/api/access-reviews"),
        fetch("/api/shadow-it"),
        fetch("/api/budget"),
      ]);

      if (autoRes.ok) {
        const data = await autoRes.json();
        setMetrics(data.metrics);
        setScore(data.score);
        setRecommendations(data.recommendations ?? []);
      }

      if (reviewRes.ok) {
        const data = await reviewRes.json();
        setReviews(data.reviews ?? []);
        setReviewStats(data.stats ?? null);
      }

      if (shadowRes.ok) {
        const data = await shadowRes.json();
        setShadowIT(data.detections ?? []);
        setShadowStats(data.stats ?? null);
      }

      if (budgetRes.ok) {
        const data = await budgetRes.json();
        setBudgetForecast(data.forecast ?? []);
        setSpendVsBudget(data.spendVsBudget ?? null);
      }
    } catch {
      toast.error("Failed to load autonomous operations data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleShadowScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/shadow-it", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      if (res.ok) {
        toast.success("Shadow IT scan complete");
        fetchData();
      }
    } finally {
      setScanning(false);
    }
  };

  const handleNotifyUsers = async (appName: string) => {
    const res = await fetch("/api/shadow-it", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "notify", appName }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Notified ${data.notified} users about ${appName}`);
      fetchData();
    }
  };

  const riskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-900/30 text-red-400";
      case "medium":
        return "bg-yellow-900/30 text-yellow-400";
      case "low":
        return "bg-green-900/30 text-green-400";
      default:
        return "bg-qy-surface text-silver-400";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-900/30 text-green-400";
      case "in_progress":
        return "bg-blue-900/30 text-blue-400";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400";
      case "detected":
        return "bg-red-900/30 text-red-400";
      case "notified":
        return "bg-orange-900/30 text-orange-400";
      case "resolved":
        return "bg-green-900/30 text-green-400";
      default:
        return "bg-qy-surface text-silver-400";
    }
  };

  const gradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-green-400";
      case "B":
        return "text-blue-400";
      case "C":
        return "text-yellow-400";
      case "D":
        return "text-orange-400";
      case "F":
        return "text-red-400";
      default:
        return "text-silver-400";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Autonomous Operations</h1>
          <p className="text-sm text-silver-400 mt-1">Loading...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="qy-skeleton h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Autonomous Operations
          </h1>
          <p className="text-sm text-silver-400 mt-1">
            Self-driving IT — deflection, auto-resolution, and proactive management
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-silver-400 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ─── Autonomy Score + Top Stats ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Autonomy Score Gauge */}
        <div className="qy-card lg:col-span-1 flex flex-col items-center justify-center">
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
                strokeDasharray={`${(score?.score ?? 0) * 2.64} 264`}
                className={gradeColor(score?.grade ?? "F")}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-2xl font-bold ${gradeColor(score?.grade ?? "F")}`}
              >
                {score?.score ?? 0}
              </span>
              <span className="text-[10px] text-silver-500 uppercase tracking-wider">
                score
              </span>
            </div>
          </div>
          <p className="text-xs text-silver-400 mt-2">
            Grade:{" "}
            <span
              className={`font-bold ${gradeColor(score?.grade ?? "F")}`}
            >
              {score?.grade ?? "N/A"}
            </span>
          </p>
        </div>

        {/* Deflection Rate */}
        <div className="qy-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-silver-400">Deflection Rate</p>
              <p className="text-3xl font-bold text-white mt-1">
                {metrics?.deflectionRate ?? 0}%
              </p>
              <p className="text-xs text-silver-500 mt-2">
                {metrics?.autoResolvedCount ?? 0} of{" "}
                {metrics?.totalRequestCount ?? 0} requests
              </p>
            </div>
            <div className="bg-qyburn-900/40 rounded-lg p-2.5">
              <Bot className="h-5 w-5 text-qyburn-400" />
            </div>
          </div>
        </div>

        {/* Auto-Resolved */}
        <div className="qy-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-silver-400">Auto-Resolved</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                {metrics?.autoResolvedCount ?? 0}
              </p>
              <p className="text-xs text-silver-500 mt-2">
                Avg {metrics?.avgAutoResolutionMinutes ?? 0} min resolution
              </p>
            </div>
            <div className="bg-green-900/40 rounded-lg p-2.5">
              <Zap className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>

        {/* Cost Savings */}
        <div className="qy-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-silver-400">Cost Savings</p>
              <p className="text-3xl font-bold text-wildfire-400 mt-1">
                ${metrics?.costSavingsEstimate?.toLocaleString() ?? 0}
              </p>
              <p className="text-xs text-silver-500 mt-2">
                {metrics?.humanInterventions ?? 0} human interventions
              </p>
            </div>
            <div className="bg-wildfire-900/40 rounded-lg p-2.5">
              <DollarSign className="h-5 w-5 text-wildfire-400" />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="qy-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-silver-400">Spend vs Budget</p>
              <p className="text-3xl font-bold text-white mt-1">
                {spendVsBudget
                  ? `${spendVsBudget.variancePercent > 0 ? "+" : ""}${spendVsBudget.variancePercent}%`
                  : "N/A"}
              </p>
              <p className="text-xs text-silver-500 mt-2">
                {spendVsBudget?.period ?? ""}
              </p>
            </div>
            <div className="bg-blue-900/40 rounded-lg p-2.5">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Score Components ──────────────────────────── */}
      {score && (
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-wildfire-400" />
            Autonomy Score Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {score.components.map((comp) => (
              <div
                key={comp.name}
                className="border border-qy-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {comp.name}
                  </span>
                  <span className="text-xs text-silver-500">
                    {comp.weight}% weight
                  </span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold text-white">
                    {comp.score}
                  </span>
                  <span className="text-xs text-silver-500 mb-1">/100</span>
                </div>
                <div className="h-2 bg-qy-surface-light rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      comp.score >= 80
                        ? "bg-green-500"
                        : comp.score >= 60
                          ? "bg-yellow-500"
                          : comp.score >= 40
                            ? "bg-orange-500"
                            : "bg-red-500"
                    }`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-silver-400">
                  {comp.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Top Auto-Resolved + Recommendations ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-qyburn-400" />
            Top Auto-Resolved Categories
          </h2>
          <div className="space-y-3">
            {metrics?.topAutoResolvedCategories.map((cat) => {
              const pct =
                metrics.autoResolvedCount > 0
                  ? Math.round(
                      (cat.count / metrics.autoResolvedCount) * 100
                    )
                  : 0;
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-silver-200 capitalize">
                      {cat.category}
                    </span>
                    <span className="text-xs text-silver-400">
                      {cat.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-qy-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-qyburn-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!metrics?.topAutoResolvedCategories ||
              metrics.topAutoResolvedCategories.length === 0) && (
              <p className="text-sm text-silver-500 text-center py-4">
                No data yet
              </p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Automation Expansion
          </h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="border border-qy-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedRec(expandedRec === rec.id ? null : rec.id)
                  }
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-qy-surface-light/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${riskColor(rec.impact)}`}
                    >
                      {rec.impact}
                    </span>
                    <span className="text-sm text-silver-200 truncate">
                      {rec.process}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-wildfire-400">
                      {rec.estimatedTimeSaved}h/mo saved
                    </span>
                    {expandedRec === rec.id ? (
                      <ChevronUp className="h-4 w-4 text-silver-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-silver-500" />
                    )}
                  </div>
                </button>
                {expandedRec === rec.id && (
                  <div className="px-3 pb-3 border-t border-qy-border pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-silver-500">Current</span>
                        <p className="text-silver-300 mt-0.5">
                          {rec.currentState}
                        </p>
                      </div>
                      <div>
                        <span className="text-silver-500">Proposed</span>
                        <p className="text-silver-300 mt-0.5">
                          {rec.proposedAutomation}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-silver-500">
                        Volume: {rec.estimatedVolume}/mo
                      </span>
                      <span className="text-silver-500">
                        Effort:{" "}
                        <span className="capitalize">{rec.effort}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Access Reviews ────────────────────────────── */}
      <div className="qy-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-400" />
            Access Reviews
          </h2>
          {reviewStats && (
            <div className="flex items-center gap-4 text-xs text-silver-400">
              <span>
                {reviewStats.completionRate}% completion
              </span>
              <span>{reviewStats.overdueReviews} overdue</span>
              <span>
                {reviewStats.avgRevocationRate}% revocation rate
              </span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="qy-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Reviewer</th>
                <th>Members</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const decided = review.members.filter(
                  (m) => m.decision
                ).length;
                const total = review.members.length;
                const progress =
                  total > 0 ? Math.round((decided / total) * 100) : 0;
                const isOverdue =
                  review.status !== "completed" &&
                  new Date(review.dueDate) < new Date();

                return (
                  <tr key={review.id}>
                    <td className="text-sm font-medium text-white">
                      {review.groupName}
                    </td>
                    <td className="text-sm text-silver-300">
                      {review.reviewerEmail}
                    </td>
                    <td className="text-sm text-silver-400">{total}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(review.status)}`}
                      >
                        {review.status}
                      </span>
                      {isOverdue && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-red-900/30 text-red-400">
                          overdue
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-silver-400">
                      {new Date(review.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-qy-surface-light rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progress === 100
                                ? "bg-green-500"
                                : "bg-qyburn-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-silver-400 w-12 text-right">
                          {decided}/{total}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reviews.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-silver-500 py-8"
                  >
                    No access reviews scheduled
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Shadow IT ─────────────────────────────────── */}
      <div className="qy-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-400" />
            Shadow IT Detection
            {shadowStats && (
              <span className="text-xs font-normal text-silver-500 ml-2">
                {shadowStats.totalAppsDetected} apps &middot;{" "}
                {shadowStats.totalUsersAffected} users affected
              </span>
            )}
          </h2>
          <button
            onClick={handleShadowScan}
            disabled={scanning}
            className="text-xs text-silver-400 hover:text-white px-3 py-1.5 rounded-lg border border-qy-border hover:border-silver-600 transition-colors"
          >
            {scanning ? "Scanning..." : "Run scan"}
          </button>
        </div>

        {shadowStats && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="border border-qy-border rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-red-400">
                {shadowStats.riskDistribution.high}
              </p>
              <p className="text-[10px] text-silver-500 uppercase">
                High Risk
              </p>
            </div>
            <div className="border border-qy-border rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-yellow-400">
                {shadowStats.riskDistribution.medium}
              </p>
              <p className="text-[10px] text-silver-500 uppercase">
                Medium Risk
              </p>
            </div>
            <div className="border border-qy-border rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-green-400">
                {shadowStats.riskDistribution.low}
              </p>
              <p className="text-[10px] text-silver-500 uppercase">
                Low Risk
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="qy-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Category</th>
                <th>Users</th>
                <th>Risk</th>
                <th>Alternative</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shadowIT.map((app) => (
                <tr key={app.id}>
                  <td className="text-sm font-medium text-white">
                    {app.appName}
                  </td>
                  <td className="text-sm text-silver-400">{app.category}</td>
                  <td className="text-sm text-silver-400">
                    {app.usersDetected}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor(app.riskLevel)}`}
                    >
                      {app.riskLevel}
                    </span>
                  </td>
                  <td className="text-sm text-silver-300">
                    {app.sanctionedAlternative ?? "-"}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td>
                    {app.status === "detected" && (
                      <button
                        onClick={() => handleNotifyUsers(app.appName)}
                        className="text-xs text-qyburn-400 hover:text-qyburn-300 flex items-center gap-1 transition-colors"
                      >
                        Notify <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {shadowIT.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-silver-500 py-8"
                  >
                    No shadow IT detected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Budget Forecast ───────────────────────────── */}
      {budgetForecast.length > 0 && (
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-qyburn-400" />
            Budget Forecast
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {budgetForecast.map((quarter) => (
              <div
                key={quarter.period}
                className="border border-qy-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">
                    {quarter.period}
                  </span>
                  <span className="text-xs text-silver-500">
                    {quarter.confidence}% confidence
                  </span>
                </div>
                <p className="text-xl font-bold text-white mb-3">
                  $
                  {quarter.predicted.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <div className="space-y-1.5">
                  {quarter.breakdown.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-silver-400">{item.category}</span>
                      <span className="text-silver-300">
                        $
                        {item.amount.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                        {item.trend === "up" && (
                          <span className="text-red-400 ml-1">^</span>
                        )}
                        {item.trend === "down" && (
                          <span className="text-green-400 ml-1">v</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
