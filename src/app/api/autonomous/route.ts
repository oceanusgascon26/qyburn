import { NextResponse } from "next/server";
import {
  getAutonomousMetrics,
  getAutonomyScore,
  recommendAutonomyExpansion,
} from "../../../../bot/lib/autonomous-controller";

export async function GET() {
  try {
    const metrics = getAutonomousMetrics();
    const score = getAutonomyScore();
    const recommendations = recommendAutonomyExpansion();

    return NextResponse.json({ metrics, score, recommendations });
  } catch (error) {
    console.error("[API] GET /api/autonomous error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
