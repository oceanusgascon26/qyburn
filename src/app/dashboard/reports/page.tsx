"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  RefreshCw,
  Play,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  Shield,
  DollarSign,
  Bot,
  ClipboardCheck,
  Users,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

interface ReportTemplate {
  type: string;
  name: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  estimatedMinutes: number;
}

interface ITReport {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  schedule?: string;
  recipients: string[];
  lastGenerated?: string;
  output?: string;
  createdAt: string;
}

// ─── Component ──────────────────────────────────────────────

export default function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<ITReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<ITReport | null>(null);
  const [scheduleModal, setScheduleModal] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ cron: "0 9 * * 1", recipients: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, rptRes] = await Promise.all([
        fetch("/api/reports?view=templates"),
        fetch("/api/reports"),
      ]);

      const tplData = await tplRes.json();
      setTemplates(tplData.templates ?? []);

      const rptData = await rptRes.json();
      setReports(rptData.reports ?? []);
    } catch {
      toast.error("Failed to load reports");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateReport = async (type: string) => {
    setGenerating(type);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.report) {
        toast.success(`Report generated: ${data.report.name}`);
        setReports((prev) => [data.report, ...prev]);
      }
    } catch {
      toast.error("Failed to generate report");
    }
    setGenerating(null);
  };

  const scheduleReport = async (reportId: string) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          reportId,
          cron: scheduleForm.cron,
          recipients: scheduleForm.recipients.split(",").map((e) => e.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.report) {
        toast.success("Report scheduled");
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? data.report : r))
        );
      }
    } catch {
      toast.error("Failed to schedule report");
    }
    setScheduleModal(null);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "license_audit": return <KeyRound className="h-5 w-5 text-blue-400" />;
      case "security_posture": return <Shield className="h-5 w-5 text-red-400" />;
      case "cost_analysis": return <DollarSign className="h-5 w-5 text-emerald-400" />;
      case "bot_performance": return <Bot className="h-5 w-5 text-purple-400" />;
      case "compliance_status": return <ClipboardCheck className="h-5 w-5 text-amber-400" />;
      case "access_review": return <Users className="h-5 w-5 text-cyan-400" />;
      default: return <FileText className="h-5 w-5 text-silver-400" />;
    }
  };

  if (loading && templates.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">IT Reports</h1>
          <p className="text-sm text-silver-400">
            Generate and schedule IT reports across all systems
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg text-silver-400 hover:text-white hover:bg-qyburn-900/50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-sm font-semibold text-silver-300 mb-3">Report Templates</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.type}
              className="rounded-xl border border-qy-border bg-qy-card p-5 flex flex-col"
            >
              <div className="flex items-start gap-3 mb-3">
                {typeIcon(tpl.type)}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white">{tpl.name}</h3>
                  <p className="text-xs text-silver-500 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-3 flex items-center justify-between">
                <span className="text-xs text-silver-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> ~{tpl.estimatedMinutes}m
                </span>
                <button
                  onClick={() => generateReport(tpl.type)}
                  disabled={generating === tpl.type}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-qyburn-700 text-white hover:bg-qyburn-600 disabled:opacity-50 transition-colors"
                >
                  <Play
                    className={`h-3.5 w-3.5 ${generating === tpl.type ? "animate-pulse" : ""}`}
                  />
                  Generate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-sm font-semibold text-silver-300 mb-3">
          Generated Reports ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <div className="rounded-xl border border-qy-border bg-qy-card p-8 text-center">
            <FileText className="h-8 w-8 text-silver-600 mx-auto mb-3" />
            <p className="text-sm text-silver-500">
              No reports generated yet. Use the templates above to generate your first report.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-qy-border bg-qy-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {typeIcon(report.type)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-silver-200">{report.name}</p>
                      <div className="flex items-center gap-3 text-xs text-silver-500 mt-0.5">
                        <span>
                          {report.lastGenerated
                            ? new Date(report.lastGenerated).toLocaleString()
                            : "Never"}
                        </span>
                        {report.schedule && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Calendar className="h-3 w-3" /> Scheduled
                          </span>
                        )}
                        {report.recipients.length > 0 && (
                          <span>
                            {report.recipients.length} recipient(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setScheduleModal(report.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-silver-400 hover:text-white hover:bg-qyburn-900/50 transition-colors"
                    >
                      <Calendar className="h-3 w-3" />
                      Schedule
                    </button>
                    <button
                      onClick={() =>
                        setViewingReport(viewingReport?.id === report.id ? null : report)
                      }
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-qyburn-700 text-white hover:bg-qyburn-600 transition-colors"
                    >
                      {viewingReport?.id === report.id ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> View
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Report Output Viewer */}
                {viewingReport?.id === report.id && report.output && (
                  <div className="mt-4 pt-4 border-t border-qy-border/50">
                    <pre className="text-xs text-silver-300 whitespace-pre-wrap font-mono bg-qyburn-950/50 rounded-lg p-4 max-h-96 overflow-y-auto leading-relaxed">
                      {report.output}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-qy-border bg-qy-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Schedule Report</h3>
              <button
                onClick={() => setScheduleModal(null)}
                className="text-silver-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-silver-400 mb-1">
                  Cron Schedule
                </label>
                <select
                  value={scheduleForm.cron}
                  onChange={(e) =>
                    setScheduleForm((f) => ({ ...f, cron: e.target.value }))
                  }
                  className="w-full rounded-lg border border-qy-border bg-qy-bg px-3 py-2 text-sm text-silver-200 focus:outline-none focus:ring-1 focus:ring-qyburn-500"
                >
                  <option value="0 9 * * 1">Weekly (Monday 9am)</option>
                  <option value="0 9 1 * *">Monthly (1st, 9am)</option>
                  <option value="0 9 * * *">Daily (9am)</option>
                  <option value="0 9 1 1,4,7,10 *">Quarterly (1st of Q, 9am)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-silver-400 mb-1">
                  Recipients (comma-separated emails)
                </label>
                <input
                  type="text"
                  value={scheduleForm.recipients}
                  onChange={(e) =>
                    setScheduleForm((f) => ({ ...f, recipients: e.target.value }))
                  }
                  placeholder="admin@saga.com, cto@saga.com"
                  className="w-full rounded-lg border border-qy-border bg-qy-bg px-3 py-2 text-sm text-silver-200 placeholder:text-silver-600 focus:outline-none focus:ring-1 focus:ring-qyburn-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setScheduleModal(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-silver-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => scheduleReport(scheduleModal)}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-qyburn-700 text-white hover:bg-qyburn-600 transition-colors"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
