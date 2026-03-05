import { NextRequest, NextResponse } from "next/server";
import {
  getPluginCatalog,
  getInstalledPlugins,
  installPlugin,
  uninstallPlugin,
} from "@/lib/plugin-system";

export async function GET() {
  try {
    const catalog = getPluginCatalog();
    const installed = getInstalledPlugins();
    return NextResponse.json({ catalog, installed });
  } catch (error) {
    console.error("[API] GET /api/plugins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pluginId, config } = body;

    if (action === "install") {
      if (!pluginId) {
        return NextResponse.json(
          { error: "pluginId is required" },
          { status: 400 }
        );
      }
      const result = installPlugin(pluginId, config ?? {});
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json(result.plugin, { status: 201 });
    }

    if (action === "uninstall") {
      if (!pluginId) {
        return NextResponse.json(
          { error: "pluginId is required" },
          { status: 400 }
        );
      }
      const result = uninstallPlugin(pluginId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'install' or 'uninstall'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] POST /api/plugins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
