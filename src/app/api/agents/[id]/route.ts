import { NextRequest, NextResponse } from "next/server";
import { getAgentExecutor } from "../../../../../bot/lib/agent-executor";

/**
 * GET /api/agents/[id] — Get a single workflow with all steps.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const executor = getAgentExecutor();
    const workflow = executor.getWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: `Workflow ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      triggeredBy: workflow.triggeredBy,
      context: workflow.context,
      currentStep: workflow.currentStep,
      totalSteps: workflow.steps.length,
      createdAt: workflow.createdAt,
      completedAt: workflow.completedAt,
      steps: workflow.steps.map((s, idx) => ({
        index: idx,
        id: s.id,
        action: s.action,
        description: s.description,
        status: s.status,
        input: s.input,
        output: s.output,
        error: s.error,
        approvedBy: s.approvedBy,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      })),
    });
  } catch (error) {
    console.error("[API] GET /api/agents/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id] — Approve or reject a step.
 * Body: { stepIndex, action: 'approve'|'reject', reason?, approvedBy? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stepIndex, action, reason, approvedBy } = body;

    if (stepIndex === undefined || !action) {
      return NextResponse.json(
        { error: "stepIndex and action are required" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const executor = getAgentExecutor();

    let workflow;
    if (action === "approve") {
      workflow = await executor.approveStep(
        id,
        stepIndex,
        approvedBy ?? "admin@sagadiagnostics.com"
      );
    } else {
      workflow = executor.rejectStep(
        id,
        stepIndex,
        reason ?? "No reason provided"
      );
    }

    return NextResponse.json({
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      currentStep: workflow.currentStep,
      totalSteps: workflow.steps.length,
      steps: workflow.steps.map((s, idx) => ({
        index: idx,
        id: s.id,
        action: s.action,
        description: s.description,
        status: s.status,
        error: s.error,
        approvedBy: s.approvedBy,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[API] POST /api/agents/[id] error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
