"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Users,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Clock,
  Flame,
  BookOpen,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import type { AuditLogEntry } from "@/lib/mock-data";
import { RequestVolumeChart } from "@/components/charts/RequestVolumeChart";
import { LicenseUsageChart } from "@/components/charts/LicenseUsageChart";
import { useSSE } from "@/lib/use-sse";

interface DashboardStats {
  activeLicenses: number;
  totalLicenseSeats: number;
  licenseCount: number;
  restrictedGroupCount: number;
  pendingRequests: number;
  templateCount: number;
  auditLogCount: number;
  knowledgeDocCount: number;
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

const actionLabels: Record<string, string> = {
  "license.assign": "assigned license",
  "license.revoke": "revoked license",
  "group.request": "requested access to",
  "group.approve": "approved access to",
  "group.deny": "denied access to",
  "kb.query": "queried KB about",
  "onboarding.start": "started onboarding",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [statsRes, logsRes] = await Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/audit?limit=6"),
    ]);
    setStats(await statsRes.json());
    setRecentLogs(await logsRes.json());
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates via SSE
  useSSE(
    useCallback(
      (type: string) => {
        if (type === "activity" || type === "stats") {
          fetchData();
        }
      },
      [fetchData]
    )
  );

  const statCards = stats
    ? [
        {
          label: "Active Licenses",
          value: stats.activeLicenses.toString(),
          sub: `${stats.licenseCount} in catalog, ${stats.totalLicenseSeats} total seats`,
          icon: KeyRound,
          color: "text-qyburn-400",
          bgColor: "bg-qyburn-900/40",
        },
        {
          label: "Bot Requests (24h)",
          value: "83",
          sub: "+18% vs last week",
          icon: MessageSquare,
          color: "text-wildfire-400",
          bgColor: "bg-wildfire-900/40",
        },
        {
          label: "Restricted Groups",
          value: stats.restrictedGroupCount.toString(),
          sub: `${stats.pendingRequests} pending approval${stats.pendingRequests !== 1 ? "s" : ""}`,
          icon: ShieldCheck,
          color: "text-qyburn-300",
          bgColor: "bg-qyburn-900/40",
        },
        {
          label: "Knowledge Docs",
          value: stats.knowledgeDocCount.toString(),
          sub: `${stats.templateCount} onboarding templates`,
          icon: BookOpen,
          color: "text-blue-400",
          bgColor: "bg-blue-900/40",
        },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-silver-400 mt-1">
            Welcome back. Here&apos;s what&apos;s happening with Qyburn today.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-silver-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {lastUpdated.toLocaleTimeString()}
        </button>
      </div>

      {/* Stats grid */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="qy-skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="qy-card group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-silver-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-silver-500 mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-wildfire-500" />
                    {stat.sub}
                  </p>
                </div>
                <div
                  className={`${stat.bgColor} rounded-lg p-2.5 transition-transform group-hover:scale-110`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4">
            Request Volume (7-day)
          </h2>
          <RequestVolumeChart />
        </div>
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white mb-4">
            License Seat Usage
          </h2>
          <LicenseUsageChart />
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity from audit log */}
        <div className="lg:col-span-2 qy-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <span className="qy-badge-purple">
              {stats?.auditLogCount ?? 0} total events
            </span>
          </div>
          {loading && recentLogs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="qy-skeleton h-14 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2.5 border-b border-qy-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-qyburn-800 flex items-center justify-center text-xs font-bold text-qyburn-300">
                      {log.actor === "qyburn-bot"
                        ? "QB"
                        : log.actor
                            .split(/[@.]/)
                            .slice(0, 2)
                            .map((n) => n[0]?.toUpperCase() ?? "")
                            .join("")}
                    </div>
                    <div>
                      <p className="text-sm text-silver-200">
                        <span className="font-medium text-white">
                          {log.actor === "qyburn-bot" ? "Qyburn" : log.actor}
                        </span>{" "}
                        {actionLabels[log.action] ?? log.action}{" "}
                        {log.target && (
                          <span className="font-medium text-qyburn-300">
                            {log.target}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-silver-500">
                        {relativeTime(log.createdAt)}
                        {log.channel && ` in ${log.channel}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bot status */}
        <div className="qy-card">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-wildfire-400" />
            <h2 className="text-lg font-semibold text-white">Bot Status</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Status</span>
              <span className="flex items-center gap-1.5 text-sm text-wildfire-400">
                <span className="h-2 w-2 rounded-full bg-wildfire-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Uptime</span>
              <span className="text-sm text-silver-200">14d 6h 32m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Avg Response</span>
              <span className="text-sm text-silver-200">1.2s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Resolution Rate</span>
              <span className="text-sm text-wildfire-400">94%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Knowledge Docs</span>
              <span className="text-sm text-silver-200">
                {stats?.knowledgeDocCount ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Templates</span>
              <span className="text-sm text-silver-200">
                {stats?.templateCount ?? "—"}
              </span>
            </div>
            <hr className="border-qy-border" />
            <div className="text-center">
              <p className="text-xs text-silver-500">
                Connected to Slack workspace
              </p>
              <p className="text-sm font-medium text-qyburn-300 mt-1">
                SAGA Diagnostics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
