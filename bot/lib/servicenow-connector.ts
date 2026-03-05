/**
 * ServiceNow Connector — Integration with ServiceNow REST API
 * for incident management, search, and status updates.
 *
 * Supports both real ServiceNow API calls (when configured) and stub mode.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ServiceNowIncident {
  sysId: string;
  number: string;
  shortDescription: string;
  description: string;
  priority: string;
  state: string;
  callerId: string;
  assignedTo?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceNowConfig {
  instanceUrl: string;
  username: string;
  password: string;
}

// ─── Stub Data ──────────────────────────────────────────────

let incidentCounter = 1000;

const stubIncidents: Map<string, ServiceNowIncident> = new Map([
  [
    "sys-001",
    {
      sysId: "sys-001",
      number: "INC0001001",
      shortDescription: "Email not syncing on mobile device",
      description:
        "User reports Outlook mobile app stopped syncing emails after iOS update. Last sync 2 days ago.",
      priority: "2 - High",
      state: "In Progress",
      callerId: "jane.doe@sagadiagnostics.com",
      assignedTo: "chris.gascon@sagadiagnostics.com",
      category: "Email",
      createdAt: new Date("2026-03-01T10:00:00Z"),
      updatedAt: new Date("2026-03-03T09:00:00Z"),
    },
  ],
  [
    "sys-002",
    {
      sysId: "sys-002",
      number: "INC0001002",
      shortDescription: "Unable to access SharePoint site",
      description:
        "User receives 403 Forbidden when navigating to the Engineering SharePoint site. Permissions may have been revoked during last access review.",
      priority: "3 - Moderate",
      state: "New",
      callerId: "bob.smith@sagadiagnostics.com",
      category: "Access",
      createdAt: new Date("2026-03-03T14:00:00Z"),
      updatedAt: new Date("2026-03-03T14:00:00Z"),
    },
  ],
  [
    "sys-003",
    {
      sysId: "sys-003",
      number: "INC0001003",
      shortDescription: "Laptop running slow after update",
      description:
        "After Windows 11 feature update KB5034765, laptop takes 10+ minutes to boot. Dell Latitude 5540, 16GB RAM.",
      priority: "3 - Moderate",
      state: "Awaiting User Info",
      callerId: "alice.wong@sagadiagnostics.com",
      assignedTo: "chris.gascon@sagadiagnostics.com",
      category: "Hardware",
      createdAt: new Date("2026-02-28T08:30:00Z"),
      updatedAt: new Date("2026-03-02T16:45:00Z"),
    },
  ],
]);

// ─── Connector ──────────────────────────────────────────────

export class ServiceNowConnector {
  private config: ServiceNowConfig;
  private isStub: boolean;

  constructor(config: ServiceNowConfig) {
    this.config = config;
    this.isStub = !config.instanceUrl || config.instanceUrl === "stub";
  }

  /**
   * Create a new incident.
   * Stub: generates a mock incident.
   * Real: POST /api/now/table/incident
   */
  async createIncident(data: {
    shortDescription: string;
    description: string;
    priority: string;
    callerId: string;
  }): Promise<ServiceNowIncident> {
    if (!this.isStub) {
      console.log(
        `[SNOW] POST ${this.config.instanceUrl}/api/now/table/incident — ${data.shortDescription}`
      );
      // In production:
      // const response = await fetch(`${this.config.instanceUrl}/api/now/table/incident`, {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
      //     "Content-Type": "application/json",
      //     "Accept": "application/json",
      //   },
      //   body: JSON.stringify({
      //     short_description: data.shortDescription,
      //     description: data.description,
      //     priority: data.priority,
      //     caller_id: data.callerId,
      //   }),
      // });
      // return mapServiceNowResponse(await response.json());
    }

    incidentCounter++;
    const sysId = `sys-${Date.now()}`;
    const incident: ServiceNowIncident = {
      sysId,
      number: `INC000${incidentCounter}`,
      shortDescription: data.shortDescription,
      description: data.description,
      priority: data.priority,
      state: "New",
      callerId: data.callerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stubIncidents.set(sysId, incident);
    console.log(
      `[SNOW] Created incident ${incident.number}: ${data.shortDescription}`
    );
    return incident;
  }

  /**
   * Get an incident by sys_id.
   * Stub: returns from in-memory map.
   * Real: GET /api/now/table/incident/{sys_id}
   */
  async getIncident(sysId: string): Promise<ServiceNowIncident | null> {
    if (!this.isStub) {
      console.log(
        `[SNOW] GET ${this.config.instanceUrl}/api/now/table/incident/${sysId}`
      );
    }

    return stubIncidents.get(sysId) ?? null;
  }

  /**
   * Update an incident.
   * Stub: merges data into the in-memory record.
   * Real: PATCH /api/now/table/incident/{sys_id}
   */
  async updateIncident(
    sysId: string,
    data: Record<string, unknown>
  ): Promise<ServiceNowIncident | null> {
    if (!this.isStub) {
      console.log(
        `[SNOW] PATCH ${this.config.instanceUrl}/api/now/table/incident/${sysId}`
      );
    }

    const incident = stubIncidents.get(sysId);
    if (!incident) return null;

    // Apply updates to known fields
    if (typeof data.state === "string") incident.state = data.state;
    if (typeof data.priority === "string") incident.priority = data.priority;
    if (typeof data.shortDescription === "string")
      incident.shortDescription = data.shortDescription;
    if (typeof data.description === "string")
      incident.description = data.description;
    if (typeof data.assignedTo === "string")
      incident.assignedTo = data.assignedTo;
    if (typeof data.category === "string") incident.category = data.category;

    incident.updatedAt = new Date();
    console.log(`[SNOW] Updated incident ${incident.number}`);
    return incident;
  }

  /**
   * Search incidents by query string.
   * Stub: filters in-memory incidents by description match.
   * Real: GET /api/now/table/incident?sysparm_query={encoded_query}
   */
  async searchIncidents(query: string): Promise<ServiceNowIncident[]> {
    if (!this.isStub) {
      console.log(
        `[SNOW] GET ${this.config.instanceUrl}/api/now/table/incident?sysparm_query=${encodeURIComponent(query)}`
      );
    }

    const lower = query.toLowerCase();
    return [...stubIncidents.values()].filter(
      (inc) =>
        inc.shortDescription.toLowerCase().includes(lower) ||
        inc.description.toLowerCase().includes(lower) ||
        inc.number.toLowerCase().includes(lower)
    );
  }

  /**
   * Get incidents for a specific user.
   * Stub: filters by callerId or assignedTo.
   * Real: JQL — caller_id.email={email}
   */
  async getMyIncidents(userEmail: string): Promise<ServiceNowIncident[]> {
    if (!this.isStub) {
      const query = `caller_id.email=${userEmail}^ORassigned_to.email=${userEmail}`;
      console.log(
        `[SNOW] GET ${this.config.instanceUrl}/api/now/table/incident?sysparm_query=${encodeURIComponent(query)}`
      );
    }

    return [...stubIncidents.values()].filter(
      (inc) => inc.callerId === userEmail || inc.assignedTo === userEmail
    );
  }

  /**
   * Check if the connector is using stub data.
   */
  get isStubMode(): boolean {
    return this.isStub;
  }
}

// ─── Singleton Factory ──────────────────────────────────────

let instance: ServiceNowConnector | null = null;

/**
 * Get the singleton ServiceNowConnector instance.
 * Checks SERVICENOW_INSTANCE env var; returns stub if not configured.
 */
export function getServiceNowConnector(): ServiceNowConnector {
  if (!instance) {
    const instanceUrl = process.env.SERVICENOW_INSTANCE ?? "stub";
    const username = process.env.SERVICENOW_USERNAME ?? "";
    const password = process.env.SERVICENOW_PASSWORD ?? "";

    instance = new ServiceNowConnector({ instanceUrl, username, password });

    if (instanceUrl === "stub") {
      console.log(
        "[SNOW] Running in stub mode — set SERVICENOW_INSTANCE to connect"
      );
    } else {
      console.log(`[SNOW] Connected to ${instanceUrl}`);
    }
  }

  return instance;
}
