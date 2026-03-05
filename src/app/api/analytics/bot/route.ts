import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAnalytics,
  getIntentTrends,
  getUserMetrics,
} from "@/bot/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const period = url.searchParams.get("period") as
      | "day"
      | "week"
      | "month"
      | null;
    const userId = url.searchParams.get("userId");
    const includeTrends = url.searchParams.get("trends") === "true";

    const analytics = getAnalytics(period ?? undefined);

    const result: Record<string, unknown> = { ...analytics };

    if (includeTrends) {
      result.intentTrends = getIntentTrends();
    }

    if (userId) {
      result.userMetrics = getUserMetrics(userId);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] GET /api/analytics/bot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
