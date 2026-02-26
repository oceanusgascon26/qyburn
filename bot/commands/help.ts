/**
 * /qyburn-help command
 * Displays help text listing all available commands and capabilities.
 */

export function handleHelp(): string {
  return [
    "*Qyburn IT Self-Service Bot*",
    "",
    "I can help you with:",
    "",
    "*Slash Commands:*",
    "• `/qyburn-help` — Show this help message",
    "• `/qyburn-license <software>` — Request a software license",
    "• `/qyburn-groups` — List restricted groups and request access",
    "• `/qyburn-status` — Check the status of your pending requests",
    "",
    "*Natural Language:*",
    "Just DM me or mention @Qyburn with your request. I can help with:",
    "• Software license requests and questions",
    "• Azure AD group access requests",
    "• VPN setup and network questions",
    "• Password resets and account issues",
    "• General IT questions (powered by knowledge base)",
    "• New employee onboarding",
    "",
    "_Powered by SAGA Diagnostics IT_",
  ].join("\n");
}
