import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeDocuments, createKnowledgeDocument } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getKnowledgeDocuments());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const doc = createKnowledgeDocument({
    title: body.title,
    content: body.content,
    category: body.category ?? null,
    tags: body.tags ?? [],
  });
  return NextResponse.json(doc, { status: 201 });
}
