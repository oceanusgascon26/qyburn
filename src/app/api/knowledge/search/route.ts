/**
 * GET /api/knowledge/search — Search the knowledge base.
 *
 * Query params: q (required), category (optional), limit (optional, default 5)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  search,
  buildCitedResponse,
  detectKnowledgeGap,
} from "@/bot/lib/knowledge-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const q = url.searchParams.get("q");
    const category = url.searchParams.get("category") ?? undefined;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required query parameter: q" },
        { status: 400 }
      );
    }

    const results = search(q, { category, limit });

    // Detect knowledge gaps
    const isGap = detectKnowledgeGap(q, results);

    // Build cited response
    const citedResponse = buildCitedResponse(q, results);

    return NextResponse.json({
      query: q,
      results: results.map((r) => ({
        id: r.id,
        documentId: r.documentId,
        title: r.title,
        content: r.content,
        score: r.score,
        chunkIndex: r.chunkIndex,
      })),
      citedResponse,
      isKnowledgeGap: isGap,
      resultCount: results.length,
    });
  } catch (error) {
    console.error("[API] GET /api/knowledge/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
