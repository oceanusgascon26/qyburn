/**
 * Microsoft Defender TVM Connector — Integration with Microsoft 365 Defender
 * for security alerts, vulnerability management, Secure Score, and
 * security recommendations.
 *
 * Supports both real Defender API calls (when configured) and stub mode.
 */

// ─── Types ───────────────────────────────────────────────────

export interface SecurityAlert {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignedTo?: string;
  description: string;
  detectedAt: Date;
}

export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  affectedDevices: number;
  fixAvailable: boolean;
  publishedDate: Date;
}

export interface SecureScore {
  current: number;
  max: number;
  percentage: number;
  comparedToAverage: string;
  lastUpdated: Date;
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  category: string;
  status: "Active" | "Completed" | "InProgress";
  exposedDevices: number;
  remediationSteps: string[];
}

interface DefenderConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

// ─── Stub Data ──────────────────────────────────────────────

const stubAlerts: SecurityAlert[] = [
  {
    id: "alert-001",
    title: "Suspicious sign-in from unfamiliar location",
    severity: "High",
    status: "New",
    assignedTo: "chris.gascon@sagadiagnostics.com",
    description:
      "Sign-in detected from IP 185.220.101.42 (Tor exit node) for user bob.smith@sagadiagnostics.com. Location: Unknown. This IP has been associated with malicious activity.",
    detectedAt: new Date("2026-03-03T06:15:00Z"),
  },
  {
    id: "alert-002",
    title: "Outdated browser detected on multiple devices",
    severity: "Medium",
    status: "InProgress",
    assignedTo: "chris.gascon@sagadiagnostics.com",
    description:
      "Chrome 119.0.6045.105 detected on 3 managed devices. Current version is 123.0.6312.58. Outdated browsers are vulnerable to known exploits including CVE-2024-0519.",
    detectedAt: new Date("2026-03-02T14:30:00Z"),
  },
  {
    id: "alert-003",
    title: "Missing security patches on Windows devices",
    severity: "High",
    status: "New",
    description:
      "5 Windows devices are missing critical security update KB5034765 (Feb 2026 Cumulative Update). This update addresses 12 known vulnerabilities including 2 actively exploited.",
    detectedAt: new Date("2026-03-01T09:00:00Z"),
  },
  {
    id: "alert-004",
    title: "Unusual file download activity",
    severity: "Low",
    status: "Resolved",
    description:
      "User alice.wong@sagadiagnostics.com downloaded 47 files from SharePoint in 10 minutes. Pattern is unusual for this user but may be legitimate (project archive download).",
    detectedAt: new Date("2026-02-28T16:45:00Z"),
  },
  {
    id: "alert-005",
    title: "MFA fatigue attack detected",
    severity: "Critical",
    status: "New",
    assignedTo: "chris.gascon@sagadiagnostics.com",
    description:
      "20 MFA push notifications sent to jane.doe@sagadiagnostics.com in 5 minutes from unknown device. Potential MFA fatigue/push bombing attack. Account temporarily locked.",
    detectedAt: new Date("2026-03-03T11:20:00Z"),
  },
];

const stubVulnerabilities: Vulnerability[] = [
  {
    id: "vuln-001",
    cveId: "CVE-2026-0078",
    title: "Windows Kernel Elevation of Privilege",
    severity: "Critical",
    description:
      "A local attacker can exploit this vulnerability to gain SYSTEM privileges. Affects Windows 11 23H2 and earlier.",
    affectedDevices: 8,
    fixAvailable: true,
    publishedDate: new Date("2026-02-13T00:00:00Z"),
  },
  {
    id: "vuln-002",
    cveId: "CVE-2026-0102",
    title: "Chrome V8 Remote Code Execution",
    severity: "High",
    description:
      "Type confusion in V8 allows remote code execution via crafted HTML page. Affects Chrome < 123.0.6312.58.",
    affectedDevices: 3,
    fixAvailable: true,
    publishedDate: new Date("2026-02-20T00:00:00Z"),
  },
  {
    id: "vuln-003",
    cveId: "CVE-2026-0155",
    title: "Microsoft Outlook Remote Code Execution",
    severity: "High",
    description:
      "Specially crafted email can trigger RCE in Outlook client without user interaction. Affects M365 Apps < 16.0.17328.20162.",
    affectedDevices: 12,
    fixAvailable: true,
    publishedDate: new Date("2026-02-27T00:00:00Z"),
  },
  {
    id: "vuln-004",
    cveId: "CVE-2025-8847",
    title: "OpenSSL Buffer Overflow",
    severity: "Medium",
    description:
      "Buffer overflow in TLS handshake parsing. Requires specific cipher suite configuration. Low exploitability.",
    affectedDevices: 2,
    fixAvailable: true,
    publishedDate: new Date("2026-01-15T00:00:00Z"),
  },
];

const stubRecommendations: SecurityRecommendation[] = [
  {
    id: "rec-001",
    title: "Enable disk encryption on all Windows devices",
    description:
      "3 Windows devices do not have BitLocker enabled. Enable BitLocker via Intune policy to protect data at rest.",
    severity: "High",
    category: "Data Protection",
    status: "Active",
    exposedDevices: 3,
    remediationSteps: [
      "Create BitLocker configuration profile in Intune",
      "Assign to All Windows Devices group",
      "Monitor encryption status in Intune reports",
    ],
  },
  {
    id: "rec-002",
    title: "Enforce password-less authentication",
    description:
      "18 users still use password-only authentication. Migrate to Windows Hello for Business or FIDO2 security keys.",
    severity: "Medium",
    category: "Identity",
    status: "InProgress",
    exposedDevices: 0,
    remediationSteps: [
      "Enable Windows Hello for Business in Entra ID",
      "Distribute FIDO2 keys to privileged users",
      "Create conditional access policy requiring strong auth",
      "Monitor registration status",
    ],
  },
  {
    id: "rec-003",
    title: "Apply latest security updates to Windows fleet",
    description:
      "5 devices are missing the February 2026 cumulative update KB5034765. Deploy via Windows Update for Business.",
    severity: "Critical",
    category: "Software Updates",
    status: "Active",
    exposedDevices: 5,
    remediationSteps: [
      "Review update compliance in Intune",
      "Create expedited update policy for KB5034765",
      "Set compliance deadline to 48 hours",
      "Follow up on non-compliant devices",
    ],
  },
  {
    id: "rec-004",
    title: "Restrict USB storage device access",
    description:
      "No device control policy restricts USB mass storage. Users can exfiltrate data via USB drives.",
    severity: "Medium",
    category: "Device Control",
    status: "Active",
    exposedDevices: 15,
    remediationSteps: [
      "Create device control policy in Defender for Endpoint",
      "Allow approved USB devices only (by vendor/serial)",
      "Enable audit mode first, then enforce after 30 days",
    ],
  },
];

// ─── Connector ──────────────────────────────────────────────

export class DefenderConnector {
  private config: DefenderConfig;
  private isStub: boolean;

  constructor(config: DefenderConfig) {
    this.config = config;
    this.isStub = !config.clientId || config.clientId === "stub";
  }

  /**
   * Get security alerts for a user or all alerts.
   * Stub: returns mock alerts, optionally filtered by assignee.
   * Real: GET /security/alerts_v2?$filter=assignedTo eq '{userId}'
   */
  async getUserAlerts(userId?: string): Promise<SecurityAlert[]> {
    if (!this.isStub) {
      const filter = userId
        ? `?$filter=assignedTo eq '${userId}'`
        : "";
      console.log(
        `[DEFENDER] GET https://graph.microsoft.com/v1.0/security/alerts_v2${filter}`
      );
    }

    if (!userId) return [...stubAlerts];

    return stubAlerts.filter((a) => a.assignedTo === userId);
  }

  /**
   * Get known vulnerabilities, optionally filtered by device.
   * Stub: returns mock vulnerability list.
   * Real: GET /security/microsoft.graph.security.vulnerabilities
   */
  async getVulnerabilities(deviceId?: string): Promise<Vulnerability[]> {
    if (!this.isStub) {
      const filter = deviceId
        ? `?$filter=affectedDeviceId eq '${deviceId}'`
        : "";
      console.log(
        `[DEFENDER] GET https://api.securitycenter.microsoft.com/api/vulnerabilities${filter}`
      );
    }

    if (deviceId) {
      // In stub mode, return a subset for a specific device
      return stubVulnerabilities.slice(0, 2);
    }

    return [...stubVulnerabilities];
  }

  /**
   * Get the organization's Microsoft Secure Score.
   * Stub: returns a realistic mock score.
   * Real: GET /security/secureScores?$top=1
   */
  async getSecurityScore(): Promise<SecureScore> {
    if (!this.isStub) {
      console.log(
        "[DEFENDER] GET https://graph.microsoft.com/v1.0/security/secureScores?$top=1"
      );
    }

    return {
      current: 72,
      max: 100,
      percentage: 72,
      comparedToAverage:
        "Above average (industry avg: 58, similar-size orgs avg: 65)",
      lastUpdated: new Date("2026-03-03T00:00:00Z"),
    };
  }

  /**
   * Get security recommendations from Defender TVM.
   * Stub: returns mock recommendations.
   * Real: GET /security/microsoft.graph.security.recommendations
   */
  async getRecommendations(): Promise<SecurityRecommendation[]> {
    if (!this.isStub) {
      console.log(
        "[DEFENDER] GET https://api.securitycenter.microsoft.com/api/recommendations"
      );
    }

    return [...stubRecommendations];
  }

  /**
   * Check if the connector is using stub data.
   */
  get isStubMode(): boolean {
    return this.isStub;
  }
}

// ─── Singleton Factory ──────────────────────────────────────

let instance: DefenderConnector | null = null;

/**
 * Get the singleton DefenderConnector instance.
 * Checks AZURE_CLIENT_ID env var; returns stub if not configured.
 */
export function getDefenderConnector(): DefenderConnector {
  if (!instance) {
    const clientId = process.env.AZURE_CLIENT_ID ?? "stub";
    const clientSecret = process.env.AZURE_CLIENT_SECRET ?? "";
    const tenantId = process.env.AZURE_TENANT_ID ?? "";

    instance = new DefenderConnector({ clientId, clientSecret, tenantId });

    if (clientId === "stub") {
      console.log(
        "[DEFENDER] Running in stub mode — set AZURE_CLIENT_ID to connect"
      );
    } else {
      console.log(`[DEFENDER] Connected to tenant ${tenantId}`);
    }
  }

  return instance;
}
