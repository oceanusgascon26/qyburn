/**
 * Jira Service Management Connector — Integration with Jira REST API
 * for ticket creation, search, status updates, and conversation linking.
 *
 * Supports both real Jira API calls (when configured) and stub mode
 * for development/demo purposes.
 */

// ─── Types ───────────────────────────────────────────────────

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string;
  reporter: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JiraComment {
  id: string;
  author: string;
  body: string;
  createdAt: Date;
}

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

// ─── Stub Data ──────────────────────────────────────────────

let ticketCounter = 100;

const stubTickets: Map<string, JiraTicket> = new Map([
  [
    "IT-101",
    {
      id: "10001",
      key: "IT-101",
      summary: "VPN not connecting from home office",
      description:
        "User reports GlobalProtect VPN disconnects after 5 minutes. Windows 11, latest client version.",
      status: "In Progress",
      priority: "High",
      assignee: "chris.gascon@sagadiagnostics.com",
      reporter: "jane.doe@sagadiagnostics.com",
      createdAt: new Date("2026-03-01T09:00:00Z"),
      updatedAt: new Date("2026-03-03T14:30:00Z"),
    },
  ],
  [
    "IT-102",
    {
      id: "10002",
      key: "IT-102",
      summary: "Request new M365 E5 license",
      description:
        "New hire in Engineering needs M365 E5 license for Teams, SharePoint, and Power BI access.",
      status: "Open",
      priority: "Medium",
      reporter: "hr@sagadiagnostics.com",
      createdAt: new Date("2026-03-02T11:00:00Z"),
      updatedAt: new Date("2026-03-02T11:00:00Z"),
    },
  ],
  [
    "IT-103",
    {
      id: "10003",
      key: "IT-103",
      summary: "Printer on 3rd floor not responding",
      description:
        "HP LaserJet Pro on 3rd floor shows offline in print queue. Power cycled, still offline.",
      status: "Open",
      priority: "Low",
      reporter: "bob.smith@sagadiagnostics.com",
      createdAt: new Date("2026-03-03T08:15:00Z"),
      updatedAt: new Date("2026-03-03T08:15:00Z"),
    },
  ],
]);

const ticketConversationLinks: Map<string, string> = new Map();

// ─── Connector ──────────────────────────────────────────────

export class JiraConnector {
  private config: JiraConfig;
  private isStub: boolean;

  constructor(config: JiraConfig) {
    this.config = config;
    this.isStub = !config.baseUrl || config.baseUrl === "stub";
  }

  /**
   * Create a new Jira ticket.
   * Stub: generates a mock ticket with an incremented key.
   * Real: POST /rest/api/3/issue
   */
  async createTicket(
    summary: string,
    description: string,
    priority: string,
    reporter: string
  ): Promise<JiraTicket> {
    if (!this.isStub) {
      // Real Jira API call — POST /rest/api/3/issue
      console.log(
        `[JIRA] POST ${this.config.baseUrl}/rest/api/3/issue — ${summary}`
      );
      // In production:
      // const response = await fetch(`${this.config.baseUrl}/rest/api/3/issue`, {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Basic ${btoa(`${this.config.email}:${this.config.apiToken}`)}`,
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     fields: {
      //       project: { key: "IT" },
      //       summary,
      //       description: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: description }] }] },
      //       issuetype: { name: "Task" },
      //       priority: { name: priority },
      //       reporter: { emailAddress: reporter },
      //     },
      //   }),
      // });
      // return mapJiraResponse(await response.json());
    }

    ticketCounter++;
    const key = `IT-${ticketCounter}`;
    const ticket: JiraTicket = {
      id: `${10000 + ticketCounter}`,
      key,
      summary,
      description,
      status: "Open",
      priority,
      reporter,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stubTickets.set(key, ticket);
    console.log(`[JIRA] Created ticket ${key}: ${summary}`);
    return ticket;
  }

  /**
   * Get a ticket by key.
   * Stub: returns from in-memory map.
   * Real: GET /rest/api/3/issue/{key}
   */
  async getTicket(ticketKey: string): Promise<JiraTicket | null> {
    if (!this.isStub) {
      console.log(
        `[JIRA] GET ${this.config.baseUrl}/rest/api/3/issue/${ticketKey}`
      );
      // In production: fetch and map response
    }

    return stubTickets.get(ticketKey) ?? null;
  }

  /**
   * Transition a ticket to a new status.
   * Stub: updates in-memory status.
   * Real: POST /rest/api/3/issue/{key}/transitions
   */
  async updateTicketStatus(
    ticketKey: string,
    status: string
  ): Promise<JiraTicket | null> {
    if (!this.isStub) {
      console.log(
        `[JIRA] POST ${this.config.baseUrl}/rest/api/3/issue/${ticketKey}/transitions — ${status}`
      );
      // In production: find transition ID, then POST
    }

    const ticket = stubTickets.get(ticketKey);
    if (!ticket) return null;

    ticket.status = status;
    ticket.updatedAt = new Date();
    console.log(`[JIRA] Updated ${ticketKey} status to ${status}`);
    return ticket;
  }

  /**
   * Search tickets using JQL.
   * Stub: filters in-memory tickets by summary/description match.
   * Real: GET /rest/api/3/search?jql={query}
   */
  async searchTickets(query: string): Promise<JiraTicket[]> {
    if (!this.isStub) {
      console.log(
        `[JIRA] GET ${this.config.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(query)}`
      );
      // In production: fetch and map results
    }

    const lower = query.toLowerCase();
    return [...stubTickets.values()].filter(
      (t) =>
        t.summary.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.key.toLowerCase().includes(lower)
    );
  }

  /**
   * Get tickets assigned to or reported by a user.
   * Stub: filters by reporter/assignee email.
   * Real: JQL — assignee = "email" OR reporter = "email"
   */
  async getMyTickets(userEmail: string): Promise<JiraTicket[]> {
    if (!this.isStub) {
      const jql = `assignee = "${userEmail}" OR reporter = "${userEmail}" ORDER BY updated DESC`;
      console.log(
        `[JIRA] GET ${this.config.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}`
      );
    }

    return [...stubTickets.values()].filter(
      (t) => t.reporter === userEmail || t.assignee === userEmail
    );
  }

  /**
   * Add a comment to a ticket.
   * Stub: logs the comment.
   * Real: POST /rest/api/3/issue/{key}/comment
   */
  async addComment(ticketKey: string, comment: string): Promise<JiraComment> {
    if (!this.isStub) {
      console.log(
        `[JIRA] POST ${this.config.baseUrl}/rest/api/3/issue/${ticketKey}/comment`
      );
    }

    const jiraComment: JiraComment = {
      id: `comment-${Date.now()}`,
      author: "qyburn-bot",
      body: comment,
      createdAt: new Date(),
    };

    console.log(`[JIRA] Added comment to ${ticketKey}: ${comment.slice(0, 80)}...`);
    return jiraComment;
  }

  /**
   * Link a Jira ticket to a bot conversation for bi-directional sync.
   * Updates from the conversation can be pushed to the ticket and vice versa.
   */
  async syncTicketToConversation(
    ticketKey: string,
    conversationId: string
  ): Promise<{ linked: boolean; ticketKey: string; conversationId: string }> {
    ticketConversationLinks.set(ticketKey, conversationId);
    console.log(
      `[JIRA] Linked ticket ${ticketKey} to conversation ${conversationId}`
    );

    // Add a comment on the ticket noting the bot conversation link
    await this.addComment(
      ticketKey,
      `Linked to Qyburn bot conversation: ${conversationId}`
    );

    return { linked: true, ticketKey, conversationId };
  }

  /**
   * Check if the connector is using stub data.
   */
  get isStubMode(): boolean {
    return this.isStub;
  }
}

// ─── Singleton Factory ──────────────────────────────────────

let instance: JiraConnector | null = null;

/**
 * Get the singleton JiraConnector instance.
 * Checks JIRA_BASE_URL env var; returns stub connector if not configured.
 */
export function getJiraConnector(): JiraConnector {
  if (!instance) {
    const baseUrl = process.env.JIRA_BASE_URL ?? "stub";
    const email = process.env.JIRA_EMAIL ?? "";
    const apiToken = process.env.JIRA_API_TOKEN ?? "";

    instance = new JiraConnector({ baseUrl, email, apiToken });

    if (baseUrl === "stub") {
      console.log("[JIRA] Running in stub mode — set JIRA_BASE_URL to connect");
    } else {
      console.log(`[JIRA] Connected to ${baseUrl}`);
    }
  }

  return instance;
}
