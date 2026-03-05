import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  calculateExecutiveMetrics,
  getCostAllocation,
  getVendorSpend,
  getTrendData,
} from "@/lib/executive-dashboard";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const period = (url.searchParams.get("period") ?? "month") as
      | "month"
      | "quarter"
      | "year";
    const view = url.searchParams.get("view");

    if (view === "costs") {
      const allocation = getCostAllocation();
      return NextResponse.json({ allocation });
    }

    if (view === "vendors") {
      const vendors = getVendorSpend();
      return NextResponse.json({ vendors });
    }

    if (view === "trends") {
      const months = parseInt(url.searchParams.get("months") ?? "6", 10);
      const trends = getTrendData(months);
      return NextResponse.json({ trends });
    }

    const metrics = calculateExecutiveMetrics(period);
    const trends = getTrendData(6);
    const vendors = getVendorSpend();

    return NextResponse.json({ metrics, trends, vendors });
  } catch (error) {
    console.error("[API] GET /api/executive error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
