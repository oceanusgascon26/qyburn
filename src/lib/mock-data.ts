/**
 * Mock data layer — serves as the data source until a real PostgreSQL
 * database is connected. All API routes read/write to these in-memory arrays.
 */

// ─── Types ───────────────────────────────────────────────────

export interface License {
  id: string;
  name: string;
  vendor: string;
  sku: string | null;
  totalSeats: number;
  usedSeats: number;
  costPerSeat: number | null;
  autoApprove: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseAssignment {
  id: string;
  licenseId: string;
  userId: string;
  userEmail: string;
  assignedAt: string;
  assignedBy: string;
}

export interface RestrictedGroup {
  id: string;
  azureGroupId: string;
  displayName: string;
  description: string | null;
  approverEmail: string;
  requiresJustification: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupAccessRequest {
  id: string;
  groupId: string;
  requesterId: string;
  requesterEmail: string;
  justification: string | null;
  status: "pending" | "approved" | "denied";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  department: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps: OnboardingStep[];
}

export interface OnboardingStep {
  id: string;
  templateId: string;
  order: number;
  title: string;
  description: string | null;
  type: "license" | "group" | "message" | "custom";
  config: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  targetId: string | null;
  details: string | null;
  channel: string | null;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Mock Data ───────────────────────────────────────────────

let nextId = 100;
function genId(): string {
  return `mock-${++nextId}`;
}

export const licenses: License[] = [
  {
    id: "lic-001",
    name: "Microsoft 365 E3",
    vendor: "Microsoft",
    sku: "M365-E3",
    totalSeats: 200,
    usedSeats: 156,
    costPerSeat: 36.0,
    autoApprove: true,
    description: "Standard Microsoft 365 enterprise license with Office apps, Teams, and Exchange.",
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2025-02-20T14:30:00Z",
  },
  {
    id: "lic-002",
    name: "Adobe Creative Cloud",
    vendor: "Adobe",
    sku: "ACC-ALL",
    totalSeats: 30,
    usedSeats: 24,
    costPerSeat: 82.99,
    autoApprove: false,
    description: "Full Adobe Creative Cloud suite. Requires manager approval due to cost.",
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2025-01-10T09:15:00Z",
  },
  {
    id: "lic-003",
    name: "JetBrains All Products",
    vendor: "JetBrains",
    sku: "JB-ALL",
    totalSeats: 50,
    usedSeats: 38,
    costPerSeat: 24.9,
    autoApprove: true,
    description: "JetBrains IDE pack for engineering team. Auto-approved for engineering dept.",
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2025-02-01T11:00:00Z",
  },
  {
    id: "lic-004",
    name: "Slack Pro",
    vendor: "Slack",
    sku: "SLACK-PRO",
    totalSeats: 200,
    usedSeats: 156,
    costPerSeat: 8.75,
    autoApprove: true,
    description: "Slack Pro workspace seat. Auto-provisioned for all employees.",
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2025-02-15T16:00:00Z",
  },
  {
    id: "lic-005",
    name: "Figma Organization",
    vendor: "Figma",
    sku: "FIGMA-ORG",
    totalSeats: 20,
    usedSeats: 15,
    costPerSeat: 45.0,
    autoApprove: false,
    description: "Figma design tool. Requires approval for non-design team members.",
    createdAt: "2024-09-01T10:00:00Z",
    updatedAt: "2025-01-28T13:00:00Z",
  },
];

export const licenseAssignments: LicenseAssignment[] = [
  { id: "la-001", licenseId: "lic-001", userId: "user-001", userEmail: "anna.lindberg@saga.com", assignedAt: "2024-07-01T10:00:00Z", assignedBy: "qyburn-bot" },
  { id: "la-002", licenseId: "lic-001", userId: "user-002", userEmail: "erik.svensson@saga.com", assignedAt: "2024-07-01T10:00:00Z", assignedBy: "qyburn-bot" },
  { id: "la-003", licenseId: "lic-003", userId: "user-002", userEmail: "erik.svensson@saga.com", assignedAt: "2024-08-15T10:00:00Z", assignedBy: "qyburn-bot" },
  { id: "la-004", licenseId: "lic-002", userId: "user-003", userEmail: "maria.chen@saga.com", assignedAt: "2024-10-01T10:00:00Z", assignedBy: "admin@saga.com" },
];

export const restrictedGroups: RestrictedGroup[] = [
  {
    id: "rg-001",
    azureGroupId: "group-001",
    displayName: "SG-Engineering-Admin",
    description: "Full admin access to engineering infrastructure. Requires VP approval.",
    approverEmail: "vp.engineering@saga.com",
    requiresJustification: true,
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2025-01-10T09:00:00Z",
  },
  {
    id: "rg-002",
    azureGroupId: "group-lab-admin",
    displayName: "SG-Lab-Instruments-Admin",
    description: "Admin access to lab instrument control systems.",
    approverEmail: "lab.director@saga.com",
    requiresJustification: true,
    createdAt: "2024-07-01T10:00:00Z",
    updatedAt: "2024-12-15T11:00:00Z",
  },
  {
    id: "rg-003",
    azureGroupId: "group-finance",
    displayName: "SG-Finance-Sensitive",
    description: "Access to financial reporting and sensitive data.",
    approverEmail: "cfo@saga.com",
    requiresJustification: true,
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2025-02-01T08:00:00Z",
  },
];

export const groupAccessRequests: GroupAccessRequest[] = [
  {
    id: "gar-001",
    groupId: "rg-001",
    requesterId: "user-004",
    requesterEmail: "james.patel@saga.com",
    justification: "Need admin access to deploy ML pipeline to production Kubernetes cluster.",
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: "2025-02-26T08:30:00Z",
  },
  {
    id: "gar-002",
    groupId: "rg-002",
    requesterId: "user-001",
    requesterEmail: "anna.lindberg@saga.com",
    justification: "Calibrating new sequencing instrument requires admin access.",
    status: "approved",
    reviewedBy: "lab.director@saga.com",
    reviewedAt: "2025-02-25T14:00:00Z",
    createdAt: "2025-02-25T09:00:00Z",
  },
];

export const onboardingTemplates: OnboardingTemplate[] = [
  {
    id: "ot-001",
    name: "Engineering New Hire",
    department: "Engineering",
    description: "Standard onboarding for software engineers — dev tools, repos, and team channels.",
    isActive: true,
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
    steps: [
      { id: "os-001", templateId: "ot-001", order: 1, title: "Provision Microsoft 365 E3", description: "Auto-assign M365 license", type: "license", config: '{"licenseId":"lic-001"}', createdAt: "2024-08-01T10:00:00Z" },
      { id: "os-002", templateId: "ot-001", order: 2, title: "Provision JetBrains License", description: "Auto-assign JetBrains All Products", type: "license", config: '{"licenseId":"lic-003"}', createdAt: "2024-08-01T10:00:00Z" },
      { id: "os-003", templateId: "ot-001", order: 3, title: "Add to VPN Users", description: "Add to SG-VPN-Users group", type: "group", config: '{"groupId":"group-003"}', createdAt: "2024-08-01T10:00:00Z" },
      { id: "os-004", templateId: "ot-001", order: 4, title: "Send Welcome Message", description: "DM the new hire in Slack with getting-started info", type: "message", config: '{"template":"welcome_engineering"}', createdAt: "2024-08-01T10:00:00Z" },
    ],
  },
  {
    id: "ot-002",
    name: "Lab Technician Onboarding",
    department: "Diagnostics",
    description: "Onboarding for lab staff — instruments, safety training, and lab systems.",
    isActive: true,
    createdAt: "2024-09-15T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
    steps: [
      { id: "os-005", templateId: "ot-002", order: 1, title: "Provision Microsoft 365 E3", description: null, type: "license", config: '{"licenseId":"lic-001"}', createdAt: "2024-09-15T10:00:00Z" },
      { id: "os-006", templateId: "ot-002", order: 2, title: "Add to Lab Users Group", description: null, type: "group", config: '{"groupId":"group-002"}', createdAt: "2024-09-15T10:00:00Z" },
      { id: "os-007", templateId: "ot-002", order: 3, title: "Complete Safety Training", description: "Must complete before lab access is granted", type: "custom", config: '{"url":"https://training.saga.com/lab-safety"}', createdAt: "2024-09-15T10:00:00Z" },
    ],
  },
];

export const auditLogs: AuditLogEntry[] = [
  { id: "al-001", actor: "qyburn-bot", action: "license.assign", target: "Microsoft 365 E3", targetId: "lic-001", details: '{"userId":"user-001","email":"anna.lindberg@saga.com"}', channel: "#it-support", createdAt: "2025-02-26T09:15:00Z" },
  { id: "al-002", actor: "qyburn-bot", action: "license.assign", target: "JetBrains All Products", targetId: "lic-003", details: '{"userId":"user-002","email":"erik.svensson@saga.com"}', channel: "#it-support", createdAt: "2025-02-26T09:10:00Z" },
  { id: "al-003", actor: "james.patel@saga.com", action: "group.request", target: "SG-Engineering-Admin", targetId: "rg-001", details: '{"justification":"Need admin access to deploy ML pipeline"}', channel: "#it-support", createdAt: "2025-02-26T08:30:00Z" },
  { id: "al-004", actor: "lab.director@saga.com", action: "group.approve", target: "SG-Lab-Instruments-Admin", targetId: "rg-002", details: '{"requesterId":"user-001"}', channel: null, createdAt: "2025-02-25T14:00:00Z" },
  { id: "al-005", actor: "qyburn-bot", action: "kb.query", target: "VPN setup", targetId: null, details: '{"user":"maria.chen@saga.com","resolved":true}', channel: "#it-support", createdAt: "2025-02-26T08:00:00Z" },
  { id: "al-006", actor: "admin@saga.com", action: "license.assign", target: "Adobe Creative Cloud", targetId: "lic-002", details: '{"userId":"user-003","email":"maria.chen@saga.com"}', channel: null, createdAt: "2025-02-25T10:00:00Z" },
  { id: "al-007", actor: "qyburn-bot", action: "onboarding.start", target: "Engineering New Hire", targetId: "ot-001", details: '{"employee":"new.hire@saga.com"}', channel: "#it-admin", createdAt: "2025-02-24T09:00:00Z" },
  { id: "al-008", actor: "qyburn-bot", action: "license.revoke", target: "Figma Organization", targetId: "lic-005", details: '{"userId":"user-departed","reason":"offboarding"}', channel: null, createdAt: "2025-02-23T16:00:00Z" },
];

export const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: "kd-001",
    title: "VPN Setup Guide",
    content: "# VPN Setup Guide\n\n## Prerequisites\n- SAGA corporate laptop\n- Active directory account\n- VPN group membership (SG-VPN-Users)\n\n## Steps\n1. Download the SAGA VPN client from the software portal\n2. Install and launch the application\n3. Enter your corporate email and password\n4. Select the nearest gateway (EU-West for Sweden office)\n5. Click Connect\n\n## Troubleshooting\n- If connection fails, ensure you are in the SG-VPN-Users group\n- For certificate errors, contact IT admin",
    category: "Network",
    tags: ["vpn", "remote-access", "network"],
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "kd-002",
    title: "Password Reset Policy",
    content: "# Password Reset Policy\n\n## Self-Service Reset\nEmployees can reset their own passwords at https://passwordreset.saga.com\n\n## Requirements\n- Minimum 12 characters\n- Must include uppercase, lowercase, number, and special character\n- Cannot reuse last 10 passwords\n- Must be changed every 90 days\n\n## Locked Account\nAfter 5 failed attempts, the account is locked for 30 minutes. Contact IT admin for immediate unlock.",
    category: "Security",
    tags: ["password", "security", "account"],
    createdAt: "2024-07-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "kd-003",
    title: "Software Request Process",
    content: "# Software Request Process\n\n## Auto-Approved Software\nThe following can be requested directly through Qyburn:\n- Microsoft 365 E3\n- JetBrains All Products (Engineering dept only)\n- Slack Pro\n\n## Approval Required\n- Adobe Creative Cloud (manager approval)\n- Figma Organization (design lead approval)\n- Any software not in the catalog\n\n## How to Request\n1. Message @Qyburn in Slack\n2. Say \"I need [software name]\"\n3. Bot will check eligibility and either auto-provision or route for approval",
    category: "Software",
    tags: ["software", "license", "request"],
    createdAt: "2024-09-01T10:00:00Z",
    updatedAt: "2025-02-10T10:00:00Z",
  },
];

// ─── Data access functions ───────────────────────────────────

export function getLicenses(): License[] {
  return [...licenses];
}

export function getLicense(id: string): License | undefined {
  return licenses.find((l) => l.id === id);
}

export function createLicense(data: Omit<License, "id" | "createdAt" | "updatedAt">): License {
  const now = new Date().toISOString();
  const license: License = { ...data, id: genId(), createdAt: now, updatedAt: now };
  licenses.push(license);
  return license;
}

export function updateLicense(id: string, data: Partial<License>): License | null {
  const idx = licenses.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  licenses[idx] = { ...licenses[idx], ...data, updatedAt: new Date().toISOString() };
  return licenses[idx];
}

export function deleteLicense(id: string): boolean {
  const idx = licenses.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  licenses.splice(idx, 1);
  return true;
}

export function getRestrictedGroups(): RestrictedGroup[] {
  return [...restrictedGroups];
}

export function getRestrictedGroup(id: string): RestrictedGroup | undefined {
  return restrictedGroups.find((g) => g.id === id);
}

export function createRestrictedGroup(data: Omit<RestrictedGroup, "id" | "createdAt" | "updatedAt">): RestrictedGroup {
  const now = new Date().toISOString();
  const group: RestrictedGroup = { ...data, id: genId(), createdAt: now, updatedAt: now };
  restrictedGroups.push(group);
  return group;
}

export function updateRestrictedGroup(id: string, data: Partial<RestrictedGroup>): RestrictedGroup | null {
  const idx = restrictedGroups.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  restrictedGroups[idx] = { ...restrictedGroups[idx], ...data, updatedAt: new Date().toISOString() };
  return restrictedGroups[idx];
}

export function deleteRestrictedGroup(id: string): boolean {
  const idx = restrictedGroups.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  restrictedGroups.splice(idx, 1);
  return true;
}

export function getGroupAccessRequests(groupId?: string): GroupAccessRequest[] {
  if (groupId) return groupAccessRequests.filter((r) => r.groupId === groupId);
  return [...groupAccessRequests];
}

export function updateGroupAccessRequest(id: string, data: Partial<GroupAccessRequest>): GroupAccessRequest | null {
  const idx = groupAccessRequests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  groupAccessRequests[idx] = { ...groupAccessRequests[idx], ...data };
  return groupAccessRequests[idx];
}

export function getOnboardingTemplates(): OnboardingTemplate[] {
  return onboardingTemplates.map((t) => ({ ...t, steps: [...t.steps] }));
}

export function getOnboardingTemplate(id: string): OnboardingTemplate | undefined {
  const t = onboardingTemplates.find((t) => t.id === id);
  if (!t) return undefined;
  return { ...t, steps: [...t.steps] };
}

export function createOnboardingTemplate(data: Omit<OnboardingTemplate, "id" | "createdAt" | "updatedAt" | "steps">): OnboardingTemplate {
  const now = new Date().toISOString();
  const template: OnboardingTemplate = { ...data, id: genId(), createdAt: now, updatedAt: now, steps: [] };
  onboardingTemplates.push(template);
  return template;
}

export function getAuditLogs(filters?: { actor?: string; action?: string; limit?: number }): AuditLogEntry[] {
  let result = [...auditLogs];
  if (filters?.actor) result = result.filter((l) => l.actor === filters.actor);
  if (filters?.action) result = result.filter((l) => l.action.includes(filters.action!));
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (filters?.limit) result = result.slice(0, filters.limit);
  return result;
}

export function createAuditLog(data: Omit<AuditLogEntry, "id" | "createdAt">): AuditLogEntry {
  const entry: AuditLogEntry = { ...data, id: genId(), createdAt: new Date().toISOString() };
  auditLogs.unshift(entry);
  return entry;
}

export function getKnowledgeDocuments(): KnowledgeDocument[] {
  return [...knowledgeDocuments];
}

export function getKnowledgeDocument(id: string): KnowledgeDocument | undefined {
  return knowledgeDocuments.find((d) => d.id === id);
}

export function createKnowledgeDocument(data: Omit<KnowledgeDocument, "id" | "createdAt" | "updatedAt">): KnowledgeDocument {
  const now = new Date().toISOString();
  const doc: KnowledgeDocument = { ...data, id: genId(), createdAt: now, updatedAt: now };
  knowledgeDocuments.push(doc);
  return doc;
}

export function deleteKnowledgeDocument(id: string): boolean {
  const idx = knowledgeDocuments.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  knowledgeDocuments.splice(idx, 1);
  return true;
}

// ─── Dashboard stats ─────────────────────────────────────────

export function getDashboardStats() {
  return {
    activeLicenses: licenses.reduce((sum, l) => sum + l.usedSeats, 0),
    totalLicenseSeats: licenses.reduce((sum, l) => sum + l.totalSeats, 0),
    licenseCount: licenses.length,
    restrictedGroupCount: restrictedGroups.length,
    pendingRequests: groupAccessRequests.filter((r) => r.status === "pending").length,
    templateCount: onboardingTemplates.length,
    auditLogCount: auditLogs.length,
    knowledgeDocCount: knowledgeDocuments.length,
  };
}
