/**
 * Qyburn Slack Bot — Entry Point
 *
 * Runs as a separate process from the Next.js dashboard.
 * Uses Socket Mode (no public endpoint needed).
 *
 * In stub mode, this simulates the bot without real Slack credentials.
 */

import { slackClient } from "../src/lib/stubs/slack";
import { handleHelp } from "./commands/help";
import { handleLicenseCommand } from "./commands/license";
import { handleGroupsCommand } from "./commands/groups";
import { handleStatusCommand } from "./commands/status";
import { handleConversation } from "./handlers/conversation";

const BANNER = `
╔══════════════════════════════════════════════════╗
║            🔥 QYBURN BOT v0.1.0 🔥              ║
║     IT Self-Service Bot — SAGA Diagnostics       ║
║           Mode: Stub (No Real APIs)              ║
╚══════════════════════════════════════════════════╝
`;

// ─── Command Router ──────────────────────────────────────────

interface SlashCommand {
  command: string;
  args: string;
  userEmail: string;
  channel: string;
}

async function routeCommand(cmd: SlashCommand): Promise<string> {
  switch (cmd.command) {
    case "/qyburn-help":
      return handleHelp();

    case "/qyburn-license": {
      const result = await handleLicenseCommand(cmd.userEmail, cmd.args);
      return result.text;
    }

    case "/qyburn-groups": {
      const result = await handleGroupsCommand(cmd.userEmail, cmd.args);
      return result.text;
    }

    case "/qyburn-status":
      return handleStatusCommand(cmd.userEmail);

    default:
      return `Unknown command: ${cmd.command}. Try \`/qyburn-help\` for available commands.`;
  }
}

// ─── Simulation ──────────────────────────────────────────────

async function simulateSlashCommands() {
  console.log("═══ Slash Command Simulation ═══\n");

  const commands: SlashCommand[] = [
    {
      command: "/qyburn-help",
      args: "",
      userEmail: "anna.lindberg@saga.com",
      channel: "#it-support",
    },
    {
      command: "/qyburn-license",
      args: "",
      userEmail: "erik.svensson@saga.com",
      channel: "#it-support",
    },
    {
      command: "/qyburn-license",
      args: "JetBrains",
      userEmail: "erik.svensson@saga.com",
      channel: "#it-support",
    },
    {
      command: "/qyburn-groups",
      args: "",
      userEmail: "james.patel@saga.com",
      channel: "#it-support",
    },
    {
      command: "/qyburn-groups",
      args: "Engineering-Admin",
      userEmail: "james.patel@saga.com",
      channel: "#it-support",
    },
    {
      command: "/qyburn-status",
      args: "",
      userEmail: "james.patel@saga.com",
      channel: "#it-support",
    },
  ];

  for (const cmd of commands) {
    console.log(`\n[CMD] ${cmd.userEmail} → ${cmd.command} ${cmd.args}`);
    console.log("─".repeat(50));
    const response = await routeCommand(cmd);
    // Strip Slack markdown for readable console output
    const clean = response.replace(/\*/g, "").replace(/`/g, "");
    console.log(clean);
    await slackClient.postMessage(cmd.channel, response);
  }
}

async function simulateConversations() {
  console.log("\n\n═══ Conversation Simulation ═══\n");

  const conversations = [
    {
      user: "anna.lindberg@saga.com",
      message: "How do I connect to the VPN from home?",
      channel: "#it-support",
    },
    {
      user: "erik.svensson@saga.com",
      message: "I need a license for some development software",
      channel: "DM",
    },
    {
      user: "maria.chen@saga.com",
      message:
        "We have a new team member starting Monday, can you help with onboarding?",
      channel: "#it-admin",
    },
    {
      user: "james.patel@saga.com",
      message: "My password is about to expire, what should I do?",
      channel: "DM",
    },
  ];

  for (const conv of conversations) {
    console.log(`\n[${conv.channel}] ${conv.user}: ${conv.message}`);
    console.log("─".repeat(50));
    const result = await handleConversation(
      conv.user,
      conv.message,
      conv.channel
    );
    console.log(`[Qyburn] (intent: ${result.intent}, resolved: ${result.resolved})`);
    console.log(result.response);
    await slackClient.postMessage(
      conv.channel === "DM" ? conv.user : conv.channel,
      result.response
    );
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log(BANNER);
  console.log("[BOT] Starting in STUB mode");
  console.log("[BOT] Integrations: Graph=stub, AI=stub, Slack=stub\n");

  // Simulate slash commands
  await simulateSlashCommands();

  // Simulate natural language conversations
  await simulateConversations();

  // Summary
  const log = slackClient.getMessageLog();
  console.log("\n\n═══ Summary ═══");
  console.log(`Total messages sent: ${log.length}`);
  console.log(
    `Channels used: ${[...new Set(log.map((m) => m.channel))].join(", ")}`
  );
  console.log("\n[BOT] Stub simulation complete.");
  console.log(
    "[BOT] In production, this would connect via Socket Mode and listen for real events."
  );
}

main().catch(console.error);
