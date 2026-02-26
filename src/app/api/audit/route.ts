import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs, createAuditLog } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
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
}
