import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ─── In-memory feedback store ────────────────────────────────

interface FeedbackEntry {
  id: string;
  conversationId: string | null;
  messageId: string | null;
  userId: string;
  rating: number;
  comment: string | null;
  intent: string | null;
  wasHelpful: boolean | null;
  createdAt: string;
}

const feedbackStore: FeedbackEntry[] = [];
let feedbackIdCounter = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate rating
    const rating = typeof body.rating === "number" ? body.rating : parseInt(body.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    feedbackIdCounter++;
    const entry: FeedbackEntry = {
      id: `fb_${Date.now()}_${feedbackIdCounter}`,
      conversationId: body.conversationId ?? null,
      messageId: body.messageId ?? null,
      userId:
        (session.user as { id?: string }).id ??
        session.user.email ??
        "unknown",
      rating,
      comment: body.comment ?? null,
      intent: body.intent ?? null,
      wasHelpful: typeof body.wasHelpful === "boolean" ? body.wasHelpful : null,
      createdAt: new Date().toISOString(),
    };

    feedbackStore.push(entry);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/feedback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      items: feedbackStore,
      total: feedbackStore.length,
    });
  } catch (error) {
    console.error("[API] GET /api/feedback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
