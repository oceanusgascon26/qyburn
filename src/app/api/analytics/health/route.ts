import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  runHealthChecks,
  getOverallHealthScore,
  getHealthTrend,
} from "@/bot/lib/health-checker";
import { predictChurn, getProactiveActions } from "@/bot/lib/churn-predictor";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const weeks = parseInt(url.searchParams.get("weeks") ?? "12", 10);
    const includeChurn = url.searchParams.get("churn") !== "false";

    const health = getOverallHealthScore();
    const trend = getHealthTrend(weeks);

    const result: Record<string, unknown> = {
      overallScore: health.score,
      overallStatus: health.status,
      checks: health.checks,
      trend,
    };

    if (includeChurn) {
      result.churnPredictions = predictChurn();
      result.proactiveActions = getProactiveActions();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] GET /api/analytics/health error:", error);
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

    const checks = runHealthChecks();
    const health = getOverallHealthScore();

    return NextResponse.json({
      overallScore: health.score,
      overallStatus: health.status,
      checks,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] POST /api/analytics/health error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
