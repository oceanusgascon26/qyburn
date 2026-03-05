import { NextRequest, NextResponse } from "next/server";
import { getLicenses, createLicense } from "@/lib/mock-data";

export async function GET() {
  try {
    return NextResponse.json(getLicenses());
  } catch (error) {
    console.error("[API] GET /api/licenses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const license = createLicense({
      name: body.name,
      vendor: body.vendor,
      sku: body.sku ?? null,
      totalSeats: body.totalSeats ?? 0,
      usedSeats: body.usedSeats ?? 0,
      costPerSeat: body.costPerSeat ?? null,
      autoApprove: body.autoApprove ?? false,
      description: body.description ?? null,
    });
    return NextResponse.json(license, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/licenses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
