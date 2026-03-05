/**
 * POST /api/knowledge/ingest — Ingest a new document into the knowledge engine.
 *
 * Body: { title: string, content: string, category: string, tags: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ingestDocument } from "@/bot/lib/knowledge-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { title, content, category, tags } = body;
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 }
      );
    }

    const article = ingestDocument(
      title,
      content,
      category ?? "General",
      Array.isArray(tags) ? tags : []
    );

    return NextResponse.json(
      {
        id: article.id,
        title: article.title,
        category: article.category,
        tags: article.tags,
        chunkCount: article.chunks.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/knowledge/ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
