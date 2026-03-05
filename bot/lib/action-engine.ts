/**
 * Action Engine — Autonomous action execution for IT operations.
 *
 * Handles license provisioning/revocation, group membership,
 * onboarding/offboarding workflows, and password operations.
 * Each action creates audit logs, emits real-time SSE events,
 * returns rollback info, and wraps in try-catch with clear errors.
 */

import {
  licenses,
  licenseAssignments,
  restrictedGroups,
  groupAccessRequests,
  onboardingTemplates,
  createAuditLog,
  getLicense,
  getOnboardingTemplate,
  type LicenseAssignment,
  type GroupAccessRequest,
} from "../../src/lib/mock-data";
import { graphClient } from "../../src/lib/stubs/graph";
import { emitSSE } from "../../src/lib/sse";

// ─── Types ───────────────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  action: string;
  details: string;
  rollbackable: boolean;
  rollbackSteps?: string[];
  auditId: string;
}

export interface StepResult {
  step: string;
  success: boolean;
  error?: string;
  actionResult?: ActionResult;
}

export interface OnboardingResult {
  completed: number;
  failed: number;
  steps: StepResult[];
}

export interface OffboardingResult {
  completed: number;
  failed: number;
  steps: StepResult[];
}

export interface LicenseAvailability {
  available: boolean;
  seatsRemaining: number;
  waitlist?: number;
}

// ─── Helpers ─────────────────────────────────────────────────

let actionIdCounter = 0;

function genAuditId(): string {
  return `action-${++actionIdCounter}-${Date.now()}`;
}

function logAndEmit(
  actor: string,
  action: string,
  target: string,
  targetId: string | null,
  details: Record<string, unknown>
): string {
  const entry = createAuditLog({
    actor,
    action,
    target,
    targetId,
    details: JSON.stringify(details),
    channel: null,
  });

  emitSSE({
    type: "audit",
    data: { action, target, details, timestamp: new Date().toISOString() },
  });

  return entry.id;
}

// ─── License Actions ─────────────────────────────────────────

/**
 * Provision a license to a user.
 * Updates seat count, creates assignment record, stubs Graph API call.
 */
export async function provisionLicense(
  userId: string,
  licenseId: string,
  approvedBy: string
): Promise<ActionResult> {
  const auditId = genAuditId();

  try {
    const license = licenses.find((l) => l.id === licenseId);
    if (!license) {
      return {
        success: false,
        action: "license.provision",
        details: `License ${licenseId} not found`,
        rollbackable: false,
        auditId,
      };
    }

    if (license.usedSeats >= license.totalSeats) {
      return {
        success: false,
        action: "license.provision",
        details: `No available seats for ${license.name} (${license.usedSeats}/${license.totalSeats})`,
        rollbackable: false,
        auditId,
      };
    }

    // Check if already assigned
    const existingAssignment = licenseAssignments.find(
      (a) => a.licenseId === licenseId && a.userId === userId
    );
    if (existingAssignment) {
      return {
        success: false,
        action: "license.provision",
        details: `User ${userId} already has ${license.name} assigned`,
        rollbackable: false,
        auditId,
      };
    }

    // Increment used seats
    license.usedSeats++;
    license.updatedAt = new Date().toISOString();

    // Create assignment record
    const assignment: LicenseAssignment = {
      id: `la-${Date.now()}`,
      licenseId,
      userId,
      userEmail: `${userId}@saga.com`,
      assignedAt: new Date().toISOString(),
      assignedBy: approvedBy,
    };
    licenseAssignments.push(assignment);

    // Stub: Call Graph API to actually assign in M365
    if (license.sku) {
      await graphClient.assignLicense(userId, license.sku);
    }

    // Audit log
    logAndEmit("qyburn-bot", "license.provision", license.name, licenseId, {
      userId,
      approvedBy,
      seatsRemaining: license.totalSeats - license.usedSeats,
    });

    return {
      success: true,
      action: "license.provision",
      details: `Provisioned ${license.name} to user ${userId}. Seats: ${license.usedSeats}/${license.totalSeats}`,
      rollbackable: true,
      rollbackSteps: [
        `Revoke license ${licenseId} from user ${userId}`,
        `Decrement seat count for ${license.name}`,
      ],
      auditId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logAndEmit("qyburn-bot", "license.provision.error", licenseId, null, {
      userId,
      error: message,
    });
    return {
      success: false,
      action: "license.provision",
      details: `Failed to provision license: ${message}`,
      rollbackable: false,
      auditId,
    };
  }
}

/**
 * Revoke a license from a user.
 */
export async function revokeLicense(
  userId: string,
  licenseId: string,
  reason: string
): Promise<ActionResult> {
  const auditId = genAuditId();

  try {
    const license = licenses.find((l) => l.id === licenseId);
    if (!license) {
      return {
        success: false,
        action: "license.revoke",
        details: `License ${licenseId} not found`,
        rollbackable: false,
        auditId,
      };
    }

    // Find and remove assignment
    const assignmentIdx = licenseAssignments.findIndex(
      (a) => a.licenseId === licenseId && a.userId === userId
    );
    if (assignmentIdx === -1) {
      return {
        success: false,
        action: "license.revoke",
        details: `No assignment found for user ${userId} on ${license.name}`,
        rollbackable: false,
        auditId,
      };
    }

    licenseAssignments.splice(assignmentIdx, 1);

    // Decrement seat count
    license.usedSeats = Math.max(0, license.usedSeats - 1);
    license.updatedAt = new Date().toISOString();

    // Stub: Graph API revocation
    if (license.sku) {
      await graphClient.revokeLicense(userId, license.sku);
    }

    logAndEmit("qyburn-bot", "license.revoke", license.name, licenseId, {
      userId,
      reason,
      seatsRemaining: license.totalSeats - license.usedSeats,
    });

    return {
      success: true,
      action: "license.revoke",
      details: `Revoked ${license.name} from user ${userId}. Reason: ${reason}`,
      rollbackable: true,
      rollbackSteps: [
        `Re-provision license ${licenseId} to user ${userId}`,
      ],
      auditId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logAndEmit("qyburn-bot", "license.revoke.error", licenseId, null, {
      userId,
      error: message,
    });
    return {
      success: false,
      action: "license.revoke",
      details: `Failed to revoke license: ${message}`,
      rollbackable: false,
      auditId,
    };
  }
}

/**
 * Check license seat availability.
 */
export function checkLicenseAvailability(
  licenseId: string
): LicenseAvailability {
  const license = licenses.find((l) => l.id === licenseId);
  if (!license) {
    return { available: false, seatsRemaining: 0 };
  }

  const remaining = license.totalSeats - license.usedSeats;
  return {
    available: remaining > 0,
    seatsRemaining: remaining,
  };
}

// ─── Group Actions ───────────────────────────────────────────

/**
 * Add a user to an Azure AD group.
 */
export async function addToGroup(
  userId: string,
  groupId: string,
  approvedBy: string
): Promise<ActionResult> {
  const auditId = genAuditId();

  try {
    // Stub: Graph API to add user to group
    const success = await graphClient.addUserToGroup(userId, groupId);
    if (!success) {
      return {
        success: false,
        action: "group.add",
        details: `Failed to add user ${userId} to group ${groupId} — group not found`,
        rollbackable: false,
        auditId,
      };
    }

    // Update any pending group access request
    const request = groupAccessRequests.find(
      (r) =>
        r.requesterId === userId &&
        r.status === "pending" &&
        restrictedGroups.some(
          (g) => g.id === r.groupId && g.azureGroupId === groupId
        )
    );
    if (request) {
      request.status = "approved";
      request.reviewedBy = approvedBy;
      request.reviewedAt = new Date().toISOString();
    }

    const group = await graphClient.getGroup(groupId);
    const groupName = group?.displayName ?? groupId;

    logAndEmit("qyburn-bot", "group.add", groupName, groupId, {
      userId,
      approvedBy,
    });

    return {
      success: true,
      action: "group.add",
      details: `Added user ${userId} to group ${groupName}`,
      rollbackable: true,
      rollbackSteps: [`Remove user ${userId} from group ${groupId}`],
      auditId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logAndEmit("qyburn-bot", "group.add.error", groupId, null, {
      userId,
      error: message,
    });
    return {
      success: false,
      action: "group.add",
      details: `Failed to add to group: ${message}`,
      rollbackable: false,
      auditId,
    };
  }
}

/**
 * Remove a user from an Azure AD group.
 */
export async function removeFromGroup(
  userId: string,
  groupId: string,
  reason: string
): Promise<ActionResult> {
  const auditId = genAuditId();

  try {
    const success = await graphClient.removeUserFromGroup(userId, groupId);
    if (!success) {
      return {
        success: false,
        action: "group.remove",
        details: `Failed to remove user ${userId} from group ${groupId}`,
        rollbackable: false,
        auditId,
      };
    }

    const group = await graphClient.getGroup(groupId);
    const groupName = group?.displayName ?? groupId;

    logAndEmit("qyburn-bot", "group.remove", groupName, groupId, {
      userId,
      reason,
    });

    return {
      success: true,
      action: "group.remove",
      details: `Removed user ${userId} from group ${groupName}. Reason: ${reason}`,
      rollbackable: true,
      rollbackSteps: [`Re-add user ${userId} to group ${groupId}`],
      auditId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logAndEmit("qyburn-bot", "group.remove.error", groupId, null, {
      userId,
      error: message,
    });
    return {
      success: false,
      action: "group.remove",
      details: `Failed to remove from group: ${message}`,
      rollbackable: false,
      auditId,
    };
  }
}

/**
 * Check if a user is a member of a group.
 */
export async function checkGroupMembership(
  userId: string,
  groupId: string
): Promise<{ isMember: boolean; groupName: string }> {
  const group = await graphClient.getGroup(groupId);
  if (!group) {
    return { isMember: false, groupName: groupId };
  }

  return {
    isMember: group.members.includes(userId),
    groupName: group.displayName,
  };
}

// ─── Onboarding Actions ─────────────────────────────────────

/**
 * Execute all steps of an onboarding template for a new hire.
 * Continues past failures — logs and moves on.
 */
export async function executeOnboarding(
  templateId: string,
  newHire: {
    name: string;
    email: string;
    department: string;
    startDate: string;
  }
): Promise<OnboardingResult> {
  const template = getOnboardingTemplate(templateId);
  if (!template) {
    return {
      completed: 0,
      failed: 1,
      steps: [
        {
          step: "Load template",
          success: false,
          error: `Onboarding template ${templateId} not found`,
        },
      ],
    };
  }

  logAndEmit("qyburn-bot", "onboarding.start", template.name, templateId, {
    newHire,
  });

  const userId = `user-${Date.now()}`;
  const stepResults: StepResult[] = [];
  let completed = 0;
  let failed = 0;

  for (const step of template.steps) {
    let config: Record<string, string> = {};
    try {
      config = step.config ? JSON.parse(step.config) : {};
    } catch {
      // Invalid config JSON
    }

    try {
      switch (step.type) {
        case "license": {
          const licenseId = config.licenseId;
          if (!licenseId) {
            stepResults.push({
              step: step.title,
              success: false,
              error: "No licenseId in step config",
            });
            failed++;
            continue;
          }
          const result = await provisionLicense(
            userId,
            licenseId,
            "qyburn-onboarding"
          );
          stepResults.push({
            step: step.title,
            success: result.success,
            error: result.success ? undefined : result.details,
            actionResult: result,
          });
          if (result.success) completed++;
          else failed++;
          break;
        }

        case "group": {
          const groupId = config.groupId;
          if (!groupId) {
            stepResults.push({
              step: step.title,
              success: false,
              error: "No groupId in step config",
            });
            failed++;
            continue;
          }
          const result = await addToGroup(
            userId,
            groupId,
            "qyburn-onboarding"
          );
          stepResults.push({
            step: step.title,
            success: result.success,
            error: result.success ? undefined : result.details,
            actionResult: result,
          });
          if (result.success) completed++;
          else failed++;
          break;
        }

        case "message": {
          // Stub: Send welcome message via Slack
          console.log(
            `[ACTION] Stub: Send welcome message to ${newHire.email} — template: ${config.template ?? "default"}`
          );
          stepResults.push({
            step: step.title,
            success: true,
          });
          completed++;
          break;
        }

        case "custom": {
          // Stub: Custom step — log and mark as pending manual action
          console.log(
            `[ACTION] Custom step "${step.title}" — URL: ${config.url ?? "none"}`
          );
          stepResults.push({
            step: step.title,
            success: true,
          });
          completed++;
          break;
        }

        default: {
          stepResults.push({
            step: step.title,
            success: false,
            error: `Unknown step type: ${step.type}`,
          });
          failed++;
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      stepResults.push({
        step: step.title,
        success: false,
        error: message,
      });
      failed++;
    }
  }

  logAndEmit(
    "qyburn-bot",
    "onboarding.complete",
    template.name,
    templateId,
    {
      newHire,
      completed,
      failed,
      totalSteps: template.steps.length,
    }
  );

  return { completed, failed, steps: stepResults };
}

// ─── Offboarding Actions ─────────────────────────────────────

/**
 * Execute offboarding for a departing user.
 * Revokes licenses, removes from groups, stubs account disable.
 */
export async function executeOffboarding(
  userId: string,
  userEmail: string,
  options: {
    revokeAllLicenses: boolean;
    removeFromGroups: boolean;
    disableAccount: boolean;
    transferMailbox?: string;
  }
): Promise<OffboardingResult> {
  logAndEmit("qyburn-bot", "offboarding.start", userEmail, userId, {
    options,
  });

  const stepResults: StepResult[] = [];
  let completed = 0;
  let failed = 0;

  // Revoke all licenses
  if (options.revokeAllLicenses) {
    const userAssignments = licenseAssignments.filter(
      (a) => a.userId === userId
    );

    for (const assignment of userAssignments) {
      const result = await revokeLicense(
        userId,
        assignment.licenseId,
        "offboarding"
      );
      const license = getLicense(assignment.licenseId);
      stepResults.push({
        step: `Revoke ${license?.name ?? assignment.licenseId}`,
        success: result.success,
        error: result.success ? undefined : result.details,
        actionResult: result,
      });
      if (result.success) completed++;
      else failed++;
    }

    if (userAssignments.length === 0) {
      stepResults.push({
        step: "Revoke licenses",
        success: true,
      });
      completed++;
    }
  }

  // Remove from all restricted groups
  if (options.removeFromGroups) {
    const groups = await graphClient.listGroups();

    for (const group of groups) {
      if (group.members.includes(userId)) {
        const result = await removeFromGroup(
          userId,
          group.id,
          "offboarding"
        );
        stepResults.push({
          step: `Remove from ${group.displayName}`,
          success: result.success,
          error: result.success ? undefined : result.details,
          actionResult: result,
        });
        if (result.success) completed++;
        else failed++;
      }
    }
  }

  // Stub: Disable Azure AD account
  if (options.disableAccount) {
    console.log(
      `[ACTION] Stub: Disable Azure AD account for ${userEmail}`
    );
    logAndEmit("qyburn-bot", "account.disable", userEmail, userId, {
      stub: true,
    });
    stepResults.push({
      step: "Disable Azure AD account",
      success: true,
    });
    completed++;
  }

  // Stub: Transfer mailbox
  if (options.transferMailbox) {
    console.log(
      `[ACTION] Stub: Transfer mailbox from ${userEmail} to ${options.transferMailbox}`
    );
    logAndEmit("qyburn-bot", "mailbox.transfer", userEmail, userId, {
      transferTo: options.transferMailbox,
      stub: true,
    });
    stepResults.push({
      step: `Transfer mailbox to ${options.transferMailbox}`,
      success: true,
    });
    completed++;
  }

  logAndEmit(
    "qyburn-bot",
    "offboarding.complete",
    userEmail,
    userId,
    {
      completed,
      failed,
      totalSteps: stepResults.length,
    }
  );

  return { completed, failed, steps: stepResults };
}

// ─── Password Actions ────────────────────────────────────────

/**
 * Initiate a password reset for a user.
 * Stub: In production, calls Graph API to send a reset link.
 */
export async function initiatePasswordReset(
  userEmail: string
): Promise<ActionResult> {
  const auditId = genAuditId();

  try {
    // Stub: Graph API password reset
    console.log(
      `[ACTION] Stub: Sending password reset link to ${userEmail} via Graph API`
    );

    logAndEmit("qyburn-bot", "password.reset", userEmail, null, {
      method: "email_link",
      stub: true,
    });

    return {
      success: true,
      action: "password.reset",
      details: `Password reset link sent to ${userEmail}. The link expires in 24 hours.`,
      rollbackable: false,
      auditId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logAndEmit("qyburn-bot", "password.reset.error", userEmail, null, {
      error: message,
    });
    return {
      success: false,
      action: "password.reset",
      details: `Failed to initiate password reset: ${message}`,
      rollbackable: false,
      auditId,
    };
  }
}

/**
 * Check if an account is locked.
 * Stub: In production, calls Graph API to check sign-in activity.
 */
export async function checkAccountLockStatus(
  userEmail: string
): Promise<{
  locked: boolean;
  reason?: string;
  lockedSince?: string;
}> {
  console.log(
    `[ACTION] Stub: Checking lock status for ${userEmail} via Graph API`
  );

  // Stub: always return unlocked
  return {
    locked: false,
    reason: undefined,
    lockedSince: undefined,
  };
}
