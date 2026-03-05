/**
 * GET /api/knowledge/gaps — List knowledge gaps from the knowledge engine.
 *
 * Returns gaps sorted by frequency. These represent questions the bot
 * couldn't answer well, surfaced by the knowledge engine's gap detection.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getKnowledgeGaps,
  getKnowledgeStats,
} from "@/bot/lib/knowledge-engine";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gaps = getKnowledgeGaps();
    const stats = getKnowledgeStats();

    return NextResponse.json({
      items: gaps.map((g) => ({
        id: g.id,
        query: g.query,
        count: g.count,
        firstSeen: g.firstSeen.toISOString(),
        lastSeen: g.lastSeen.toISOString(),
      })),
      total: gaps.length,
      stats: {
        totalDocuments: stats.totalDocuments,
        totalChunks: stats.totalChunks,
        searchVolume: stats.searchVolume,
        gapCount: stats.gapCount,
        avgHelpfulness: stats.avgHelpfulness,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/knowledge/gaps error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
