import { NextRequest, NextResponse } from "next/server";
import {
  getAccessReviews,
  getReviewStats,
  initiateAccessReview,
} from "../../../../bot/lib/access-reviewer";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const reviews = getAccessReviews(status);
    const stats = getReviewStats();
    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error("[API] GET /api/access-reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

    const result = await initiateAccessReview(groupId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.review, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/access-reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
