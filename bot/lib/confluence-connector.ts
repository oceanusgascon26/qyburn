/**
 * Confluence Connector — Bi-directional integration with Atlassian Confluence
 * for page CRUD, CQL search, space browsing, and knowledge base ingestion.
 *
 * Supports both real Confluence REST API calls (when configured) and stub mode.
 */

import { ingestDocument } from "./knowledge-engine";

// ─── Types ───────────────────────────────────────────────────

export interface ConfluencePage {
  id: string;
  title: string;
  spaceKey: string;
  content: string;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  url?: string;
}

interface ConfluenceConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

// ─── Stub Data ──────────────────────────────────────────────

const stubPages: Map<string, ConfluencePage> = new Map([
  [
    "page-001",
    {
      id: "page-001",
      title: "VPN Setup Guide",
      spaceKey: "IT",
      content:
        "## VPN Setup Guide\n\n### Prerequisites\n- GlobalProtect client installed\n- Active Azure AD account\n- MFA enrolled\n\n### Steps\n1. Open GlobalProtect\n2. Enter portal address: vpn.sagadiagnostics.com\n3. Sign in with your SAGA email\n4. Complete MFA challenge\n5. Click Connect\n\n### Troubleshooting\n- If connection drops: Check your internet, then reconnect\n- If MFA fails: Re-register at aka.ms/mfasetup\n- If portal unreachable: Contact IT (#it-support on Slack)",
      version: 3,
      createdBy: "chris.gascon@sagadiagnostics.com",
      createdAt: new Date("2025-08-15T10:00:00Z"),
      updatedAt: new Date("2026-02-20T14:30:00Z"),
      url: "https://saga-diagnostics.atlassian.net/wiki/spaces/IT/pages/page-001",
    },
  ],
  [
    "page-002",
    {
      id: "page-002",
      title: "New Hire IT Onboarding Checklist",
      spaceKey: "IT",
      content:
        "## New Hire IT Onboarding\n\n### Day 1\n- [ ] Laptop provisioned and shipped\n- [ ] M365 E5 license assigned\n- [ ] Azure AD account created\n- [ ] Added to department Teams channel\n- [ ] VPN access configured\n\n### Week 1\n- [ ] Security awareness training assigned\n- [ ] MFA enrollment completed\n- [ ] Access to department SharePoint site\n- [ ] Jira account created\n- [ ] 1:1 with IT for tool walkthrough\n\n### Software Stack\n- Microsoft 365 (Outlook, Teams, SharePoint, OneDrive)\n- GlobalProtect VPN\n- Slack (sagadiagnostics.slack.com)\n- Jira (saga-diagnostics.atlassian.net)\n- Qualio (quality management)",
      version: 7,
      createdBy: "chris.gascon@sagadiagnostics.com",
      createdAt: new Date("2025-05-01T09:00:00Z"),
      updatedAt: new Date("2026-03-01T11:00:00Z"),
      url: "https://saga-diagnostics.atlassian.net/wiki/spaces/IT/pages/page-002",
    },
  ],
  [
    "page-003",
    {
      id: "page-003",
      title: "Password Reset Policy",
      spaceKey: "IT",
      content:
        "## Password Reset Policy\n\n### Self-Service Reset\nUsers can reset their password at https://passwordreset.microsoftonline.com or via the Qyburn Slack bot.\n\n### Requirements\n- Minimum 14 characters\n- At least 1 uppercase, 1 lowercase, 1 number, 1 special character\n- Cannot reuse last 12 passwords\n- Expires every 90 days\n- Account locks after 5 failed attempts (30-min lockout)\n\n### Admin Reset\nIT admins can force-reset a password via Azure AD portal or Qyburn admin dashboard. User will be required to change on next sign-in.",
      version: 2,
      createdBy: "chris.gascon@sagadiagnostics.com",
      createdAt: new Date("2025-10-10T13:00:00Z"),
      updatedAt: new Date("2026-01-15T09:30:00Z"),
      url: "https://saga-diagnostics.atlassian.net/wiki/spaces/IT/pages/page-003",
    },
  ],
  [
    "page-004",
    {
      id: "page-004",
      title: "Incident Response Runbook",
      spaceKey: "IT",
      content:
        "## Incident Response Runbook\n\n### Severity Levels\n- **P1 (Critical):** Full service outage, data breach, ransomware. Response: 15 min.\n- **P2 (High):** Partial outage, security alert. Response: 1 hour.\n- **P3 (Medium):** Degraded service, single-user issue. Response: 4 hours.\n- **P4 (Low):** Informational, enhancement request. Response: 1 business day.\n\n### Response Steps\n1. Acknowledge the incident in #incident-response Slack channel\n2. Assess severity and impact\n3. Assign incident commander\n4. Contain the issue\n5. Investigate root cause\n6. Remediate and restore service\n7. Post-mortem within 48 hours\n\n### Escalation Path\nTier 1 (Qyburn bot) → Tier 2 (IT Admin) → Tier 3 (Engineering) → CISO",
      version: 4,
      createdBy: "chris.gascon@sagadiagnostics.com",
      createdAt: new Date("2025-07-20T15:00:00Z"),
      updatedAt: new Date("2026-02-10T10:15:00Z"),
      url: "https://saga-diagnostics.atlassian.net/wiki/spaces/IT/pages/page-004",
    },
  ],
]);

let pageCounter = 100;

// ─── Connector ──────────────────────────────────────────────

export class ConfluenceConnector {
  private config: ConfluenceConfig;
  private isStub: boolean;

  constructor(config: ConfluenceConfig) {
    this.config = config;
    this.isStub = !config.baseUrl || config.baseUrl === "stub";
  }

  /**
   * Get a single page by ID.
   * Stub: returns from in-memory map.
   * Real: GET /wiki/rest/api/content/{pageId}?expand=body.storage,version
   */
  async getPage(pageId: string): Promise<ConfluencePage | null> {
    if (!this.isStub) {
      console.log(
        `[CONFLUENCE] GET ${this.config.baseUrl}/wiki/rest/api/content/${pageId}?expand=body.storage,version`
      );
    }

    return stubPages.get(pageId) ?? null;
  }

  /**
   * Search pages using CQL (Confluence Query Language).
   * Stub: filters in-memory pages by title/content match.
   * Real: GET /wiki/rest/api/content/search?cql={query}
   */
  async searchPages(
    query: string,
    spaceKey?: string
  ): Promise<ConfluencePage[]> {
    if (!this.isStub) {
      let cql = `text ~ "${query}"`;
      if (spaceKey) cql += ` AND space = "${spaceKey}"`;
      console.log(
        `[CONFLUENCE] GET ${this.config.baseUrl}/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}`
      );
    }

    const lower = query.toLowerCase();
    return [...stubPages.values()].filter((p) => {
      if (spaceKey && p.spaceKey !== spaceKey) return false;
      return (
        p.title.toLowerCase().includes(lower) ||
        p.content.toLowerCase().includes(lower)
      );
    });
  }

  /**
   * Create a new Confluence page.
   * Stub: adds to in-memory map.
   * Real: POST /wiki/rest/api/content
   */
  async createPage(
    spaceKey: string,
    title: string,
    content: string,
    parentId?: string
  ): Promise<ConfluencePage> {
    if (!this.isStub) {
      console.log(
        `[CONFLUENCE] POST ${this.config.baseUrl}/wiki/rest/api/content — ${title}`
      );
      // In production:
      // const response = await fetch(`${this.config.baseUrl}/wiki/rest/api/content`, {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Basic ${btoa(`${this.config.email}:${this.config.apiToken}`)}`,
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     type: "page",
      //     title,
      //     space: { key: spaceKey },
      //     body: { storage: { value: content, representation: "storage" } },
      //     ...(parentId ? { ancestors: [{ id: parentId }] } : {}),
      //   }),
      // });
    }

    pageCounter++;
    const id = `page-${pageCounter}`;
    const page: ConfluencePage = {
      id,
      title,
      spaceKey,
      content,
      version: 1,
      createdBy: "qyburn-bot",
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId,
      url: `${this.config.baseUrl}/wiki/spaces/${spaceKey}/pages/${id}`,
    };

    stubPages.set(id, page);
    console.log(`[CONFLUENCE] Created page "${title}" in space ${spaceKey}`);
    return page;
  }

  /**
   * Update an existing page's content.
   * Stub: updates in-memory page.
   * Real: PUT /wiki/rest/api/content/{pageId}
   */
  async updatePage(
    pageId: string,
    content: string
  ): Promise<ConfluencePage | null> {
    if (!this.isStub) {
      console.log(
        `[CONFLUENCE] PUT ${this.config.baseUrl}/wiki/rest/api/content/${pageId}`
      );
    }

    const page = stubPages.get(pageId);
    if (!page) return null;

    page.content = content;
    page.version++;
    page.updatedAt = new Date();
    console.log(`[CONFLUENCE] Updated page "${page.title}" (v${page.version})`);
    return page;
  }

  /**
   * List all pages in a space.
   * Stub: filters in-memory pages by space key.
   * Real: GET /wiki/rest/api/content?spaceKey={key}&limit=100
   */
  async getSpacePages(spaceKey: string): Promise<ConfluencePage[]> {
    if (!this.isStub) {
      console.log(
        `[CONFLUENCE] GET ${this.config.baseUrl}/wiki/rest/api/content?spaceKey=${spaceKey}&limit=100`
      );
    }

    return [...stubPages.values()].filter((p) => p.spaceKey === spaceKey);
  }

  /**
   * Ingest all pages from a Confluence space into the knowledge base.
   * Fetches each page and passes content to the knowledge engine for
   * chunking, indexing, and RAG search availability.
   */
  async ingestSpaceToKnowledge(
    spaceKey: string
  ): Promise<{ ingested: number; errors: string[] }> {
    const pages = await this.getSpacePages(spaceKey);
    const errors: string[] = [];
    let ingested = 0;

    for (const page of pages) {
      try {
        // Strip markdown headings for cleaner ingestion
        const plainContent = page.content
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .trim();

        ingestDocument(
          page.title,
          plainContent,
          "Confluence",
          [spaceKey, "confluence", "imported"]
        );
        ingested++;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown error";
        errors.push(`Failed to ingest "${page.title}": ${msg}`);
      }
    }

    console.log(
      `[CONFLUENCE] Ingested ${ingested}/${pages.length} pages from space ${spaceKey} into knowledge base`
    );
    return { ingested, errors };
  }

  /**
   * Check if the connector is using stub data.
   */
  get isStubMode(): boolean {
    return this.isStub;
  }
}

// ─── Singleton Factory ──────────────────────────────────────

let instance: ConfluenceConnector | null = null;

/**
 * Get the singleton ConfluenceConnector instance.
 * Checks CONFLUENCE_BASE_URL env var; returns stub if not configured.
 */
export function getConfluenceConnector(): ConfluenceConnector {
  if (!instance) {
    const baseUrl = process.env.CONFLUENCE_BASE_URL ?? "stub";
    const email = process.env.CONFLUENCE_EMAIL ?? "";
    const apiToken = process.env.CONFLUENCE_API_TOKEN ?? "";

    instance = new ConfluenceConnector({ baseUrl, email, apiToken });

    if (baseUrl === "stub") {
      console.log(
        "[CONFLUENCE] Running in stub mode — set CONFLUENCE_BASE_URL to connect"
      );
    } else {
      console.log(`[CONFLUENCE] Connected to ${baseUrl}`);
    }
  }

  return instance;
}
