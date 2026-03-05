import { NextRequest, NextResponse } from "next/server";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/notifications";

export async function GET() {
  try {
    return NextResponse.json({
      notifications: getNotifications(),
      unreadCount: getUnreadCount(),
    });
  } catch (error) {
    console.error("[API] GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.markAllRead) {
      markAllAsRead();
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      const ok = markAsRead(body.id);
      if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("[API] PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
