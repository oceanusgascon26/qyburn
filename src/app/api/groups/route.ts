import { NextRequest, NextResponse } from "next/server";
import { getRestrictedGroups, createRestrictedGroup } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getRestrictedGroups());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const group = createRestrictedGroup({
    azureGroupId: body.azureGroupId,
    displayName: body.displayName,
    description: body.description ?? null,
    approverEmail: body.approverEmail,
    requiresJustification: body.requiresJustification ?? true,
  });
  return NextResponse.json(group, { status: 201 });
}
