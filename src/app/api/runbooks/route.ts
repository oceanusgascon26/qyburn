import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getRunbooks,
  executeRunbook,
  getExecutionHistory,
  rollbackExecution,
} from "@/bot/lib/runbook-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const category = url.searchParams.get("category") ?? undefined;
    const executionsFor = url.searchParams.get("executions") ?? undefined;

    if (executionsFor) {
      const history = getExecutionHistory(executionsFor === "all" ? undefined : executionsFor);
      return NextResponse.json({ executions: history });
    }

    const runbooks = getRunbooks(category);
    return NextResponse.json({ runbooks });
  } catch (error) {
    console.error("[API] GET /api/runbooks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, runbookId, params, executionId } = body as {
      action?: string;
      runbookId?: string;
      params?: Record<string, string>;
      executionId?: string;
    };

    if (action === "rollback" && executionId) {
      const result = rollbackExecution(executionId);
      if (!result) {
        return NextResponse.json(
          { error: "Execution not found or cannot be rolled back" },
          { status: 404 }
        );
      }
      return NextResponse.json({ execution: result });
    }

    if (!runbookId) {
      return NextResponse.json(
        { error: "Missing runbookId" },
        { status: 400 }
      );
    }

    const executor = session.user.email ?? session.user.name ?? "unknown";
    const execution = executeRunbook(runbookId, params ?? {}, executor);
    return NextResponse.json({ execution });
  } catch (error) {
    console.error("[API] POST /api/runbooks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
