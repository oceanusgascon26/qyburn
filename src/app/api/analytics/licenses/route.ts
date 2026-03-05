import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  analyzeLicenseUsage,
  getOptimizationRecommendations,
  predictLicenseNeeds,
  getLicenseCostBreakdown,
  getTotalMonthlySpend,
  getTotalPotentialSavings,
} from "@/bot/lib/license-analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const department = url.searchParams.get("department");
    const months = parseInt(url.searchParams.get("months") ?? "3", 10);

    const usage = analyzeLicenseUsage();
    const recommendations = getOptimizationRecommendations();
    const costBreakdown = getLicenseCostBreakdown();
    const totalSpend = getTotalMonthlySpend();
    const savings = getTotalPotentialSavings();

    const result: Record<string, unknown> = {
      usage,
      recommendations,
      costBreakdown,
      totalMonthlySpend: totalSpend,
      potentialSavings: savings,
    };

    if (department) {
      result.predictions = predictLicenseNeeds(department, months);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] GET /api/analytics/licenses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
