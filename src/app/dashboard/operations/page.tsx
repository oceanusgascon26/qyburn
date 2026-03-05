"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Zap,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  Clock,
  Server,
  Shield,
  Globe,
  Database,
  AppWindow,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

interface RemediationEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  userId: string;
  userEmail: string;
  action: string;
  result: "success" | "failed" | "escalated";
  details?: string;
  createdAt: string;
}

interface RemediationStats {
  totalDetected: number;
  autoResolved: number;
  escalated: number;
  failed: number;
}

interface RemediationRule {
  id: string;
  name: string;
  trigger: { type: string; threshold?: number };
  action: { type: string; autoExecute: boolean };
  cooldownMinutes: number;
}

interface Runbook {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  executionCount: number;
  lastExecuted?: string;
}

interface RunbookExecution {
  id: string;
  runbookId: string;
  runbookName: string;
  executor: string;
  status: string;
  startedAt: string;
  completedAt?: string;
}

interface IncidentCluster {
  id: string;
  title: string;
  severity: "P1" | "P2" | "P3";
  affectedUsers: string[];
  symptoms: string[];
  possibleCause: string;
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
  affectedSystems: string[];
}

// ─── Component ──────────────────────────────────────────────

export default function OperationsPage() {
  const [remediationHistory, setRemediationHistory] = useState<RemediationEvent[]>([]);
  const [remediationStats, setRemediationStats] = useState<RemediationStats | null>(null);
  const [rules, setRules] = useState<RemediationRule[]>([]);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [incidents, setIncidents] = useState<IncidentCluster[]>([]);
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [expandedRunbook, setExpandedRunbook] = useState<string | null>(null);
  const [executingRunbook, setExecutingRunbook] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [remRes, rbRes, incRes, chgRes] = await Promise.all([
        fetch("/api/remediation"),
        fetch("/api/runbooks"),
        fetch("/api/incidents"),
        fetch("/api/changes?view=calendar"),
      ]);

      const remData = await remRes.json();
      setRemediationHistory(remData.history ?? []);
      setRemediationStats(remData.stats ?? null);
      setRules(remData.rules ?? []);

      const rbData = await rbRes.json();
      setRunbooks(rbData.runbooks ?? []);

      const incData = await incRes.json();
      setIncidents(incData.incidents ?? []);

      const chgData = await chgRes.json();
      setChanges(chgData.calendar ?? []);
    } catch {
      toast.error("Failed to load operations data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runScan = async () => {
    setScanLoading(true);
    try {
      const res = await fetch("/api/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cycle" }),
      });
      const data = await res.json();
      toast.success(`Remediation cycle complete: ${data.count ?? 0} actions taken`);
      fetchData();
    } catch {
      toast.error("Scan failed");
    }
    setScanLoading(false);
  };

  const executeRunbook = async (runbookId: string) => {
    setExecutingRunbook(runbookId);
    try {
      const res = await fetch("/api/runbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runbookId, params: {} }),
      });
      const data = await res.json();
      const status = data.execution?.status ?? "unknown";
      if (status === "completed") {
        toast.success(`Runbook executed successfully`);
      } else if (status === "failed") {
        toast.error(`Runbook execution failed`);
      } else {
        toast.info(`Runbook status: ${status}`);
      }
      fetchData();
    } catch {
      toast.error("Failed to execute runbook");
    }
    setExecutingRunbook(null);
  };

  const runCorrelation = async () => {
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "correlate" }),
      });
      const data = await res.json();
      const newCount = data.newIncidents?.length ?? 0;
      toast.success(
        newCount > 0
          ? `Correlation found ${newCount} new incident(s)`
          : "No new incident clusters detected"
      );
      fetchData();
    } catch {
      toast.error("Correlation failed");
    }
  };

  const resultIcon = (result: string) => {
    if (result === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (result === "failed") return <XCircle className="h-4 w-4 text-red-400" />;
    return <ArrowUpCircle className="h-4 w-4 text-amber-400" />;
  };

  const severityColor = (sev: string) => {
    if (sev === "P1") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (sev === "P2") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "infrastructure": return <Server className="h-4 w-4 text-blue-400" />;
      case "security": return <Shield className="h-4 w-4 text-red-400" />;
      case "application": return <AppWindow className="h-4 w-4 text-purple-400" />;
      case "network": return <Globe className="h-4 w-4 text-emerald-400" />;
      case "database": return <Database className="h-4 w-4 text-amber-400" />;
      default: return <Wrench className="h-4 w-4 text-silver-400" />;
    }
  };

  const riskColor = (risk: string) => {
    if (risk === "high") return "text-red-400";
    if (risk === "medium") return "text-amber-400";
    return "text-emerald-400";
  };

  if (loading && !remediationStats) {
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
          <h1 className="text-2xl font-bold text-white">IT Operations Center</h1>
          <p className="text-sm text-silver-400">
            Self-healing infrastructure, runbooks, and incident management
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg text-silver-400 hover:text-white hover:bg-qyburn-900/50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Auto-Remediation Section */}
      <div className="rounded-xl border border-qy-border bg-qy-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-wildfire-400" />
            <h2 className="text-sm font-semibold text-white">Auto-Remediation</h2>
            {remediationStats && (
              <div className="flex items-center gap-3 ml-4 text-xs">
                <span className="text-emerald-400">
                  {remediationStats.autoResolved} resolved
                </span>
                <span className="text-amber-400">
                  {remediationStats.escalated} escalated
                </span>
                <span className="text-red-400">{remediationStats.failed} failed</span>
              </div>
            )}
          </div>
          <button
            onClick={runScan}
            disabled={scanLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-qyburn-700 text-white hover:bg-qyburn-600 disabled:opacity-50 transition-colors"
          >
            <Zap className={`h-3.5 w-3.5 ${scanLoading ? "animate-pulse" : ""}`} />
            Run Scan
          </button>
        </div>

        {remediationHistory.length === 0 ? (
          <p className="text-sm text-silver-500">
            No remediation events yet. Run a scan to detect and fix issues.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {remediationHistory.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-qy-border/50 bg-qy-bg/50 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {resultIcon(event.result)}
                  <div className="min-w-0">
                    <p className="text-sm text-silver-200 truncate">{event.ruleName}</p>
                    <p className="text-xs text-silver-500 truncate">{event.details}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-xs text-silver-400">{event.userEmail}</p>
                  <p className="text-xs text-silver-500">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Runbook Library */}
      <div className="rounded-xl border border-qy-border bg-qy-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Runbook Library</h2>
          <span className="text-xs text-silver-500 ml-1">({runbooks.length} runbooks)</span>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {runbooks.map((rb) => (
            <div
              key={rb.id}
              className="rounded-lg border border-qy-border/50 bg-qy-bg/50 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 min-w-0">
                  {categoryIcon(rb.category)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-silver-200">{rb.name}</p>
                    <button
                      onClick={() =>
                        setExpandedRunbook(expandedRunbook === rb.id ? null : rb.id)
                      }
                      className="text-xs text-silver-500 hover:text-silver-300 flex items-center gap-1 mt-0.5"
                    >
                      {expandedRunbook === rb.id ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> Show details
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => executeRunbook(rb.id)}
                  disabled={executingRunbook === rb.id}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  <Play className={`h-3 w-3 ${executingRunbook === rb.id ? "animate-pulse" : ""}`} />
                  Execute
                </button>
              </div>

              {expandedRunbook === rb.id && (
                <div className="mt-3 pt-3 border-t border-qy-border/30">
                  <p className="text-xs text-silver-400 mb-2">{rb.description}</p>
                  <div className="flex items-center gap-4 text-xs text-silver-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> ~{rb.estimatedMinutes}m
                    </span>
                    <span>Runs: {rb.executionCount}</span>
                    <span className="capitalize">{rb.category}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Incident Correlation */}
        <div className="rounded-xl border border-qy-border bg-qy-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Incident Correlation</h2>
            </div>
            <button
              onClick={runCorrelation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Correlate
            </button>
          </div>

          {incidents.length === 0 ? (
            <p className="text-sm text-silver-500">
              No active incident clusters. Run correlation to scan.
            </p>
          ) : (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="rounded-lg border border-qy-border/50 bg-qy-bg/50 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded border ${severityColor(inc.severity)}`}
                      >
                        {inc.severity}
                      </span>
                      <span className="text-sm text-silver-200">{inc.title}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-silver-500">
                      <Users className="h-3 w-3" /> {inc.affectedUsers?.length ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-silver-500 truncate">{inc.possibleCause}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {inc.symptoms?.slice(0, 4).map((s: string) => (
                      <span
                        key={s}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-qyburn-900/50 text-silver-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Calendar */}
        <div className="rounded-xl border border-qy-border bg-qy-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Change Calendar</h2>
          </div>

          {changes.length === 0 ? (
            <p className="text-sm text-silver-500">No scheduled changes</p>
          ) : (
            <div className="space-y-2">
              {changes
                .filter((c) => c.status === "planned" || c.status === "in_progress")
                .map((chg) => (
                  <div
                    key={chg.id}
                    className="rounded-lg border border-qy-border/50 bg-qy-bg/50 p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-silver-200 truncate">{chg.title}</p>
                      <span className={`text-xs font-medium ${riskColor(chg.riskLevel)}`}>
                        {chg.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-silver-500">
                      <span>
                        {new Date(chg.scheduledStart).toLocaleDateString()},{" "}
                        {new Date(chg.scheduledStart).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="capitalize">{chg.type.replace(/_/g, " ")}</span>
                      <span>{chg.affectedSystems?.slice(0, 2).join(", ")}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
