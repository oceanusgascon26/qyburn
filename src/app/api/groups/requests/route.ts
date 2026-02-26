import { NextRequest, NextResponse } from "next/server";
import { getGroupAccessRequests, updateGroupAccessRequest } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get("groupId") ?? undefined;
  return NextResponse.json(getGroupAccessRequests(groupId));
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  const updated = updateGroupAccessRequest(id, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
