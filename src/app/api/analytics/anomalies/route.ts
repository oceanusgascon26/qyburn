import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  detectAnomalies,
  getAnomalySummary,
  acknowledgeAnomaly,
  getAnomalies,
} from "@/bot/lib/anomaly-detector";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const type = url.searchParams.get("type") ?? undefined;
    const severity = url.searchParams.get("severity") ?? undefined;
    const acknowledged = url.searchParams.get("acknowledged");

    const filters: {
      type?: string;
      severity?: string;
      acknowledged?: boolean;
    } = {};
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (acknowledged !== null) filters.acknowledged = acknowledged === "true";

    const anomalies = getAnomalies(filters);
    const summary = getAnomalySummary();

    return NextResponse.json({ anomalies, summary });
  } catch (error) {
    console.error("[API] GET /api/analytics/anomalies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { anomalyId } = body;

    if (!anomalyId) {
      return NextResponse.json(
        { error: "Missing anomalyId" },
        { status: 400 }
      );
    }

    const result = acknowledgeAnomaly(anomalyId);
    if (!result) {
      return NextResponse.json(
        { error: "Anomaly not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] PATCH /api/analytics/anomalies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
