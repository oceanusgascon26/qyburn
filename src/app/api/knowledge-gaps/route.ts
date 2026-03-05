import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getKnowledgeGaps,
  recordKnowledgeGap,
} from "@/bot/lib/analytics";

// ─── In-memory knowledge gap store with status tracking ──────

interface KnowledgeGapRecord {
  id: string;
  question: string;
  intent: string | null;
  frequency: number;
  status: "open" | "addressed" | "dismissed";
  articleId: string | null;
  createdAt: string;
  updatedAt: string;
}

const gapStatusStore = new Map<string, KnowledgeGapRecord>();
let gapIdCounter = 0;

function syncFromAnalytics(): KnowledgeGapRecord[] {
  const analyticsGaps = getKnowledgeGaps();

  for (const gap of analyticsGaps) {
    const key = gap.question.toLowerCase().trim();
    if (!gapStatusStore.has(key)) {
      gapIdCounter++;
      gapStatusStore.set(key, {
        id: `gap_${gapIdCounter}`,
        question: gap.question,
        intent: gap.intent ?? null,
        frequency: gap.count,
        status: "open",
        articleId: null,
        createdAt: gap.firstSeen.toISOString(),
        updatedAt: gap.lastSeen.toISOString(),
      });
    } else {
      const existing = gapStatusStore.get(key)!;
      existing.frequency = gap.count;
      existing.updatedAt = gap.lastSeen.toISOString();
    }
  }

  return Array.from(gapStatusStore.values()).sort(
    (a, b) => b.frequency - a.frequency
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const statusFilter = url.searchParams.get("status");

    let gaps = syncFromAnalytics();

    if (statusFilter) {
      gaps = gaps.filter((g) => g.status === statusFilter);
    }

    return NextResponse.json({
      items: gaps,
      total: gaps.length,
    });
  } catch (error) {
    console.error("[API] GET /api/knowledge-gaps error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.question || typeof body.question !== "string") {
      return NextResponse.json(
        { error: "Missing required field: question" },
        { status: 400 }
      );
    }

    recordKnowledgeGap(body.question, body.intent ?? undefined);

    // Sync and return the updated record
    syncFromAnalytics();
    const key = body.question.toLowerCase().trim();
    const record = gapStatusStore.get(key);

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/knowledge-gaps error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const validStatuses = ["open", "addressed", "dismissed"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Sync first
    syncFromAnalytics();

    // Find the record by ID
    let found: KnowledgeGapRecord | undefined;
    for (const record of gapStatusStore.values()) {
      if (record.id === body.id) {
        found = record;
        break;
      }
    }

    if (!found) {
      return NextResponse.json(
        { error: "Knowledge gap not found" },
        { status: 404 }
      );
    }

    if (body.status) {
      found.status = body.status;
    }
    if (body.articleId !== undefined) {
      found.articleId = body.articleId;
    }
    found.updatedAt = new Date().toISOString();

    return NextResponse.json(found);
  } catch (error) {
    console.error("[API] PATCH /api/knowledge-gaps error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
