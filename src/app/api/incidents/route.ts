import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  correlateIncidents,
  createIncident,
  updateIncidentStatus,
  getActiveIncidents,
  getAllIncidents,
} from "@/bot/lib/incident-correlator";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const includeResolved = url.searchParams.get("all") === "true";

    const incidents = includeResolved ? getAllIncidents() : getActiveIncidents();
    return NextResponse.json({ incidents });
  } catch (error) {
    console.error("[API] GET /api/incidents error:", error);
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
    const { action, incidentId, status, update, incident } = body as {
      action?: string;
      incidentId?: string;
      status?: string;
      update?: string;
      incident?: {
        title: string;
        severity: "P1" | "P2" | "P3";
        affectedUsers: string[];
        symptoms: string[];
        possibleCause: string;
      };
    };

    if (action === "correlate") {
      const result = correlateIncidents();
      return NextResponse.json(result);
    }

    if (action === "update" && incidentId && status && update) {
      const updated = updateIncidentStatus(incidentId, status, update);
      if (!updated) {
        return NextResponse.json(
          { error: "Incident not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ incident: updated });
    }

    if (action === "create" && incident) {
      const created = createIncident({
        ...incident,
        relatedConversations: [],
        status: "confirmed",
        startedAt: new Date(),
      });
      return NextResponse.json({ incident: created }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'correlate', 'create', or 'update'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] POST /api/incidents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
