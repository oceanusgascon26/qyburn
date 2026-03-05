import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeDocuments, createKnowledgeDocument } from "@/lib/mock-data";

export async function GET() {
  try {
    return NextResponse.json(getKnowledgeDocuments());
  } catch (error) {
    console.error("[API] GET /api/knowledge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const doc = createKnowledgeDocument({
      title: body.title,
      content: body.content,
      category: body.category ?? null,
      tags: body.tags ?? [],
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/knowledge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
