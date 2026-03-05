import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs, createAuditLog } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const actor = request.nextUrl.searchParams.get("actor") ?? undefined;
    const action = request.nextUrl.searchParams.get("action") ?? undefined;
    const limit = request.nextUrl.searchParams.get("limit");
    return NextResponse.json(
      getAuditLogs({
        actor,
        action,
        limit: limit ? parseInt(limit, 10) : undefined,
      })
    );
  } catch (error) {
    console.error("[API] GET /api/audit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = createAuditLog({
      actor: body.actor,
      action: body.action,
      target: body.target ?? null,
      targetId: body.targetId ?? null,
      details: body.details ?? null,
      channel: body.channel ?? null,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/audit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
