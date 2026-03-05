/**
 * POST /api/actions/offboard — Execute offboarding for a user.
 *
 * Body: {
 *   userId: string,
 *   userEmail: string,
 *   options: {
 *     revokeAllLicenses: boolean,
 *     removeFromGroups: boolean,
 *     disableAccount: boolean,
 *     transferMailbox?: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeOffboarding } from "@/bot/lib/action-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { userId, userEmail, options } = body;
    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: userId, userEmail" },
        { status: 400 }
      );
    }

    if (!options || typeof options !== "object") {
      return NextResponse.json(
        { error: "Missing required field: options" },
        { status: 400 }
      );
    }

    const result = await executeOffboarding(userId, userEmail, {
      revokeAllLicenses: options.revokeAllLicenses ?? false,
      removeFromGroups: options.removeFromGroups ?? false,
      disableAccount: options.disableAccount ?? false,
      transferMailbox: options.transferMailbox ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/actions/offboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
