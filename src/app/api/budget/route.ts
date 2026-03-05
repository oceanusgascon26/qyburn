import { NextRequest, NextResponse } from "next/server";
import {
  forecastBudget,
  identifyOptimizations,
  getSpendVsBudget,
} from "../../../../bot/lib/budget-forecaster";

export async function GET(request: NextRequest) {
  try {
    const quarters = parseInt(
      request.nextUrl.searchParams.get("quarters") ?? "4",
      10
    );
    const forecast = forecastBudget(quarters);
    const optimizations = identifyOptimizations();
    const spendVsBudget = getSpendVsBudget();

    return NextResponse.json({ forecast, optimizations, spendVsBudget });
  } catch (error) {
    console.error("[API] GET /api/budget error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
