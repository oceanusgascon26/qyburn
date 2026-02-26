import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Licenses ──────────────────────────────────────
  const m365 = await prisma.license.upsert({
    where: { id: "lic-001" },
    update: {},
    create: {
      id: "lic-001",
      name: "Microsoft 365 E3",
      vendor: "Microsoft",
      sku: "M365-E3",
      totalSeats: 200,
      usedSeats: 156,
      costPerSeat: 36.0,
      autoApprove: true,
      description:
        "Standard Microsoft 365 enterprise license with Office apps, Teams, and Exchange.",
    },
  });

  const adobe = await prisma.license.upsert({
    where: { id: "lic-002" },
    update: {},
    create: {
      id: "lic-002",
      name: "Adobe Creative Cloud",
      vendor: "Adobe",
      sku: "ACC-ALL",
      totalSeats: 30,
      usedSeats: 24,
      costPerSeat: 82.99,
      autoApprove: false,
      description:
        "Full Adobe Creative Cloud suite. Requires manager approval due to cost.",
    },
  });

  const jetbrains = await prisma.license.upsert({
    where: { id: "lic-003" },
    update: {},
    create: {
      id: "lic-003",
      name: "JetBrains All Products",
      vendor: "JetBrains",
      sku: "JB-ALL",
      totalSeats: 50,
      usedSeats: 38,
      costPerSeat: 24.9,
      autoApprove: true,
      description:
        "JetBrains IDE pack for engineering team. Auto-approved for engineering dept.",
    },
  });

  await prisma.license.upsert({
    where: { id: "lic-004" },
    update: {},
    create: {
      id: "lic-004",
      name: "Slack Pro",
      vendor: "Slack",
      sku: "SLACK-PRO",
      totalSeats: 200,
      usedSeats: 156,
      costPerSeat: 8.75,
      autoApprove: true,
      description: "Slack Pro workspace seat. Auto-provisioned for all employees.",
    },
  });

  await prisma.license.upsert({
    where: { id: "lic-005" },
    update: {},
    create: {
      id: "lic-005",
      name: "Figma Organization",
      vendor: "Figma",
      sku: "FIGMA-ORG",
      totalSeats: 20,
      usedSeats: 15,
      costPerSeat: 45.0,
      autoApprove: false,
      description:
        "Figma design tool. Requires approval for non-design team members.",
    },
  });

  // ─── Restricted Groups ─────────────────────────────
  const engGroup = await prisma.restrictedGroup.upsert({
    where: { azureGroupId: "group-001" },
    update: {},
    create: {
      id: "rg-001",
      azureGroupId: "group-001",
      displayName: "SG-Engineering-Admin",
      description:
        "Full admin access to engineering infrastructure. Requires VP approval.",
      approverEmail: "vp.engineering@saga.com",
      requiresJustification: true,
    },
  });

  const labGroup = await prisma.restrictedGroup.upsert({
    where: { azureGroupId: "group-lab-admin" },
    update: {},
    create: {
      id: "rg-002",
      azureGroupId: "group-lab-admin",
      displayName: "SG-Lab-Instruments-Admin",
      description: "Admin access to lab instrument control systems.",
      approverEmail: "lab.director@saga.com",
      requiresJustification: true,
    },
  });

  await prisma.restrictedGroup.upsert({
    where: { azureGroupId: "group-finance" },
    update: {},
    create: {
      id: "rg-003",
      azureGroupId: "group-finance",
      displayName: "SG-Finance-Sensitive",
      description: "Access to financial reporting and sensitive data.",
      approverEmail: "cfo@saga.com",
      requiresJustification: true,
    },
  });

  // ─── Group Access Requests ─────────────────────────
  await prisma.groupAccessRequest.upsert({
    where: { id: "gar-001" },
    update: {},
    create: {
      id: "gar-001",
      groupId: "rg-001",
      requesterId: "user-004",
      requesterEmail: "james.patel@saga.com",
      justification:
        "Need admin access to deploy ML pipeline to production Kubernetes cluster.",
      status: "pending",
    },
  });

  await prisma.groupAccessRequest.upsert({
    where: { id: "gar-002" },
    update: {},
    create: {
      id: "gar-002",
      groupId: "rg-002",
      requesterId: "user-001",
      requesterEmail: "anna.lindberg@saga.com",
      justification:
        "Calibrating new sequencing instrument requires admin access.",
      status: "approved",
      reviewedBy: "lab.director@saga.com",
      reviewedAt: new Date("2025-02-25T14:00:00Z"),
    },
  });

  // ─── Onboarding Templates ─────────────────────────
  const engTemplate = await prisma.onboardingTemplate.upsert({
    where: { id: "ot-001" },
    update: {},
    create: {
      id: "ot-001",
      name: "Engineering New Hire",
      department: "Engineering",
      description:
        "Standard onboarding for software engineers — dev tools, repos, and team channels.",
      isActive: true,
    },
  });

  await prisma.onboardingStep.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "os-001",
        templateId: "ot-001",
        order: 1,
        title: "Provision Microsoft 365 E3",
        description: "Auto-assign M365 license",
        type: "license",
        config: '{"licenseId":"lic-001"}',
      },
      {
        id: "os-002",
        templateId: "ot-001",
        order: 2,
        title: "Provision JetBrains License",
        description: "Auto-assign JetBrains All Products",
        type: "license",
        config: '{"licenseId":"lic-003"}',
      },
      {
        id: "os-003",
        templateId: "ot-001",
        order: 3,
        title: "Add to VPN Users",
        description: "Add to SG-VPN-Users group",
        type: "group",
        config: '{"groupId":"group-003"}',
      },
      {
        id: "os-004",
        templateId: "ot-001",
        order: 4,
        title: "Send Welcome Message",
        description: "DM the new hire in Slack with getting-started info",
        type: "message",
        config: '{"template":"welcome_engineering"}',
      },
    ],
  });

  const labTemplate = await prisma.onboardingTemplate.upsert({
    where: { id: "ot-002" },
    update: {},
    create: {
      id: "ot-002",
      name: "Lab Technician Onboarding",
      department: "Diagnostics",
      description:
        "Onboarding for lab staff — instruments, safety training, and lab systems.",
      isActive: true,
    },
  });

  await prisma.onboardingStep.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "os-005",
        templateId: "ot-002",
        order: 1,
        title: "Provision Microsoft 365 E3",
        type: "license",
        config: '{"licenseId":"lic-001"}',
      },
      {
        id: "os-006",
        templateId: "ot-002",
        order: 2,
        title: "Add to Lab Users Group",
        type: "group",
        config: '{"groupId":"group-002"}',
      },
      {
        id: "os-007",
        templateId: "ot-002",
        order: 3,
        title: "Complete Safety Training",
        description: "Must complete before lab access is granted",
        type: "custom",
        config: '{"url":"https://training.saga.com/lab-safety"}',
      },
    ],
  });

  // ─── Audit Logs ────────────────────────────────────
  await prisma.auditLog.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "al-001",
        actor: "qyburn-bot",
        action: "license.assign",
        target: "Microsoft 365 E3",
        targetId: "lic-001",
        details: '{"userId":"user-001","email":"anna.lindberg@saga.com"}',
        channel: "#it-support",
      },
      {
        id: "al-002",
        actor: "qyburn-bot",
        action: "license.assign",
        target: "JetBrains All Products",
        targetId: "lic-003",
        details: '{"userId":"user-002","email":"erik.svensson@saga.com"}',
        channel: "#it-support",
      },
      {
        id: "al-003",
        actor: "james.patel@saga.com",
        action: "group.request",
        target: "SG-Engineering-Admin",
        targetId: "rg-001",
        details: '{"justification":"Need admin access to deploy ML pipeline"}',
        channel: "#it-support",
      },
      {
        id: "al-004",
        actor: "lab.director@saga.com",
        action: "group.approve",
        target: "SG-Lab-Instruments-Admin",
        targetId: "rg-002",
        details: '{"requesterId":"user-001"}',
      },
      {
        id: "al-005",
        actor: "qyburn-bot",
        action: "kb.query",
        target: "VPN setup",
        details: '{"user":"maria.chen@saga.com","resolved":true}',
        channel: "#it-support",
      },
    ],
  });

  // ─── Knowledge Documents ───────────────────────────
  await prisma.knowledgeDocument.upsert({
    where: { id: "kd-001" },
    update: {},
    create: {
      id: "kd-001",
      title: "VPN Setup Guide",
      content:
        "# VPN Setup Guide\n\n## Prerequisites\n- SAGA corporate laptop\n- Active directory account\n- VPN group membership (SG-VPN-Users)\n\n## Steps\n1. Download the SAGA VPN client from the software portal\n2. Install and launch the application\n3. Enter your corporate email and password\n4. Select the nearest gateway (EU-West for Sweden office)\n5. Click Connect",
      category: "Network",
      tags: ["vpn", "remote-access", "network"],
    },
  });

  await prisma.knowledgeDocument.upsert({
    where: { id: "kd-002" },
    update: {},
    create: {
      id: "kd-002",
      title: "Password Reset Policy",
      content:
        "# Password Reset Policy\n\n## Self-Service Reset\nEmployees can reset their own passwords at https://passwordreset.saga.com\n\n## Requirements\n- Minimum 12 characters\n- Must include uppercase, lowercase, number, and special character\n- Cannot reuse last 10 passwords\n- Must be changed every 90 days",
      category: "Security",
      tags: ["password", "security", "account"],
    },
  });

  await prisma.knowledgeDocument.upsert({
    where: { id: "kd-003" },
    update: {},
    create: {
      id: "kd-003",
      title: "Software Request Process",
      content:
        "# Software Request Process\n\n## Auto-Approved Software\n- Microsoft 365 E3\n- JetBrains All Products (Engineering dept only)\n- Slack Pro\n\n## Approval Required\n- Adobe Creative Cloud (manager approval)\n- Figma Organization (design lead approval)",
      category: "Software",
      tags: ["software", "license", "request"],
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
