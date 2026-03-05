"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Workflow,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  UserMinus,
  ShieldCheck,
  KeyRound,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface WorkflowStep {
  index?: number;
  id: string;
  action: string;
  description: string;
  status: string;
  error?: string;
  approvedBy?: string;
  startedAt?: string;
  completedAt?: string;
}

interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  status: string;
  triggeredBy: string;
  currentStep: number;
  totalSteps: number;
  createdAt: string;
  completedAt?: string;
  steps: WorkflowStep[];
}

interface WorkflowTemplate {
  key: string;
  name: string;
  description: string;
  icon: typeof Workflow;
  color: string;
  bgColor: string;
  fields: { key: string; label: string; placeholder: string; required: boolean }[];
}

const templates: WorkflowTemplate[] = [
  {
    key: "onboarding",
    name: "Onboarding",
    description: "8-step new hire provisioning: AD account, M365, groups, Teams, Jira, tools, welcome email, manager 1:1",
    icon: UserPlus,
    color: "text-wildfire-400",
    bgColor: "bg-wildfire-900/40",
    fields: [
      { key: "name", label: "Full Name", placeholder: "Jane Doe", required: true },
      { key: "email", label: "Email", placeholder: "jane.doe@sagadiagnostics.com", required: true },
      { key: "department", label: "Department", placeholder: "Engineering", required: false },
      { key: "managerEmail", label: "Manager Email", placeholder: "manager@sagadiagnostics.com", required: false },
      { key: "startDate", label: "Start Date", placeholder: "2026-03-15", required: false },
    ],
  },
  {
    key: "offboarding",
    name: "Offboarding",
    description: "6-step departure: revoke licenses, remove groups, disable account, transfer mailbox, archive, notify",
    icon: UserMinus,
    color: "text-red-400",
    bgColor: "bg-red-900/40",
    fields: [
      { key: "name", label: "Full Name", placeholder: "Bob Smith", required: true },
      { key: "email", label: "Email", placeholder: "bob.smith@sagadiagnostics.com", required: true },
      { key: "managerEmail", label: "Manager Email", placeholder: "manager@sagadiagnostics.com", required: false },
      { key: "lastDay", label: "Last Day", placeholder: "2026-03-31", required: false },
    ],
  },
  {
    key: "access_review",
    name: "Access Review",
    description: "3-step review: list members, send review to manager, apply approved removals",
    icon: ShieldCheck,
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/40",
    fields: [
      { key: "groupName", label: "Group Name", placeholder: "Engineering Team", required: true },
      { key: "groupId", label: "Group ID (optional)", placeholder: "group-123", required: false },
      { key: "managerEmail", label: "Manager Email", placeholder: "manager@sagadiagnostics.com", required: false },
    ],
  },
  {
    key: "license_audit",
    name: "License Audit",
    description: "4-step audit: scan utilization, identify unused, generate reclamation, send report to IT manager",
    icon: KeyRound,
    color: "text-amber-400",
    bgColor: "bg-amber-900/40",
    fields: [],
  },
];

const stepStatusIcon: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  failed: XCircle,
  running: Loader2,
  awaiting_approval: AlertTriangle,
  pending: Clock,
};

const stepStatusColor: Record<string, string> = {
  completed: "text-wildfire-400",
  failed: "text-red-400",
  running: "text-blue-400 animate-spin",
  awaiting_approval: "text-amber-400",
  pending: "text-silver-500",
};

function WorkflowDuration(props: { createdAt: string; completedAt?: string }) {
  const start = new Date(props.createdAt).getTime();
  const end = props.completedAt
    ? new Date(props.completedAt).getTime()
    : Date.now();
  const diffSec = Math.floor((end - start) / 1000);
  if (diffSec < 60) return <span>{diffSec}s</span>;
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  return (
    <span>
      {min}m {sec}s
    </span>
  );
}

export default function AgentsPage() {
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState<string | null>(null);
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({});

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setWorkflows(data.workflows ?? []);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const triggerWorkflow = async (templateKey: string) => {
    setTriggering(templateKey);
    try {
      const context = { ...templateFields };
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: templateKey,
          context,
          triggeredBy: "admin@sagadiagnostics.com",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to trigger workflow");
      } else {
        toast.success(`Workflow "${data.name}" started`);
        setShowTemplateModal(null);
        setTemplateFields({});
        await fetchWorkflows();
      }
    } catch {
      toast.error("Failed to trigger workflow");
    }
    setTriggering(null);
  };

  const handleApproval = async (
    workflowId: string,
    stepIndex: number,
    action: "approve" | "reject"
  ) => {
    try {
      const res = await fetch(`/api/agents/${workflowId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepIndex,
          action,
          approvedBy: "admin@sagadiagnostics.com",
          reason: action === "reject" ? "Rejected from dashboard" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? `Failed to ${action} step`);
      } else {
        toast.success(
          `Step ${action === "approve" ? "approved" : "rejected"}`
        );
        await fetchWorkflows();
      }
    } catch {
      toast.error(`Failed to ${action} step`);
    }
  };

  const activeWorkflows = workflows.filter(
    (w) => w.status === "running" || w.status === "paused"
  );
  const approvalQueue = workflows
    .filter((w) => w.status === "paused")
    .flatMap((w) =>
      w.steps
        .filter((s) => s.status === "awaiting_approval")
        .map((s, _i) => ({ workflow: w, step: s }))
    );
  const completedWorkflows = workflows.filter(
    (w) => w.status === "completed" || w.status === "failed"
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Workflows</h1>
          <p className="text-sm text-silver-400 mt-1">
            Automated multi-step IT workflows with approval gates and rollback.
          </p>
        </div>
        <button
          onClick={fetchWorkflows}
          className="flex items-center gap-2 text-sm text-silver-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Workflow Templates */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Workflow Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.key} className="qy-card group">
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-lg p-2.5 ${tpl.bgColor}`}>
                  <tpl.icon className={`h-5 w-5 ${tpl.color}`} />
                </div>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                {tpl.name}
              </h3>
              <p className="text-xs text-silver-400 mb-4 leading-relaxed">
                {tpl.description}
              </p>
              <button
                onClick={() => {
                  if (tpl.fields.length === 0) {
                    triggerWorkflow(tpl.key);
                  } else {
                    setShowTemplateModal(tpl.key);
                    setTemplateFields({});
                  }
                }}
                disabled={triggering === tpl.key}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-qyburn-700 hover:bg-qyburn-600 text-white text-sm font-medium py-2 px-4 transition-colors disabled:opacity-50"
              >
                {triggering === tpl.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Workflow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-qyburn-950 border border-qy-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              {templates.find((t) => t.key === showTemplateModal)?.name} Configuration
            </h3>
            <div className="space-y-3">
              {templates
                .find((t) => t.key === showTemplateModal)
                ?.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm text-silver-300 mb-1">
                      {field.label}
                      {field.required && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={templateFields[field.key] ?? ""}
                      onChange={(e) =>
                        setTemplateFields((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full bg-qyburn-900 border border-qy-border rounded-lg px-3 py-2 text-sm text-white placeholder-silver-600 focus:outline-none focus:ring-1 focus:ring-qyburn-500"
                    />
                  </div>
                ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTemplateModal(null);
                  setTemplateFields({});
                }}
                className="flex-1 rounded-lg border border-qy-border text-silver-300 text-sm py-2 hover:bg-qyburn-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => triggerWorkflow(showTemplateModal)}
                disabled={triggering !== null}
                className="flex-1 rounded-lg bg-qyburn-700 hover:bg-qyburn-600 text-white text-sm py-2 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {triggering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Queue */}
      {approvalQueue.length > 0 && (
        <div className="qy-card border-l-4 border-l-amber-500">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Approval Queue
            <span className="qy-badge-purple ml-2">
              {approvalQueue.length} pending
            </span>
          </h2>
          <div className="space-y-3">
            {approvalQueue.map(({ workflow, step }) => (
              <div
                key={`${workflow.id}-${step.id}`}
                className="flex items-center justify-between py-3 border-b border-qy-border/50 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {step.description}
                  </p>
                  <p className="text-xs text-silver-400 mt-0.5">
                    Workflow: {workflow.name} | Action: {step.action}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() =>
                      handleApproval(
                        workflow.id,
                        step.index ?? workflow.currentStep,
                        "approve"
                      )
                    }
                    className="flex items-center gap-1 rounded-lg bg-wildfire-600 hover:bg-wildfire-500 text-white text-xs font-medium py-1.5 px-3 transition-colors"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleApproval(
                        workflow.id,
                        step.index ?? workflow.currentStep,
                        "reject"
                      )
                    }
                    className="flex items-center gap-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium py-1.5 px-3 transition-colors"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Workflows */}
      <div className="qy-card">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Workflow className="h-5 w-5 text-qyburn-400" />
          Active Workflows
          <span className="qy-badge-purple ml-2">
            {activeWorkflows.length} running
          </span>
        </h2>

        {activeWorkflows.length === 0 ? (
          <p className="text-sm text-silver-500 py-8 text-center">
            No active workflows. Use a template above to start one.
          </p>
        ) : (
          <div className="space-y-3">
            {activeWorkflows.map((wf) => (
              <WorkflowRow
                key={wf.id}
                workflow={wf}
                expanded={expandedWorkflow === wf.id}
                onToggle={() =>
                  setExpandedWorkflow(
                    expandedWorkflow === wf.id ? null : wf.id
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Workflows */}
      <div className="qy-card">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-silver-500" />
          Completed Workflows
        </h2>

        {loading && completedWorkflows.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="qy-skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : completedWorkflows.length === 0 ? (
          <p className="text-sm text-silver-500 py-8 text-center">
            No completed workflows yet.
          </p>
        ) : (
          <div className="space-y-3">
            {completedWorkflows.map((wf) => (
              <WorkflowRow
                key={wf.id}
                workflow={wf}
                expanded={expandedWorkflow === wf.id}
                onToggle={() =>
                  setExpandedWorkflow(
                    expandedWorkflow === wf.id ? null : wf.id
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowRow({
  workflow,
  expanded,
  onToggle,
}: {
  workflow: AgentWorkflow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const completedSteps = workflow.steps.filter(
    (s) => s.status === "completed"
  ).length;
  const progressPct =
    workflow.totalSteps > 0
      ? Math.round((completedSteps / workflow.totalSteps) * 100)
      : 0;

  const statusBadge: Record<string, { label: string; className: string }> = {
    running: {
      label: "Running",
      className: "bg-blue-900/30 text-blue-400",
    },
    paused: {
      label: "Awaiting Approval",
      className: "bg-amber-900/30 text-amber-400",
    },
    completed: {
      label: "Completed",
      className: "bg-wildfire-900/30 text-wildfire-400",
    },
    failed: {
      label: "Failed",
      className: "bg-red-900/30 text-red-400",
    },
  };

  const badge = statusBadge[workflow.status] ?? statusBadge.running;

  return (
    <div className="border border-qy-border/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-qyburn-900/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-silver-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-silver-500 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {workflow.name}
            </p>
            <p className="text-xs text-silver-400">
              by {workflow.triggeredBy} |{" "}
              <WorkflowDuration
                createdAt={workflow.createdAt}
                completedAt={workflow.completedAt}
              />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          {/* Progress bar */}
          <div className="w-32 hidden sm:block">
            <div className="h-1.5 bg-qyburn-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  workflow.status === "failed"
                    ? "bg-red-500"
                    : workflow.status === "completed"
                      ? "bg-wildfire-500"
                      : "bg-qyburn-500"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-silver-500 mt-0.5 text-center">
              {completedSteps}/{workflow.totalSteps} steps
            </p>
          </div>

          <span
            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </button>

      {/* Expanded step details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-qy-border/30">
          <div className="mt-3 space-y-2">
            {workflow.steps.map((step, idx) => {
              const StepIcon =
                stepStatusIcon[step.status] ?? Clock;
              const color =
                stepStatusColor[step.status] ?? "text-silver-500";

              return (
                <div
                  key={step.id}
                  className="flex items-start gap-3 py-2 text-sm"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <StepIcon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-silver-200">{step.description}</p>
                    <p className="text-xs text-silver-500 mt-0.5">
                      <span className="font-mono">{step.action}</span>
                      {step.error && (
                        <span className="text-red-400 ml-2">
                          {step.error}
                        </span>
                      )}
                      {step.approvedBy && (
                        <span className="text-amber-400 ml-2">
                          Approved by {step.approvedBy}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-silver-600 flex-shrink-0">
                    Step {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
