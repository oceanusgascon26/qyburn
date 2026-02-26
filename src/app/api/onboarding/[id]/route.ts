import { NextRequest, NextResponse } from "next/server";
import { getOnboardingTemplate } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const template = getOnboardingTemplate(params.id);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}
