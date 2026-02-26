/**
 * /qyburn-groups command
 * Lists restricted groups and handles access requests.
 */

import { getRestrictedGroups, getGroupAccessRequests } from "../../src/lib/mock-data";

export interface GroupsCommandResult {
  text: string;
  action?: "list" | "requested" | "already_pending";
}

export async function handleGroupsCommand(
  userEmail: string,
  groupName?: string
): Promise<GroupsCommandResult> {
  const groups = getRestrictedGroups();
  const requests = getGroupAccessRequests();

  // List all restricted groups
  if (!groupName || groupName.trim() === "") {
    const groupList = groups
      .map((g) => {
        const pendingCount = requests.filter(
          (r) => r.groupId === g.id && r.status === "pending"
        ).length;
        const pending = pendingCount > 0 ? ` (${pendingCount} pending)` : "";
        return `• *${g.displayName}*${pending}\n  ${g.description ?? "No description"}\n  Approver: ${g.approverEmail}`;
      })
      .join("\n\n");

    return {
      text: `*Restricted Groups (require approval):*\n\n${groupList}\n\nTo request access: \`/qyburn-groups <group name>\``,
      action: "list",
    };
  }

  // Find matching group
  const query = groupName.toLowerCase();
  const group = groups.find((g) =>
    g.displayName.toLowerCase().includes(query)
  );

  if (!group) {
    return {
      text: `No restricted group matching "${groupName}" found. Use \`/qyburn-groups\` to see all groups.`,
    };
  }

  // Check for existing pending request
  const existing = requests.find(
    (r) =>
      r.groupId === group.id &&
      r.requesterEmail === userEmail &&
      r.status === "pending"
  );

  if (existing) {
    return {
      text: `You already have a pending request for *${group.displayName}*. :hourglass_flowing_sand:\n\nSubmitted: ${new Date(existing.createdAt).toLocaleString()}\nApprover: ${group.approverEmail}\n\nPlease wait for the approver to review your request.`,
      action: "already_pending",
    };
  }

  // Submit new request
  const justificationNote = group.requiresJustification
    ? "\n\n:memo: *Justification required.* Please reply with your reason for needing access."
    : "";

  return {
    text: `Your access request for *${group.displayName}* has been submitted! :envelope:\n\nApprover: ${group.approverEmail}\nGroup: ${group.azureGroupId}${justificationNote}`,
    action: "requested",
  };
}
