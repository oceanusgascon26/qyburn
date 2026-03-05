import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listConversations } from "@/bot/lib/multi-turn";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const status = url.searchParams.get("status") ?? undefined;
    const userId = url.searchParams.get("userId") ?? undefined;
    const sinceParam = url.searchParams.get("since");
    const untilParam = url.searchParams.get("until");

    const since = sinceParam ? new Date(sinceParam) : undefined;
    const until = untilParam ? new Date(untilParam) : undefined;

    const conversations = listConversations({
      status,
      userId,
      since,
      until,
    });

    return NextResponse.json({
      items: conversations,
      total: conversations.length,
    });
  } catch (error) {
    console.error("[API] GET /api/conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
