"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Plus,
  KeyRound,
  ShieldCheck,
  MessageSquare,
  Wrench,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import type { OnboardingTemplate, OnboardingStep } from "@/lib/mock-data";

const stepTypeConfig: Record<
  string,
  { icon: typeof KeyRound; label: string; color: string; bg: string }
> = {
  license: {
    icon: KeyRound,
    label: "License",
    color: "text-qyburn-400",
    bg: "bg-qyburn-900/40",
  },
  group: {
    icon: ShieldCheck,
    label: "Group",
    color: "text-wildfire-400",
    bg: "bg-wildfire-900/40",
  },
  message: {
    icon: MessageSquare,
    label: "Message",
    color: "text-blue-400",
    bg: "bg-blue-900/40",
  },
  custom: {
    icon: Wrench,
    label: "Custom",
    color: "text-silver-300",
    bg: "bg-silver-800/40",
  },
};

function StepCard({ step, index }: { step: OnboardingStep; index: number }) {
  const cfg = stepTypeConfig[step.type] ?? stepTypeConfig.custom;
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-4 relative">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`h-10 w-10 rounded-full ${cfg.bg} flex items-center justify-center z-10`}
        >
          <Icon className={`h-5 w-5 ${cfg.color}`} />
        </div>
        <div className="w-px h-full bg-qy-border absolute top-10 left-5" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-silver-500">
            Step {index + 1}
          </span>
          <span className={`qy-badge ${cfg.bg} ${cfg.color} text-[10px]`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm font-medium text-white mt-1">{step.title}</p>
        {step.description && (
          <p className="text-xs text-silver-400 mt-0.5">{step.description}</p>
        )}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  expanded,
  onToggle,
}: {
  template: OnboardingTemplate;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="qy-card">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-qyburn-900/40 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-qyburn-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {template.name}
            </h3>
            {template.department && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 text-silver-500" />
                <span className="text-xs text-silver-400">
                  {template.department}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {template.isActive ? (
            <span className="qy-badge-green flex items-center gap-1">
              <ToggleRight className="h-3 w-3" />
              Active
            </span>
          ) : (
            <span className="qy-badge-silver flex items-center gap-1">
              <ToggleLeft className="h-3 w-3" />
              Inactive
            </span>
          )}
        </div>
      </div>

      {template.description && (
        <p className="text-sm text-silver-400 mt-3">{template.description}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-qy-border">
        <span className="text-xs text-silver-500">
          {template.steps.length} step{template.steps.length !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-silver-500">
          Created {new Date(template.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={onToggle}
          className="ml-auto flex items-center gap-1 text-xs text-qyburn-400 hover:text-qyburn-300 transition-colors"
        >
          {expanded ? (
            <>
              Hide steps <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              View steps <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Expanded steps */}
      {expanded && template.steps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-qy-border">
          {template.steps
            .sort((a, b) => a.order - b.order)
            .map((step, i) => (
              <StepCard key={step.id} step={step} index={i} />
            ))}
        </div>
      )}
    </div>
  );
}

function NewTemplateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; department: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    department: "",
    description: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Template Name *
        </label>
        <input
          className="qy-input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Engineering New Hire"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Department
        </label>
        <input
          className="qy-input"
          value={form.department}
          onChange={(e) =>
            setForm((f) => ({ ...f, department: e.target.value }))
          }
          placeholder="e.g. Engineering"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Description
        </label>
        <textarea
          className="qy-input min-h-[80px] resize-y"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="What is this template used for?"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-qy-border">
        <button onClick={onCancel} className="qy-btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(form)}
          className="qy-btn-primary"
          disabled={!form.name}
        >
          Create Template
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/onboarding");
    setTemplates(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleAdd = async (data: {
    name: string;
    department: string;
    description: string;
  }) => {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Template created");
      setAddOpen(false);
      fetchTemplates();
    }
  };

  const totalSteps = templates.reduce((s, t) => s + t.steps.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Onboarding Templates
          </h1>
          <p className="text-sm text-silver-400 mt-1">
            {templates.length} template{templates.length !== 1 ? "s" : ""}{" "}
            &middot; {totalSteps} total steps
          </p>
        </div>
        <button className="qy-btn-primary" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Templates */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="qy-skeleton h-40 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="qy-card flex flex-col items-center justify-center py-16">
          <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
            <UserPlus className="h-8 w-8 text-qyburn-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            No onboarding templates
          </h3>
          <p className="text-sm text-silver-400 mb-4 text-center max-w-md">
            Create templates to automate new employee provisioning.
          </p>
          <button
            className="qy-btn-primary"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              expanded={expandedId === template.id}
              onToggle={() =>
                setExpandedId(expandedId === template.id ? null : template.id)
              }
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Onboarding Template"
        description="Create a template to automate provisioning for new hires."
      >
        <NewTemplateForm
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </div>
  );
}
