import { NextRequest, NextResponse } from "next/server";
import {
  getAgentExecutor,
  ONBOARDING_WORKFLOW,
  OFFBOARDING_WORKFLOW,
  ACCESS_REVIEW_WORKFLOW,
  LICENSE_AUDIT_WORKFLOW,
} from "../../../../bot/lib/agent-executor";

/**
 * GET /api/agents — List agent workflows.
 * Query params: ?status=running|completed|failed|paused
 */
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const executor = getAgentExecutor();
    const workflows = executor.listWorkflows(status);

    return NextResponse.json({
      workflows: workflows.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        status: w.status,
        triggeredBy: w.triggeredBy,
        currentStep: w.currentStep,
        totalSteps: w.steps.length,
        createdAt: w.createdAt,
        completedAt: w.completedAt,
        steps: w.steps.map((s) => ({
          id: s.id,
          action: s.action,
          description: s.description,
          status: s.status,
          error: s.error,
          approvedBy: s.approvedBy,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
        })),
      })),
    });
  } catch (error) {
    console.error("[API] GET /api/agents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents — Trigger a workflow from a template.
 * Body: { template: 'onboarding'|'offboarding'|'access_review'|'license_audit', context }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, context, triggeredBy } = body;

    if (!template) {
      return NextResponse.json(
        { error: "template is required" },
        { status: 400 }
      );
    }

    const executor = getAgentExecutor();
    const actor = triggeredBy ?? "admin@sagadiagnostics.com";
    let workflowDef;

    switch (template) {
      case "onboarding":
        if (!context?.name || !context?.email) {
          return NextResponse.json(
            { error: "context.name and context.email are required for onboarding" },
            { status: 400 }
          );
        }
        workflowDef = ONBOARDING_WORKFLOW({
          name: context.name,
          email: context.email,
          department: context.department ?? "General",
          managerEmail: context.managerEmail ?? "manager@sagadiagnostics.com",
          startDate: context.startDate ?? new Date().toISOString().split("T")[0],
        });
        break;

      case "offboarding":
        if (!context?.name || !context?.email) {
          return NextResponse.json(
            { error: "context.name and context.email are required for offboarding" },
            { status: 400 }
          );
        }
        workflowDef = OFFBOARDING_WORKFLOW({
          name: context.name,
          email: context.email,
          managerEmail: context.managerEmail ?? "manager@sagadiagnostics.com",
          lastDay: context.lastDay ?? new Date().toISOString().split("T")[0],
          transferMailboxTo: context.transferMailboxTo,
        });
        break;

      case "access_review":
        if (!context?.groupName) {
          return NextResponse.json(
            { error: "context.groupName is required for access_review" },
            { status: 400 }
          );
        }
        workflowDef = ACCESS_REVIEW_WORKFLOW({
          groupId: context.groupId ?? `group-${Date.now()}`,
          groupName: context.groupName,
          managerEmail: context.managerEmail ?? "manager@sagadiagnostics.com",
        });
        break;

      case "license_audit":
        workflowDef = LICENSE_AUDIT_WORKFLOW();
        break;

      default:
        return NextResponse.json(
          { error: `Unknown template: ${template}. Valid: onboarding, offboarding, access_review, license_audit` },
          { status: 400 }
        );
    }

    const workflow = executor.createWorkflow(
      workflowDef.name,
      workflowDef.steps,
      workflowDef.context,
      actor
    );

    // Start execution (async, may pause at approval gates)
    const result = await executor.executeWorkflow(workflow.id);

    return NextResponse.json(
      {
        id: result.id,
        name: result.name,
        status: result.status,
        currentStep: result.currentStep,
        totalSteps: result.steps.length,
        steps: result.steps.map((s) => ({
          id: s.id,
          action: s.action,
          description: s.description,
          status: s.status,
          error: s.error,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/agents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
