import { NextRequest, NextResponse } from "next/server";
import {
  getAccessReview,
  processReviewDecision,
} from "../../../../../bot/lib/access-reviewer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const review = getAccessReview(id);

    if (!review) {
      return NextResponse.json(
        { error: "Access review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("[API] GET /api/access-reviews/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { memberId, decision } = body;

    if (!memberId || !decision) {
      return NextResponse.json(
        { error: "memberId and decision are required" },
        { status: 400 }
      );
    }

    if (decision !== "keep" && decision !== "revoke") {
      return NextResponse.json(
        { error: "decision must be 'keep' or 'revoke'" },
        { status: 400 }
      );
    }

    const result = await processReviewDecision(id, memberId, decision);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    console.error("[API] POST /api/access-reviews/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
