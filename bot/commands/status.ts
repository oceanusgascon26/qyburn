/**
 * /qyburn-status command
 * Shows the user their pending requests.
 */

import { getGroupAccessRequests } from "../../src/lib/mock-data";

export async function handleStatusCommand(userEmail: string): Promise<string> {
  const requests = getGroupAccessRequests();
  const userRequests = requests.filter((r) => r.requesterEmail === userEmail);

  if (userRequests.length === 0) {
    return "You have no pending or recent requests. :sparkles:\n\nNeed something? Try:\n• `/qyburn-license` — Request software\n• `/qyburn-groups` — Request group access";
  }

  const statusEmoji: Record<string, string> = {
    pending: ":hourglass_flowing_sand:",
    approved: ":white_check_mark:",
    denied: ":x:",
  };

  const lines = userRequests.map((r) => {
    const emoji = statusEmoji[r.status] ?? ":question:";
    const date = new Date(r.createdAt).toLocaleDateString();
    return `${emoji} *Group: ${r.groupId}* — ${r.status} (${date})`;
  });

  return `*Your Requests:*\n\n${lines.join("\n")}`;
}
