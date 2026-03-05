import { NextResponse } from "next/server";
import { generateApiDocs, getApiCatalog } from "@/lib/api-platform";

export async function GET() {
  try {
    const spec = generateApiDocs();
    const catalog = getApiCatalog();
    return NextResponse.json({ spec, catalog });
  } catch (error) {
    console.error("[API] GET /api/v1/docs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
