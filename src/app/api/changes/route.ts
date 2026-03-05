import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  scheduleChange,
  notifyAffectedUsers,
  startChange,
  completeChange,
  rollbackChange,
  getUpcomingChanges,
  getChangeCalendar,
  getChange,
} from "@/bot/lib/change-manager";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const view = url.searchParams.get("view");

    if (view === "calendar") {
      const calendar = getChangeCalendar();
      return NextResponse.json({ calendar });
    }

    const changes = getUpcomingChanges();
    return NextResponse.json({ changes });
  } catch (error) {
    console.error("[API] GET /api/changes error:", error);
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
    const { title, description, type, scheduledStart, scheduledEnd, affectedSystems, affectedUsers, riskLevel, rollbackPlan, owner } = body as {
      title?: string;
      description?: string;
      type?: string;
      scheduledStart?: string;
      scheduledEnd?: string;
      affectedSystems?: string[];
      affectedUsers?: string[];
      riskLevel?: string;
      rollbackPlan?: string;
      owner?: string;
    };

    if (!title || !type || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, scheduledStart, scheduledEnd" },
        { status: 400 }
      );
    }

    const change = scheduleChange({
      title,
      description: description ?? "",
      type: type as "maintenance" | "upgrade" | "migration" | "security_patch" | "configuration",
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      affectedSystems: affectedSystems ?? [],
      affectedUsers: affectedUsers ?? [],
      riskLevel: (riskLevel as "low" | "medium" | "high") ?? "low",
      rollbackPlan: rollbackPlan ?? "",
      owner: owner ?? session.user.email ?? "unknown",
    });

    return NextResponse.json({ change }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/changes error:", error);
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
    const { changeId, action, notes, reason } = body as {
      changeId?: string;
      action?: string;
      notes?: string;
      reason?: string;
    };

    if (!changeId || !action) {
      return NextResponse.json(
        { error: "Missing changeId or action" },
        { status: 400 }
      );
    }

    let result = null;

    switch (action) {
      case "notify":
        return NextResponse.json(notifyAffectedUsers(changeId));
      case "start":
        result = startChange(changeId);
        break;
      case "complete":
        result = completeChange(changeId, notes ?? "");
        break;
      case "rollback":
        result = rollbackChange(changeId, reason ?? "Unknown reason");
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'notify', 'start', 'complete', or 'rollback'." },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: "Change not found or invalid status transition" },
        { status: 404 }
      );
    }

    return NextResponse.json({ change: result });
  } catch (error) {
    console.error("[API] PATCH /api/changes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
