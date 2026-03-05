import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDueMessages,
  markSent,
} from "@/bot/lib/proactive-messenger";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { messageId } = body as { messageId?: string };

    // If a specific messageId is provided, send just that one
    if (messageId) {
      const result = markSent(messageId);
      if (!result) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ sent: 1, messages: [result] });
    }

    // Otherwise, send all due messages
    const dueMessages = getDueMessages();
    const sentMessages = [];

    for (const msg of dueMessages) {
      const result = markSent(msg.id);
      if (result) {
        sentMessages.push(result);
      }
    }

    return NextResponse.json({
      sent: sentMessages.length,
      messages: sentMessages,
    });
  } catch (error) {
    console.error("[API] POST /api/proactive/send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
