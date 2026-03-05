/**
 * POST /api/actions/provision — Provision a license or group access.
 *
 * Body: { type: 'license'|'group', targetId: string, userId: string, approvedBy: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  provisionLicense,
  addToGroup,
} from "@/bot/lib/action-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const { type, targetId, userId, approvedBy } = body;
    if (!type || !targetId || !userId || !approvedBy) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: type, targetId, userId, approvedBy",
        },
        { status: 400 }
      );
    }

    if (type !== "license" && type !== "group") {
      return NextResponse.json(
        { error: 'type must be "license" or "group"' },
        { status: 400 }
      );
    }

    if (type === "license") {
      const result = await provisionLicense(userId, targetId, approvedBy);
      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // type === "group"
    const result = await addToGroup(userId, targetId, approvedBy);
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("[API] POST /api/actions/provision error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
