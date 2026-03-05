import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  scanForIssues,
  executeRemediation,
  getRemediationHistory,
  getRemediationStats,
  runRemediationCycle,
  DEFAULT_REMEDIATION_RULES,
} from "@/bot/lib/auto-remediation";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const hours = parseInt(url.searchParams.get("hours") ?? "24", 10);

    const history = getRemediationHistory(hours);
    const stats = getRemediationStats();
    const rules = DEFAULT_REMEDIATION_RULES;

    return NextResponse.json({ history, stats, rules });
  } catch (error) {
    console.error("[API] GET /api/remediation error:", error);
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
    const { action, ruleId, userId } = body as {
      action?: string;
      ruleId?: string;
      userId?: string;
    };

    if (action === "scan") {
      const issues = scanForIssues();
      return NextResponse.json({ issues });
    }

    if (action === "cycle") {
      const events = runRemediationCycle();
      return NextResponse.json({ events, count: events.length });
    }

    if (action === "execute" && ruleId && userId) {
      const event = executeRemediation(ruleId, userId);
      return NextResponse.json({ event });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'scan', 'cycle', or 'execute' with ruleId + userId." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] POST /api/remediation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
