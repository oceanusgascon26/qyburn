import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  generateReport,
  scheduleReport,
  getReports,
  getReportTemplates,
  type ReportType,
} from "@/lib/report-builder";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    const view = url.searchParams.get("view");

    if (view === "templates") {
      const templates = getReportTemplates();
      return NextResponse.json({ templates });
    }

    const reports = getReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[API] GET /api/reports error:", error);
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
    const { action, type, config, reportId, cron, recipients } = body as {
      action?: string;
      type?: string;
      config?: Record<string, unknown>;
      reportId?: string;
      cron?: string;
      recipients?: string[];
    };

    if (action === "schedule" && reportId && cron && recipients) {
      const updated = scheduleReport(reportId, cron, recipients);
      if (!updated) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ report: updated });
    }

    if (!type) {
      return NextResponse.json(
        { error: "Missing report type" },
        { status: 400 }
      );
    }

    const validTypes = [
      "license_audit",
      "security_posture",
      "cost_analysis",
      "bot_performance",
      "compliance_status",
      "access_review",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid report type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const report = generateReport(type as ReportType, config);
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
