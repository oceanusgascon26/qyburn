/**
 * Automated Access Review — Year 3 Q4 Autonomous Operations.
 *
 * Quarterly access reviews: identify group members, send review
 * requests to owners, process keep/revoke decisions, track stats.
 */

import { removeFromGroup } from "./action-engine";
import {
  restrictedGroups,
  createAuditLog,
} from "../../src/lib/mock-data";
import { graphClient } from "../../src/lib/stubs/graph";

// ─── Types ───────────────────────────────────────────────────

export interface AccessReviewMember {
  userId: string;
  email: string;
  addedAt: Date;
  lastActive?: Date;
  decision?: "keep" | "revoke";
  decidedAt?: Date;
}

export interface AccessReview {
  id: string;
  groupId: string;
  groupName: string;
  reviewerId: string;
  reviewerEmail: string;
  members: AccessReviewMember[];
  status: "pending" | "in_progress" | "completed";
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface ReviewStats {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  overdueReviews: number;
  completionRate: number;
  avgRevocationRate: number;
  totalMembersReviewed: number;
  totalRevocations: number;
}

// ─── In-Memory Store ────────────────────────────────────────

const accessReviews: AccessReview[] = [
  {
    id: "ar-001",
    groupId: "group-001",
    groupName: "SG-Engineering-Admin",
    reviewerId: "user-vp-eng",
    reviewerEmail: "vp.engineering@saga.com",
    members: [
      {
        userId: "user-002",
        email: "erik.svensson@saga.com",
        addedAt: new Date("2024-07-01"),
        lastActive: new Date("2025-02-25"),
        decision: "keep",
        decidedAt: new Date("2025-02-20"),
      },
      {
        userId: "user-005",
        email: "old.engineer@saga.com",
        addedAt: new Date("2024-03-01"),
        lastActive: new Date("2024-10-15"),
        decision: "revoke",
        decidedAt: new Date("2025-02-20"),
      },
    ],
    status: "completed",
    dueDate: new Date("2025-02-28"),
    createdAt: new Date("2025-02-14"),
    completedAt: new Date("2025-02-20"),
  },
  {
    id: "ar-002",
    groupId: "group-finance",
    groupName: "SG-Finance-Sensitive",
    reviewerId: "user-cfo",
    reviewerEmail: "cfo@saga.com",
    members: [
      {
        userId: "user-006",
        email: "finance.analyst@saga.com",
        addedAt: new Date("2024-09-01"),
        lastActive: new Date("2025-02-26"),
      },
      {
        userId: "user-007",
        email: "temp.contractor@saga.com",
        addedAt: new Date("2024-11-01"),
        lastActive: new Date("2025-01-15"),
      },
    ],
    status: "pending",
    dueDate: new Date("2025-03-15"),
    createdAt: new Date("2025-03-01"),
  },
];

// ─── Functions ───────────────────────────────────────────────

/**
 * Initiate an access review for a group.
 * Gets all members, identifies the reviewer, and sends notification.
 */
export async function initiateAccessReview(
  groupId: string
): Promise<{ success: boolean; review?: AccessReview; error?: string }> {
  try {
    // Look up group details
    const group = await graphClient.getGroup(groupId);
    if (!group) {
      return { success: false, error: `Group ${groupId} not found` };
    }

    // Find the approver (reviewer) from restricted groups config
    const restrictedGroup = restrictedGroups.find(
      (g) => g.azureGroupId === groupId
    );
    const reviewerEmail =
      restrictedGroup?.approverEmail ?? "it-admin@saga.com";

    // Build member list
    const members: AccessReviewMember[] = group.members.map(
      (userId: string) => ({
        userId,
        email: `${userId}@saga.com`,
        addedAt: new Date(
          Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
        ),
        lastActive: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
      })
    );

    const review: AccessReview = {
      id: `ar-${Date.now()}`,
      groupId,
      groupName: group.displayName,
      reviewerId: `reviewer-${Date.now()}`,
      reviewerEmail,
      members,
      status: "pending",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      createdAt: new Date(),
    };

    accessReviews.push(review);

    // Stub: Send Slack message to reviewer
    console.log(
      `[ACCESS-REVIEW] Sending review request to ${reviewerEmail}: ` +
        `Quarterly access review for ${group.displayName} — ` +
        `${members.length} members to review. Due in 14 days.`
    );

    createAuditLog({
      actor: "qyburn-bot",
      action: "access_review.initiated",
      target: group.displayName,
      targetId: review.id,
      details: JSON.stringify({
        memberCount: members.length,
        reviewer: reviewerEmail,
        dueDate: review.dueDate.toISOString(),
      }),
      channel: null,
    });

    return { success: true, review };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Process a review decision for a specific member.
 * If revoke, executes the removal via action engine.
 */
export async function processReviewDecision(
  reviewId: string,
  memberId: string,
  decision: "keep" | "revoke"
): Promise<{ success: boolean; error?: string }> {
  const review = accessReviews.find((r) => r.id === reviewId);
  if (!review) {
    return { success: false, error: `Review ${reviewId} not found` };
  }

  const member = review.members.find((m) => m.userId === memberId);
  if (!member) {
    return { success: false, error: `Member ${memberId} not found in review` };
  }

  member.decision = decision;
  member.decidedAt = new Date();

  if (review.status === "pending") {
    review.status = "in_progress";
  }

  // If revoke, execute removal
  if (decision === "revoke") {
    const result = await removeFromGroup(
      memberId,
      review.groupId,
      `Access review: revoked by ${review.reviewerEmail}`
    );

    if (!result.success) {
      return {
        success: false,
        error: `Revocation failed: ${result.details}`,
      };
    }

    console.log(
      `[ACCESS-REVIEW] Revoked ${member.email} from ${review.groupName}`
    );
  }

  // Check if all decisions are made
  const allDecided = review.members.every((m) => m.decision !== undefined);
  if (allDecided) {
    review.status = "completed";
    review.completedAt = new Date();
  }

  createAuditLog({
    actor: review.reviewerEmail,
    action: `access_review.${decision}`,
    target: review.groupName,
    targetId: review.id,
    details: JSON.stringify({
      memberId,
      memberEmail: member.email,
      decision,
    }),
    channel: null,
  });

  return { success: true };
}

/**
 * Get all reviews past their due date that are not completed.
 */
export function getOverdueReviews(): AccessReview[] {
  const now = new Date();
  return accessReviews.filter(
    (r) => r.status !== "completed" && r.dueDate < now
  );
}

/**
 * Get review statistics.
 */
export function getReviewStats(): ReviewStats {
  const total = accessReviews.length;
  const completed = accessReviews.filter(
    (r) => r.status === "completed"
  ).length;
  const pending = accessReviews.filter(
    (r) => r.status === "pending" || r.status === "in_progress"
  ).length;
  const overdue = getOverdueReviews().length;

  const allMembers = accessReviews.flatMap((r) => r.members);
  const reviewed = allMembers.filter((m) => m.decision !== undefined);
  const revoked = reviewed.filter((m) => m.decision === "revoke");

  return {
    totalReviews: total,
    completedReviews: completed,
    pendingReviews: pending,
    overdueReviews: overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    avgRevocationRate:
      reviewed.length > 0
        ? Math.round((revoked.length / reviewed.length) * 100)
        : 0,
    totalMembersReviewed: reviewed.length,
    totalRevocations: revoked.length,
  };
}

/**
 * Schedule quarterly reviews for all restricted groups.
 */
export async function scheduleQuarterlyReviews(): Promise<{
  scheduled: number;
  errors: string[];
}> {
  let scheduled = 0;
  const errors: string[] = [];

  for (const group of restrictedGroups) {
    // Check if there's already a pending/in_progress review for this group
    const existingReview = accessReviews.find(
      (r) =>
        r.groupId === group.azureGroupId &&
        r.status !== "completed"
    );

    if (existingReview) {
      continue; // Skip groups with active reviews
    }

    const result = await initiateAccessReview(group.azureGroupId);
    if (result.success) {
      scheduled++;
    } else {
      errors.push(`${group.displayName}: ${result.error}`);
    }
  }

  return { scheduled, errors };
}

/**
 * Get all access reviews.
 */
export function getAccessReviews(
  status?: string
): AccessReview[] {
  if (status) {
    return accessReviews.filter((r) => r.status === status);
  }
  return [...accessReviews];
}

/**
 * Get a single access review by ID.
 */
export function getAccessReview(id: string): AccessReview | undefined {
  return accessReviews.find((r) => r.id === id);
}
