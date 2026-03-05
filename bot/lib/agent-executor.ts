/**
 * Agent Executor — Agentic multi-step workflow execution engine.
 *
 * Supports sequential step execution with approval gates, rollback,
 * Slack notification stubs, and pre-built workflow templates for
 * common IT operations (onboarding, offboarding, access review, license audit).
 */

import { emitSSE } from "../../src/lib/sse";

// ─── Types ───────────────────────────────────────────────────

export interface AgentStep {
  id: string;
  action: string;
  description: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status:
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "awaiting_approval";
  error?: string;
  approvedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: AgentStep[];
  triggeredBy: string;
  context: Record<string, unknown>;
  status: "running" | "completed" | "failed" | "paused";
  currentStep: number;
  createdAt: Date;
  completedAt?: Date;
}

// ─── Action registry (stubs) ────────────────────────────────

type ActionHandler = (
  input: Record<string, unknown>
) => Promise<Record<string, unknown>>;

const actionHandlers = new Map<string, ActionHandler>([
  [
    "create_ad_account",
    async (input) => {
      console.log(
        `[AGENT] Creating AD account for ${input.name} (${input.email})`
      );
      return {
        userId: `user-${Date.now()}`,
        email: input.email,
        status: "created",
      };
    },
  ],
  [
    "assign_m365_license",
    async (input) => {
      console.log(
        `[AGENT] Assigning M365 ${input.licenseTier ?? "E5"} to ${input.email}`
      );
      return {
        license: input.licenseTier ?? "E5",
        assigned: true,
        sku: "SPE_E5",
      };
    },
  ],
  [
    "add_to_group",
    async (input) => {
      console.log(
        `[AGENT] Adding ${input.email} to group ${input.groupName}`
      );
      return {
        groupId: input.groupId ?? `group-${Date.now()}`,
        groupName: input.groupName,
        added: true,
      };
    },
  ],
  [
    "add_to_teams",
    async (input) => {
      console.log(
        `[AGENT] Adding ${input.email} to Teams channel ${input.teamName}`
      );
      return { teamName: input.teamName, added: true };
    },
  ],
  [
    "create_jira_account",
    async (input) => {
      console.log(`[AGENT] Creating Jira account for ${input.email}`);
      return { jiraAccountId: `jira-${Date.now()}`, email: input.email };
    },
  ],
  [
    "assign_tools",
    async (input) => {
      const tools = (input.tools as string[]) ?? [
        "Slack",
        "Jira",
        "Confluence",
      ];
      console.log(
        `[AGENT] Assigning tools to ${input.email}: ${tools.join(", ")}`
      );
      return { tools, assigned: true };
    },
  ],
  [
    "send_welcome_email",
    async (input) => {
      console.log(`[AGENT] Sending welcome email to ${input.email}`);
      return { sent: true, template: "welcome-new-hire" };
    },
  ],
  [
    "schedule_meeting",
    async (input) => {
      console.log(
        `[AGENT] Scheduling meeting: ${input.email} with ${input.managerEmail}`
      );
      return {
        meetingId: `mtg-${Date.now()}`,
        scheduled: true,
        with: input.managerEmail,
      };
    },
  ],
  [
    "revoke_licenses",
    async (input) => {
      console.log(`[AGENT] Revoking all licenses for ${input.email}`);
      return { revoked: true, count: 3 };
    },
  ],
  [
    "remove_from_groups",
    async (input) => {
      console.log(
        `[AGENT] Removing ${input.email} from all groups`
      );
      return { removed: true, groupCount: 5 };
    },
  ],
  [
    "disable_account",
    async (input) => {
      console.log(
        `[AGENT] Disabling Azure AD account for ${input.email}`
      );
      return { disabled: true, signInBlocked: true };
    },
  ],
  [
    "transfer_mailbox",
    async (input) => {
      console.log(
        `[AGENT] Transferring mailbox from ${input.email} to ${input.transferTo}`
      );
      return {
        transferred: true,
        from: input.email,
        to: input.transferTo,
      };
    },
  ],
  [
    "archive_files",
    async (input) => {
      console.log(
        `[AGENT] Archiving OneDrive files for ${input.email}`
      );
      return { archived: true, fileCount: 247, sizeGB: 3.2 };
    },
  ],
  [
    "notify_manager",
    async (input) => {
      console.log(
        `[AGENT] Notifying manager ${input.managerEmail} about ${input.subject}`
      );
      return { notified: true, channel: "slack" };
    },
  ],
  [
    "list_group_members",
    async (input) => {
      console.log(
        `[AGENT] Listing members of group ${input.groupName}`
      );
      return {
        members: [
          "jane.doe@sagadiagnostics.com",
          "bob.smith@sagadiagnostics.com",
          "alice.wong@sagadiagnostics.com",
        ],
        count: 3,
      };
    },
  ],
  [
    "send_review_request",
    async (input) => {
      console.log(
        `[AGENT] Sending access review request to ${input.managerEmail} for group ${input.groupName}`
      );
      return { sent: true, reviewDeadline: "2026-03-18T00:00:00Z" };
    },
  ],
  [
    "apply_removals",
    async (input) => {
      const removals = (input.removals as string[]) ?? [];
      console.log(
        `[AGENT] Applying ${removals.length} removals from group ${input.groupName}`
      );
      return { applied: true, removedCount: removals.length };
    },
  ],
  [
    "scan_license_utilization",
    async () => {
      console.log("[AGENT] Scanning license utilization across all tenants");
      return {
        totalLicenses: 150,
        activeUsers: 128,
        unusedLicenses: 22,
        utilizationRate: 85.3,
      };
    },
  ],
  [
    "identify_unused_licenses",
    async () => {
      console.log("[AGENT] Identifying unused licenses (no sign-in > 30 days)");
      return {
        unused: [
          { user: "departed.user@sagadiagnostics.com", license: "M365 E5", lastSignIn: "2026-01-05" },
          { user: "contractor.old@sagadiagnostics.com", license: "M365 E3", lastSignIn: "2025-12-20" },
          { user: "intern.summer@sagadiagnostics.com", license: "M365 E3", lastSignIn: "2025-11-15" },
        ],
        count: 3,
        potentialSavings: 156.0,
      };
    },
  ],
  [
    "generate_reclamation_list",
    async (input) => {
      console.log("[AGENT] Generating license reclamation list");
      return {
        reclamationList: input.unused ?? [],
        totalSavings: 156.0,
        generated: true,
      };
    },
  ],
  [
    "send_report",
    async (input) => {
      console.log(
        `[AGENT] Sending report to ${input.recipientEmail ?? "it-manager"}`
      );
      return { sent: true, format: "pdf", recipient: input.recipientEmail };
    },
  ],
]);

// ─── Approval config ────────────────────────────────────────

/** Actions that require manager/admin approval before execution. */
const ACTIONS_REQUIRING_APPROVAL = new Set([
  "disable_account",
  "revoke_licenses",
  "apply_removals",
  "transfer_mailbox",
]);

// ─── In-memory store ────────────────────────────────────────

const workflows: Map<string, AgentWorkflow> = new Map();
let workflowCounter = 0;
let stepCounter = 0;

function genWorkflowId(): string {
  return `wf-${++workflowCounter}-${Date.now()}`;
}

function genStepId(): string {
  return `step-${++stepCounter}-${Date.now()}`;
}

// ─── Executor ───────────────────────────────────────────────

export class AgentExecutor {
  /**
   * Create a new workflow from a list of step definitions.
   */
  createWorkflow(
    name: string,
    steps: Omit<AgentStep, "id" | "status" | "output" | "error" | "startedAt" | "completedAt">[],
    context: Record<string, unknown>,
    triggeredBy: string
  ): AgentWorkflow {
    const id = genWorkflowId();
    const agentSteps: AgentStep[] = steps.map((s) => ({
      ...s,
      id: genStepId(),
      status: "pending" as const,
    }));

    const workflow: AgentWorkflow = {
      id,
      name,
      description: `${name} workflow triggered by ${triggeredBy}`,
      steps: agentSteps,
      triggeredBy,
      context,
      status: "running",
      currentStep: 0,
      createdAt: new Date(),
    };

    workflows.set(id, workflow);

    emitSSE({
      type: "activity",
      data: {
        action: "workflow.created",
        workflowId: id,
        name,
        steps: agentSteps.length,
        triggeredBy,
      },
    });

    console.log(
      `[AGENT] Created workflow "${name}" (${id}) with ${agentSteps.length} steps`
    );
    return workflow;
  }

  /**
   * Execute a workflow step-by-step.
   * Pauses at steps requiring approval. Marks workflow as failed on step failure.
   */
  async executeWorkflow(workflowId: string): Promise<AgentWorkflow> {
    const workflow = workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== "running") {
      throw new Error(
        `Workflow ${workflowId} is ${workflow.status}, cannot execute`
      );
    }

    for (let i = workflow.currentStep; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      workflow.currentStep = i;

      // Check if step requires approval
      if (ACTIONS_REQUIRING_APPROVAL.has(step.action)) {
        step.status = "awaiting_approval";
        workflow.status = "paused";

        emitSSE({
          type: "notification",
          data: {
            action: "workflow.approval_needed",
            workflowId,
            stepIndex: i,
            stepAction: step.action,
            description: step.description,
          },
        });

        console.log(
          `[AGENT] Workflow "${workflow.name}" paused — step ${i} "${step.action}" requires approval`
        );
        return workflow;
      }

      // Execute the step
      step.status = "running";
      step.startedAt = new Date();

      emitSSE({
        type: "activity",
        data: {
          action: "workflow.step_started",
          workflowId,
          stepIndex: i,
          stepAction: step.action,
        },
      });

      try {
        const handler = actionHandlers.get(step.action);
        if (!handler) {
          throw new Error(`Unknown action: ${step.action}`);
        }

        // Merge workflow context into step input
        const mergedInput = { ...workflow.context, ...step.input };
        const output = await handler(mergedInput);

        step.output = output;
        step.status = "completed";
        step.completedAt = new Date();

        // Pass output forward into workflow context for subsequent steps
        Object.assign(workflow.context, output);

        emitSSE({
          type: "activity",
          data: {
            action: "workflow.step_completed",
            workflowId,
            stepIndex: i,
            stepAction: step.action,
            output,
          },
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        step.status = "failed";
        step.error = message;
        step.completedAt = new Date();
        workflow.status = "failed";

        emitSSE({
          type: "notification",
          data: {
            action: "workflow.step_failed",
            workflowId,
            stepIndex: i,
            stepAction: step.action,
            error: message,
          },
        });

        console.error(
          `[AGENT] Workflow "${workflow.name}" failed at step ${i} "${step.action}": ${message}`
        );
        return workflow;
      }
    }

    // All steps completed
    workflow.status = "completed";
    workflow.completedAt = new Date();

    emitSSE({
      type: "activity",
      data: {
        action: "workflow.completed",
        workflowId,
        name: workflow.name,
        stepsCompleted: workflow.steps.length,
      },
    });

    console.log(
      `[AGENT] Workflow "${workflow.name}" completed — ${workflow.steps.length} steps`
    );
    return workflow;
  }

  /**
   * Approve a paused step and continue execution.
   */
  async approveStep(
    workflowId: string,
    stepIndex: number,
    approvedBy: string
  ): Promise<AgentWorkflow> {
    const workflow = workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
    if (workflow.status !== "paused")
      throw new Error(`Workflow is not paused`);

    const step = workflow.steps[stepIndex];
    if (!step) throw new Error(`Step ${stepIndex} not found`);
    if (step.status !== "awaiting_approval")
      throw new Error(`Step ${stepIndex} is not awaiting approval`);

    step.approvedBy = approvedBy;
    step.status = "running";
    step.startedAt = new Date();
    workflow.status = "running";

    emitSSE({
      type: "activity",
      data: {
        action: "workflow.step_approved",
        workflowId,
        stepIndex,
        approvedBy,
      },
    });

    console.log(
      `[AGENT] Step ${stepIndex} of "${workflow.name}" approved by ${approvedBy}`
    );

    // Execute the approved step
    try {
      const handler = actionHandlers.get(step.action);
      if (!handler) throw new Error(`Unknown action: ${step.action}`);

      const mergedInput = { ...workflow.context, ...step.input };
      const output = await handler(mergedInput);

      step.output = output;
      step.status = "completed";
      step.completedAt = new Date();
      Object.assign(workflow.context, output);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      step.status = "failed";
      step.error = message;
      step.completedAt = new Date();
      workflow.status = "failed";
      return workflow;
    }

    // Continue with next steps
    workflow.currentStep = stepIndex + 1;
    return this.executeWorkflow(workflowId);
  }

  /**
   * Reject a paused step and stop the workflow.
   */
  rejectStep(
    workflowId: string,
    stepIndex: number,
    reason: string
  ): AgentWorkflow {
    const workflow = workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const step = workflow.steps[stepIndex];
    if (!step) throw new Error(`Step ${stepIndex} not found`);

    step.status = "failed";
    step.error = `Rejected: ${reason}`;
    step.completedAt = new Date();
    workflow.status = "failed";

    emitSSE({
      type: "notification",
      data: {
        action: "workflow.step_rejected",
        workflowId,
        stepIndex,
        reason,
      },
    });

    console.log(
      `[AGENT] Step ${stepIndex} of "${workflow.name}" rejected: ${reason}`
    );
    return workflow;
  }

  /**
   * Rollback completed steps in reverse order.
   * Each action handler has an implicit reverse; for stubs, we just log.
   */
  async rollbackWorkflow(workflowId: string): Promise<AgentWorkflow> {
    const workflow = workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    console.log(`[AGENT] Rolling back workflow "${workflow.name}"`);

    const completedSteps = workflow.steps.filter(
      (s) => s.status === "completed"
    );

    // Reverse order rollback
    for (const step of completedSteps.reverse()) {
      console.log(
        `[AGENT] Rolling back step "${step.action}" (${step.id})`
      );
      step.status = "pending";
      step.output = undefined;
      step.completedAt = undefined;
      step.startedAt = undefined;
    }

    workflow.status = "failed";
    workflow.currentStep = 0;

    emitSSE({
      type: "activity",
      data: {
        action: "workflow.rolled_back",
        workflowId,
        stepsRolledBack: completedSteps.length,
      },
    });

    return workflow;
  }

  /**
   * Get a workflow by ID.
   */
  getWorkflow(workflowId: string): AgentWorkflow | null {
    return workflows.get(workflowId) ?? null;
  }

  /**
   * List all workflows, optionally filtered by status.
   */
  listWorkflows(status?: string): AgentWorkflow[] {
    const all = [...workflows.values()];
    if (!status) return all;
    return all.filter((w) => w.status === status);
  }
}

// ─── Workflow Templates ─────────────────────────────────────

/**
 * 8-step onboarding workflow for a new hire.
 */
export function ONBOARDING_WORKFLOW(newHire: {
  name: string;
  email: string;
  department: string;
  managerEmail: string;
  startDate: string;
}): { name: string; steps: Omit<AgentStep, "id" | "status" | "output" | "error" | "startedAt" | "completedAt">[]; context: Record<string, unknown> } {
  return {
    name: `Onboarding: ${newHire.name}`,
    steps: [
      {
        action: "create_ad_account",
        description: `Create Azure AD account for ${newHire.name}`,
        input: { name: newHire.name, email: newHire.email, department: newHire.department },
      },
      {
        action: "assign_m365_license",
        description: `Assign M365 E5 license to ${newHire.email}`,
        input: { email: newHire.email, licenseTier: "E5" },
      },
      {
        action: "add_to_group",
        description: `Add to ${newHire.department} department group`,
        input: { email: newHire.email, groupName: `${newHire.department} Team` },
      },
      {
        action: "add_to_teams",
        description: `Add to ${newHire.department} Teams channel`,
        input: { email: newHire.email, teamName: `${newHire.department} General` },
      },
      {
        action: "create_jira_account",
        description: `Create Jira account for ${newHire.email}`,
        input: { email: newHire.email, name: newHire.name },
      },
      {
        action: "assign_tools",
        description: `Assign standard tools to ${newHire.name}`,
        input: { email: newHire.email, tools: ["Slack", "Jira", "Confluence", "GlobalProtect VPN"] },
      },
      {
        action: "send_welcome_email",
        description: `Send welcome email to ${newHire.email}`,
        input: { email: newHire.email, name: newHire.name, startDate: newHire.startDate },
      },
      {
        action: "schedule_meeting",
        description: `Schedule 1:1 with manager ${newHire.managerEmail}`,
        input: { email: newHire.email, managerEmail: newHire.managerEmail, subject: "New Hire 1:1" },
      },
    ],
    context: { ...newHire, workflowType: "onboarding" },
  };
}

/**
 * 6-step offboarding workflow for a departing employee.
 */
export function OFFBOARDING_WORKFLOW(employee: {
  name: string;
  email: string;
  managerEmail: string;
  lastDay: string;
  transferMailboxTo?: string;
}): { name: string; steps: Omit<AgentStep, "id" | "status" | "output" | "error" | "startedAt" | "completedAt">[]; context: Record<string, unknown> } {
  return {
    name: `Offboarding: ${employee.name}`,
    steps: [
      {
        action: "revoke_licenses",
        description: `Revoke all licenses from ${employee.email}`,
        input: { email: employee.email },
      },
      {
        action: "remove_from_groups",
        description: `Remove ${employee.email} from all groups`,
        input: { email: employee.email },
      },
      {
        action: "disable_account",
        description: `Disable Azure AD account for ${employee.email}`,
        input: { email: employee.email },
      },
      {
        action: "transfer_mailbox",
        description: `Transfer mailbox to ${employee.transferMailboxTo ?? employee.managerEmail}`,
        input: { email: employee.email, transferTo: employee.transferMailboxTo ?? employee.managerEmail },
      },
      {
        action: "archive_files",
        description: `Archive OneDrive files for ${employee.email}`,
        input: { email: employee.email },
      },
      {
        action: "notify_manager",
        description: `Notify ${employee.managerEmail} of offboarding completion`,
        input: { managerEmail: employee.managerEmail, subject: `Offboarding complete: ${employee.name}` },
      },
    ],
    context: { ...employee, workflowType: "offboarding" },
  };
}

/**
 * 3-step access review workflow for a group.
 */
export function ACCESS_REVIEW_WORKFLOW(group: {
  groupId: string;
  groupName: string;
  managerEmail: string;
}): { name: string; steps: Omit<AgentStep, "id" | "status" | "output" | "error" | "startedAt" | "completedAt">[]; context: Record<string, unknown> } {
  return {
    name: `Access Review: ${group.groupName}`,
    steps: [
      {
        action: "list_group_members",
        description: `List all members of ${group.groupName}`,
        input: { groupId: group.groupId, groupName: group.groupName },
      },
      {
        action: "send_review_request",
        description: `Send review request to ${group.managerEmail}`,
        input: { managerEmail: group.managerEmail, groupName: group.groupName },
      },
      {
        action: "apply_removals",
        description: `Apply approved removals from ${group.groupName}`,
        input: { groupId: group.groupId, groupName: group.groupName, removals: [] },
      },
    ],
    context: { ...group, workflowType: "access_review" },
  };
}

/**
 * 4-step license audit workflow.
 */
export function LICENSE_AUDIT_WORKFLOW(): {
  name: string;
  steps: Omit<AgentStep, "id" | "status" | "output" | "error" | "startedAt" | "completedAt">[];
  context: Record<string, unknown>;
} {
  return {
    name: "License Audit",
    steps: [
      {
        action: "scan_license_utilization",
        description: "Scan license utilization across all subscriptions",
        input: {},
      },
      {
        action: "identify_unused_licenses",
        description: "Identify unused licenses (no sign-in > 30 days)",
        input: {},
      },
      {
        action: "generate_reclamation_list",
        description: "Generate license reclamation list with savings estimate",
        input: {},
      },
      {
        action: "send_report",
        description: "Send reclamation report to IT Manager",
        input: { recipientEmail: "chris.gascon@sagadiagnostics.com" },
      },
    ],
    context: { workflowType: "license_audit" },
  };
}

// ─── Singleton ──────────────────────────────────────────────

let instance: AgentExecutor | null = null;

export function getAgentExecutor(): AgentExecutor {
  if (!instance) {
    instance = new AgentExecutor();
    console.log("[AGENT] Agent executor initialized");
  }
  return instance;
}
