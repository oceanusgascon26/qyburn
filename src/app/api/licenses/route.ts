import { NextRequest, NextResponse } from "next/server";
import { getLicenses, createLicense } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getLicenses());
}

export async function POST(request: NextRequest) {
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
}
