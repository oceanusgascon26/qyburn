import { NextResponse } from "next/server";
import { getJiraConnector } from "../../../../../bot/lib/jira-connector";
import { getServiceNowConnector } from "../../../../../bot/lib/servicenow-connector";
import { getIntuneConnector } from "../../../../../bot/lib/intune-connector";
import { getDefenderConnector } from "../../../../../bot/lib/defender-connector";
import { getConfluenceConnector } from "../../../../../bot/lib/confluence-connector";

export interface IntegrationStatus {
  name: string;
  key: string;
  connected: boolean;
  mode: "live" | "stub";
  lastSync?: string;
  envVar: string;
}

/**
 * GET /api/integrations/status — Status of all integrations.
 * Returns connected/disconnected state for each connector.
 */
export async function GET() {
  try {
    const jira = getJiraConnector();
    const snow = getServiceNowConnector();
    const intune = getIntuneConnector();
    const defender = getDefenderConnector();
    const confluence = getConfluenceConnector();

    const integrations: IntegrationStatus[] = [
      {
        name: "Jira Service Management",
        key: "jira",
        connected: !jira.isStubMode,
        mode: jira.isStubMode ? "stub" : "live",
        lastSync: new Date().toISOString(),
        envVar: "JIRA_BASE_URL",
      },
      {
        name: "ServiceNow",
        key: "servicenow",
        connected: !snow.isStubMode,
        mode: snow.isStubMode ? "stub" : "live",
        lastSync: new Date().toISOString(),
        envVar: "SERVICENOW_INSTANCE",
      },
      {
        name: "Microsoft Intune",
        key: "intune",
        connected: !intune.isStubMode,
        mode: intune.isStubMode ? "stub" : "live",
        lastSync: new Date().toISOString(),
        envVar: "AZURE_CLIENT_ID",
      },
      {
        name: "Microsoft Defender",
        key: "defender",
        connected: !defender.isStubMode,
        mode: defender.isStubMode ? "stub" : "live",
        lastSync: new Date().toISOString(),
        envVar: "AZURE_CLIENT_ID",
      },
      {
        name: "Confluence",
        key: "confluence",
        connected: !confluence.isStubMode,
        mode: confluence.isStubMode ? "stub" : "live",
        lastSync: new Date().toISOString(),
        envVar: "CONFLUENCE_BASE_URL",
      },
    ];

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("[API] GET /api/integrations/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
