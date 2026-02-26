import { NextRequest, NextResponse } from "next/server";
import { getOnboardingTemplates, createOnboardingTemplate } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getOnboardingTemplates());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const template = createOnboardingTemplate({
    name: body.name,
    department: body.department ?? null,
    description: body.description ?? null,
    isActive: body.isActive ?? true,
  });
  return NextResponse.json(template, { status: 201 });
}
