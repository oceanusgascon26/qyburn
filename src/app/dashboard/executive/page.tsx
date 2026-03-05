"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Bot,
  Clock,
  SmilePlus,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Users,
  Building,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

interface ExecutiveMetrics {
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

interface VendorSpend {
  vendor: string;
  totalSpend: number;
  licenses: { name: string; cost: number; seats: number; renewalDate: string }[];
  trend: "up" | "down" | "flat";
  changePercent: number;
}

interface TrendDataPoint {
  month: string;
  costPerUser: number;
  deflectionRate: number;
  resolution: number;
  satisfaction: number;
  ticketVolume: number;
  securityScore: number;
}

interface IncidentCluster {
  id: string;
  title: string;
  severity: "P1" | "P2" | "P3";
  affectedUsers: string[];
  status: string;
  startedAt: string;
}

interface ChangeEntry {
  id: string;
  title: string;
  type: string;
  scheduledStart: string;
  scheduledEnd: string;
  riskLevel: string;
  status: string;
  owner: string;
}

// ─── Component ──────────────────────────────────────────────

export default function ExecutiveDashboardPage() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [vendors, setVendors] = useState<VendorSpend[]>([]);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [incidents, setIncidents] = useState<IncidentCluster[]>([]);
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [execRes, incRes, chgRes] = await Promise.all([
        fetch(`/api/executive?period=${period}`),
        fetch("/api/incidents"),
        fetch("/api/changes?view=calendar"),
      ]);

      const execData = await execRes.json();
      setMetrics(execData.metrics);
      setVendors(execData.vendors ?? []);
      setTrends(execData.trends ?? []);

      const incData = await incRes.json();
      setIncidents(incData.incidents ?? []);

      const chgData = await chgRes.json();
      setChanges(chgData.calendar ?? []);
    } catch {
      toast.error("Failed to load executive data");
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const trendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-red-400" />;
    if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />;
    return <Minus className="h-3.5 w-3.5 text-silver-400" />;
  };

  const severityColor = (sev: string) => {
    if (sev === "P1") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (sev === "P2") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  const riskColor = (risk: string) => {
    if (risk === "high") return "text-red-400";
    if (risk === "medium") return "text-amber-400";
    return "text-emerald-400";
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-qyburn-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-sm text-silver-400">
            IT performance metrics — {metrics?.period ?? "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["month", "quarter", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === p
                  ? "bg-qyburn-700 text-white"
                  : "text-silver-400 hover:text-white hover:bg-qyburn-900/50"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="ml-2 p-2 rounded-lg text-silver-400 hover:text-white hover:bg-qyburn-900/50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Cost Per User",
              value: formatCurrency(metrics.costPerUser),
              icon: DollarSign,
              color: "text-emerald-400",
            },
            {
              label: "Bot Deflection",
              value: `${metrics.botDeflectionRate}%`,
              icon: Bot,
              color: "text-blue-400",
            },
            {
              label: "Avg Resolution",
              value: `${metrics.avgResolutionMinutes}m`,
              icon: Clock,
              color: "text-amber-400",
            },
            {
              label: "Satisfaction",
              value: `${metrics.userSatisfaction}/5`,
              icon: SmilePlus,
              color: "text-purple-400",
            },
            {
              label: "Security Score",
              value: `${metrics.securityScore}/100`,
              icon: Shield,
              color: "text-wildfire-400",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-qy-border bg-qy-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-silver-400">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Per-Department */}
        <div className="rounded-xl border border-qy-border bg-qy-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Department Breakdown</h2>
          </div>
          <div className="space-y-3">
            {metrics?.departmentBreakdown.map((dept) => (
              <div key={dept.dept} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-silver-200 font-medium w-24 truncate">{dept.dept}</span>
                  <span className="text-silver-500 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {dept.users}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-silver-300">{formatCurrency(dept.spend)}</span>
                  <span className="text-silver-500 w-16 text-right">
                    {dept.tickets} tix
                  </span>
                  <span className="text-amber-400 w-10 text-right">{dept.satisfaction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-Vendor */}
        <div className="rounded-xl border border-qy-border bg-qy-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Vendor Spend</h2>
          </div>
          <div className="space-y-3">
            {vendors.map((v) => (
              <div key={v.vendor} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-silver-200 font-medium">{v.vendor}</span>
                  {trendIcon(v.trend)}
                  <span
                    className={`text-xs ${
                      v.trend === "up"
                        ? "text-red-400"
                        : v.trend === "down"
                          ? "text-emerald-400"
                          : "text-silver-500"
                    }`}
                  >
                    {v.changePercent > 0 ? "+" : ""}
                    {v.changePercent}%
                  </span>
                </div>
                <span className="text-silver-300 font-medium">
                  {formatCurrency(v.totalSpend)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Charts (simple bar representation) */}
      {trends.length > 0 && (
        <div className="rounded-xl border border-qy-border bg-qy-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Monthly Trends</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-silver-500 border-b border-qy-border">
                  <th className="text-left py-2 pr-4">Month</th>
                  <th className="text-right py-2 px-3">Cost/User</th>
                  <th className="text-right py-2 px-3">Deflection</th>
                  <th className="text-right py-2 px-3">Resolution</th>
                  <th className="text-right py-2 px-3">Satisfaction</th>
                  <th className="text-right py-2 px-3">Tickets</th>
                  <th className="text-right py-2 pl-3">Security</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((t) => (
                  <tr key={t.month} className="border-b border-qy-border/50">
                    <td className="py-2 pr-4 text-silver-300 font-medium">{t.month}</td>
                    <td className="py-2 px-3 text-right text-silver-300">${t.costPerUser}</td>
                    <td className="py-2 px-3 text-right text-blue-400">{t.deflectionRate}%</td>
                    <td className="py-2 px-3 text-right text-amber-400">{t.resolution}m</td>
                    <td className="py-2 px-3 text-right text-purple-400">{t.satisfaction}</td>
                    <td className="py-2 px-3 text-right text-silver-400">{t.ticketVolume}</td>
                    <td className="py-2 pl-3 text-right text-emerald-400">{t.securityScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Incidents */}
        <div className="rounded-xl border border-qy-border bg-qy-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold text-white">Active Incidents</h2>
          </div>
          {incidents.length === 0 ? (
            <p className="text-sm text-silver-500">No active incidents</p>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between rounded-lg border border-qy-border/50 bg-qy-bg/50 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded border ${severityColor(inc.severity)}`}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-sm text-silver-200 truncate">{inc.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-silver-500">
                    <Users className="h-3 w-3" />
                    {inc.affectedUsers?.length ?? 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Changes */}
        <div className="rounded-xl border border-qy-border bg-qy-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Upcoming Changes</h2>
          </div>
          {changes.length === 0 ? (
            <p className="text-sm text-silver-500">No scheduled changes</p>
          ) : (
            <div className="space-y-2">
              {changes
                .filter((c) => c.status === "planned" || c.status === "in_progress")
                .slice(0, 5)
                .map((chg) => (
                  <div
                    key={chg.id}
                    className="flex items-center justify-between rounded-lg border border-qy-border/50 bg-qy-bg/50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-silver-200 truncate">{chg.title}</p>
                      <p className="text-xs text-silver-500">
                        {new Date(chg.scheduledStart).toLocaleDateString()} &middot;{" "}
                        <span className={riskColor(chg.riskLevel)}>
                          {chg.riskLevel.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-silver-500 capitalize">{chg.type.replace(/_/g, " ")}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
