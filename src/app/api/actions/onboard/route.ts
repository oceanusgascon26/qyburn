/**
 * POST /api/actions/onboard — Execute an onboarding template.
 *
 * Body: {
 *   templateId: string,
 *   newHire: { name: string, email: string, department: string, startDate: string }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeOnboarding } from "@/bot/lib/action-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { templateId, newHire } = body;
    if (!templateId) {
      return NextResponse.json(
        { error: "Missing required field: templateId" },
        { status: 400 }
      );
    }

    if (
      !newHire ||
      !newHire.name ||
      !newHire.email ||
      !newHire.department ||
      !newHire.startDate
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields in newHire: name, email, department, startDate",
        },
        { status: 400 }
      );
    }

    const result = await executeOnboarding(templateId, {
      name: newHire.name,
      email: newHire.email,
      department: newHire.department,
      startDate: newHire.startDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/actions/onboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
