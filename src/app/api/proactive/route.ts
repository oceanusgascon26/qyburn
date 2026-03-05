import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getScheduledMessages,
  generateProactiveMessages,
  getMessageTypeBreakdown,
  deleteMessage,
} from "@/bot/lib/proactive-messenger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const sent = url.searchParams.get("sent");
    const type = url.searchParams.get("type") ?? undefined;

    const filters: { sent?: boolean; type?: string } = {};
    if (sent !== null) filters.sent = sent === "true";
    if (type) filters.type = type;

    const messages = getScheduledMessages(filters);
    const breakdown = getMessageTypeBreakdown();

    return NextResponse.json({ messages, breakdown });
  } catch (error) {
    console.error("[API] GET /api/proactive error:", error);
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

    const newMessages = generateProactiveMessages();

    return NextResponse.json({
      generated: newMessages.length,
      messages: newMessages,
    });
  } catch (error) {
    console.error("[API] POST /api/proactive error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const messageId = url.searchParams.get("id");

    if (!messageId) {
      return NextResponse.json(
        { error: "Missing message id" },
        { status: 400 }
      );
    }

    const deleted = deleteMessage(messageId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Message not found or already sent" },
        { status: 404 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[API] DELETE /api/proactive error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
