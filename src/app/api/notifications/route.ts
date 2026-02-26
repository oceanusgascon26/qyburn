import { NextRequest, NextResponse } from "next/server";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/notifications";

export async function GET() {
  return NextResponse.json({
    notifications: getNotifications(),
    unreadCount: getUnreadCount(),
  });
}

export async function PATCH(req: NextRequest) {
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
}
