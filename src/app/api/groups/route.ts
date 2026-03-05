import { NextRequest, NextResponse } from "next/server";
import { getRestrictedGroups, createRestrictedGroup } from "@/lib/mock-data";

export async function GET() {
  try {
    return NextResponse.json(getRestrictedGroups());
  } catch (error) {
    console.error("[API] GET /api/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const group = createRestrictedGroup({
      azureGroupId: body.azureGroupId,
      displayName: body.displayName,
      description: body.description ?? null,
      approverEmail: body.approverEmail,
      requiresJustification: body.requiresJustification ?? true,
    });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
