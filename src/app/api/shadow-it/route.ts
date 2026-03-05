import { NextRequest, NextResponse } from "next/server";
import {
  detectShadowIT,
  getShadowITStats,
  getDetections,
  notifyUsers,
} from "../../../../bot/lib/shadow-it-detector";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const detections = getDetections(status);
    const stats = getShadowITStats();
    return NextResponse.json({ detections, stats });
  } catch (error) {
    console.error("[API] GET /api/shadow-it error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, appName } = body;

    if (action === "scan") {
      const apps = detectShadowIT();
      const stats = getShadowITStats();
      return NextResponse.json({ apps, stats });
    }

    if (action === "notify" && appName) {
      const result = notifyUsers(appName);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'scan' or 'notify' with appName." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] POST /api/shadow-it error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
