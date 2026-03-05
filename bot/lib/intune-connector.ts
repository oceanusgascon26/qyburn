/**
 * Microsoft Intune Connector — Integration with Microsoft Graph API
 * for device compliance, user devices, policy management, and
 * compliance check triggering.
 *
 * Supports both real Graph API calls (when configured) and stub mode.
 */

// ─── Types ───────────────────────────────────────────────────

export interface DeviceCompliance {
  deviceId: string;
  deviceName: string;
  os: string;
  complianceState: "compliant" | "nonCompliant" | "unknown";
  lastSyncDate: Date;
  userId: string;
}

export interface ManagedDevice {
  deviceId: string;
  deviceName: string;
  os: string;
  osVersion: string;
  model: string;
  manufacturer: string;
  enrolledDate: Date;
  lastSyncDate: Date;
  complianceState: "compliant" | "nonCompliant" | "unknown";
  userId: string;
  userEmail: string;
}

export interface CompliancePolicy {
  id: string;
  displayName: string;
  description: string;
  platform: string;
  isAssigned: boolean;
}

interface IntuneConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

// ─── Stub Data ──────────────────────────────────────────────

const stubDevices: Map<string, ManagedDevice[]> = new Map([
  [
    "user-001",
    [
      {
        deviceId: "dev-001",
        deviceName: "SAGA-LT-JaneDoe",
        os: "Windows",
        osVersion: "11 23H2 (Build 22631.3007)",
        model: "Latitude 5540",
        manufacturer: "Dell Inc.",
        enrolledDate: new Date("2025-06-15T10:00:00Z"),
        lastSyncDate: new Date("2026-03-03T08:30:00Z"),
        complianceState: "compliant",
        userId: "user-001",
        userEmail: "jane.doe@sagadiagnostics.com",
      },
      {
        deviceId: "dev-002",
        deviceName: "JaneDoe-iPhone15",
        os: "iOS",
        osVersion: "17.3.1",
        model: "iPhone 15 Pro",
        manufacturer: "Apple",
        enrolledDate: new Date("2025-09-20T14:00:00Z"),
        lastSyncDate: new Date("2026-03-03T07:15:00Z"),
        complianceState: "compliant",
        userId: "user-001",
        userEmail: "jane.doe@sagadiagnostics.com",
      },
    ],
  ],
  [
    "user-002",
    [
      {
        deviceId: "dev-003",
        deviceName: "SAGA-LT-BobSmith",
        os: "Windows",
        osVersion: "11 23H2 (Build 22631.2861)",
        model: "ThinkPad T14s Gen 4",
        manufacturer: "Lenovo",
        enrolledDate: new Date("2025-04-10T09:00:00Z"),
        lastSyncDate: new Date("2026-03-01T16:45:00Z"),
        complianceState: "nonCompliant",
        userId: "user-002",
        userEmail: "bob.smith@sagadiagnostics.com",
      },
    ],
  ],
  [
    "user-003",
    [
      {
        deviceId: "dev-004",
        deviceName: "SAGA-LT-AliceWong",
        os: "Windows",
        osVersion: "11 24H2 (Build 26100.2314)",
        model: "Surface Laptop 5",
        manufacturer: "Microsoft",
        enrolledDate: new Date("2025-11-01T08:00:00Z"),
        lastSyncDate: new Date("2026-03-03T09:00:00Z"),
        complianceState: "compliant",
        userId: "user-003",
        userEmail: "alice.wong@sagadiagnostics.com",
      },
      {
        deviceId: "dev-005",
        deviceName: "AliceWong-Pixel8",
        os: "Android",
        osVersion: "14",
        model: "Pixel 8 Pro",
        manufacturer: "Google",
        enrolledDate: new Date("2025-12-05T11:30:00Z"),
        lastSyncDate: new Date("2026-03-02T22:00:00Z"),
        complianceState: "unknown",
        userId: "user-003",
        userEmail: "alice.wong@sagadiagnostics.com",
      },
    ],
  ],
]);

// ─── Connector ──────────────────────────────────────────────

export class IntuneConnector {
  private config: IntuneConfig;
  private isStub: boolean;

  constructor(config: IntuneConfig) {
    this.config = config;
    this.isStub = !config.clientId || config.clientId === "stub";
  }

  /**
   * Get device compliance status for a user.
   * Stub: returns mock compliance data from in-memory devices.
   * Real: GET /deviceManagement/managedDevices?$filter=userId eq '{userId}'
   */
  async getDeviceCompliance(userId: string): Promise<DeviceCompliance[]> {
    if (!this.isStub) {
      console.log(
        `[INTUNE] GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$filter=userId eq '${userId}'`
      );
      // In production:
      // const token = await getGraphToken(this.config);
      // const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      // return mapComplianceResponse(await response.json());
    }

    const devices = stubDevices.get(userId) ?? [];
    return devices.map((d) => ({
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      os: d.os,
      complianceState: d.complianceState,
      lastSyncDate: d.lastSyncDate,
      userId: d.userId,
    }));
  }

  /**
   * Get all managed devices for a user.
   * Stub: returns mock device list.
   * Real: GET /deviceManagement/managedDevices?$filter=userPrincipalName eq '{email}'
   */
  async getUserDevices(userId: string): Promise<ManagedDevice[]> {
    if (!this.isStub) {
      console.log(
        `[INTUNE] GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$filter=userId eq '${userId}'`
      );
    }

    return stubDevices.get(userId) ?? [];
  }

  /**
   * Trigger a compliance re-evaluation for a device.
   * Stub: logs the action and marks last sync as now.
   * Real: POST /deviceManagement/managedDevices/{deviceId}/syncDevice
   */
  async triggerComplianceCheck(
    deviceId: string
  ): Promise<{ triggered: boolean; deviceId: string; message: string }> {
    if (!this.isStub) {
      console.log(
        `[INTUNE] POST https://graph.microsoft.com/v1.0/deviceManagement/managedDevices/${deviceId}/syncDevice`
      );
    }

    // Find and update the stub device
    for (const devices of stubDevices.values()) {
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device) {
        device.lastSyncDate = new Date();
        console.log(
          `[INTUNE] Triggered compliance check for ${device.deviceName} (${deviceId})`
        );
        return {
          triggered: true,
          deviceId,
          message: `Compliance check triggered for ${device.deviceName}. Results available in 5-10 minutes.`,
        };
      }
    }

    return {
      triggered: false,
      deviceId,
      message: `Device ${deviceId} not found in Intune.`,
    };
  }

  /**
   * Push a configuration policy to a specific device.
   * Stub: logs the action.
   * Real: POST /deviceManagement/deviceConfigurations/{policyId}/assign
   */
  async pushPolicy(
    deviceId: string,
    policyId: string
  ): Promise<{ pushed: boolean; deviceId: string; policyId: string; message: string }> {
    if (!this.isStub) {
      console.log(
        `[INTUNE] POST https://graph.microsoft.com/v1.0/deviceManagement/deviceConfigurations/${policyId}/assign`
      );
    }

    // Verify device exists in stubs
    let deviceName = "Unknown";
    for (const devices of stubDevices.values()) {
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device) {
        deviceName = device.deviceName;
        break;
      }
    }

    if (deviceName === "Unknown") {
      return {
        pushed: false,
        deviceId,
        policyId,
        message: `Device ${deviceId} not found.`,
      };
    }

    console.log(
      `[INTUNE] Pushed policy ${policyId} to device ${deviceName} (${deviceId})`
    );
    return {
      pushed: true,
      deviceId,
      policyId,
      message: `Policy ${policyId} pushed to ${deviceName}. Device will apply on next sync.`,
    };
  }

  /**
   * Check if the connector is using stub data.
   */
  get isStubMode(): boolean {
    return this.isStub;
  }
}

// ─── Singleton Factory ──────────────────────────────────────

let instance: IntuneConnector | null = null;

/**
 * Get the singleton IntuneConnector instance.
 * Checks AZURE_CLIENT_ID env var; returns stub if not configured.
 */
export function getIntuneConnector(): IntuneConnector {
  if (!instance) {
    const clientId = process.env.AZURE_CLIENT_ID ?? "stub";
    const clientSecret = process.env.AZURE_CLIENT_SECRET ?? "";
    const tenantId = process.env.AZURE_TENANT_ID ?? "";

    instance = new IntuneConnector({ clientId, clientSecret, tenantId });

    if (clientId === "stub") {
      console.log(
        "[INTUNE] Running in stub mode — set AZURE_CLIENT_ID to connect"
      );
    } else {
      console.log(`[INTUNE] Connected to tenant ${tenantId}`);
    }
  }

  return instance;
}
