/**
 * User Churn Predictor
 *
 * Year 2 Q1 — Predictive IT: Identifies users who will likely need help soon
 * based on signals like new-hire status, failed logins, missing MFA,
 * no assigned licenses, and recent department changes.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ChurnPrediction {
  userId: string;
  email: string;
  riskLevel: "high" | "medium" | "low";
  signals: string[];
  predictedNeed: string;
  suggestedAction: string;
}

export interface ProactiveAction {
  id: string;
  userId: string;
  email: string;
  riskLevel: "high" | "medium" | "low";
  actionType: "message" | "auto_provision" | "alert_admin";
  message: string;
  urgency: "immediate" | "today" | "this_week";
}

// ─── Mock User Profile Data ─────────────────────────────────

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  department: string;
  startDate: string;
  hasMFA: boolean;
  lastPasswordChange: string;
  failedLoginsThisWeek: number;
  lastLogin?: string;
  assignedLicenses: string[];
  recentDeptChange?: { from: string; to: string; changedAt: string };
}

const userProfiles: UserProfile[] = [
  {
    userId: "user-060",
    email: "new.hire1@saga.com",
    name: "Nils Ekberg",
    department: "Engineering",
    startDate: "2026-03-03T09:00:00Z", // Day 2
    hasMFA: false,
    lastPasswordChange: "2026-03-03T09:00:00Z",
    failedLoginsThisWeek: 0,
    lastLogin: "2026-03-04T08:00:00Z",
    assignedLicenses: [],
  },
  {
    userId: "user-061",
    email: "new.hire2@saga.com",
    name: "Lisa Forsberg",
    department: "Marketing",
    startDate: "2026-03-01T09:00:00Z", // Day 4
    hasMFA: false,
    lastPasswordChange: "2026-03-01T09:00:00Z",
    failedLoginsThisWeek: 2,
    lastLogin: "2026-03-03T10:00:00Z",
    assignedLicenses: ["lic-001"],
  },
  {
    userId: "user-062",
    email: "new.hire3@saga.com",
    name: "Arvid Sundberg",
    department: "Diagnostics",
    startDate: "2026-02-25T09:00:00Z", // Day 7
    hasMFA: true,
    lastPasswordChange: "2026-02-25T09:00:00Z",
    failedLoginsThisWeek: 0,
    lastLogin: "2026-03-04T07:30:00Z",
    assignedLicenses: ["lic-001", "lic-004"],
  },
  {
    userId: "user-020",
    email: "jonas.alm@saga.com",
    name: "Jonas Alm",
    department: "Engineering",
    startDate: "2024-03-15T09:00:00Z",
    hasMFA: true,
    lastPasswordChange: "2025-05-20T09:00:00Z", // 288 days ago
    failedLoginsThisWeek: 5,
    lastLogin: "2026-03-04T08:45:00Z",
    assignedLicenses: ["lic-001", "lic-002", "lic-003", "lic-004"],
  },
  {
    userId: "user-011",
    email: "karl.nilsson@saga.com",
    name: "Karl Nilsson",
    department: "Engineering",
    startDate: "2024-06-01T09:00:00Z",
    hasMFA: true,
    lastPasswordChange: "2025-08-10T09:00:00Z",
    failedLoginsThisWeek: 3,
    lastLogin: "2026-03-04T07:30:00Z",
    assignedLicenses: ["lic-001", "lic-003", "lic-004"],
  },
  {
    userId: "user-010",
    email: "sofia.berg@saga.com",
    name: "Sofia Berg",
    department: "Marketing",
    startDate: "2024-08-15T09:00:00Z",
    hasMFA: false,
    lastPasswordChange: "2025-04-01T09:00:00Z", // 338 days ago
    failedLoginsThisWeek: 0,
    lastLogin: "2026-03-03T09:00:00Z",
    assignedLicenses: ["lic-001", "lic-004"],
  },
  {
    userId: "user-050",
    email: "alice.roth@saga.com",
    name: "Alice Roth",
    department: "Marketing",
    startDate: "2024-09-01T09:00:00Z",
    hasMFA: true,
    lastPasswordChange: "2025-09-15T09:00:00Z",
    failedLoginsThisWeek: 4,
    lastLogin: "2026-03-03T22:10:00Z",
    assignedLicenses: ["lic-001", "lic-004", "lic-005"],
  },
  {
    userId: "user-070",
    email: "david.west@saga.com",
    name: "David West",
    department: "Engineering",
    startDate: "2024-01-15T09:00:00Z",
    hasMFA: true,
    lastPasswordChange: "2026-01-05T09:00:00Z",
    failedLoginsThisWeek: 0,
    lastLogin: "2026-03-04T09:00:00Z",
    assignedLicenses: [],
    recentDeptChange: {
      from: "QA",
      to: "Engineering",
      changedAt: "2026-02-20T09:00:00Z",
    },
  },
  {
    userId: "user-071",
    email: "maja.ek@saga.com",
    name: "Maja Ek",
    department: "Finance",
    startDate: "2024-05-01T09:00:00Z",
    hasMFA: true,
    lastPasswordChange: "2026-02-01T09:00:00Z",
    failedLoginsThisWeek: 0,
    lastLogin: "2026-03-04T08:00:00Z",
    assignedLicenses: ["lic-001", "lic-004"],
    recentDeptChange: {
      from: "Operations",
      to: "Finance",
      changedAt: "2026-02-15T09:00:00Z",
    },
  },
];

// ─── Detection Logic ─────────────────────────────────────────

function daysSince(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function isNewHire(user: UserProfile): boolean {
  return daysSince(user.startDate) <= 7;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Predict users who will need help soon.
 * Scans for at-risk signals and returns sorted by risk level.
 */
export function predictChurn(): ChurnPrediction[] {
  const predictions: ChurnPrediction[] = [];

  for (const user of userProfiles) {
    const signals: string[] = [];
    let riskLevel: "high" | "medium" | "low" = "low";
    let predictedNeed = "";
    let suggestedAction = "";

    // New hires (day 1-7)
    if (isNewHire(user)) {
      const daysIn = daysSince(user.startDate);
      signals.push(`New hire — Day ${daysIn}`);

      if (user.assignedLicenses.length === 0) {
        signals.push("No licenses assigned yet");
        riskLevel = "high";
        predictedNeed = "Needs license provisioning and onboarding help";
        suggestedAction = `Run onboarding template for ${user.department} department`;
      } else if (!user.hasMFA) {
        signals.push("MFA not configured");
        riskLevel = "high";
        predictedNeed = "Will get locked out without MFA setup";
        suggestedAction = `Message ${user.name}: Walk through MFA setup`;
      } else {
        riskLevel = "medium";
        predictedNeed = "May need additional tools or group access";
        suggestedAction = `Check in with ${user.name} on Day 7`;
      }
    }

    // Failed logins
    if (user.failedLoginsThisWeek >= 3) {
      signals.push(
        `${user.failedLoginsThisWeek} failed login attempts this week`
      );
      if (user.failedLoginsThisWeek >= 5) {
        riskLevel = "high";
        predictedNeed = "Account may be locked or compromised";
        suggestedAction = `Proactively offer ${user.name} a password reset`;
      } else {
        riskLevel = riskLevel === "high" ? "high" : "medium";
        if (!predictedNeed) {
          predictedNeed = "May need password reset assistance soon";
          suggestedAction = `Monitor ${user.name}'s login activity`;
        }
      }
    }

    // MFA not set up
    if (!user.hasMFA && !isNewHire(user)) {
      signals.push("MFA not configured");
      riskLevel = riskLevel === "low" ? "medium" : riskLevel;
      if (!predictedNeed) {
        predictedNeed = "Will get locked out when MFA is enforced";
        suggestedAction = `Send MFA setup reminder to ${user.name}`;
      }
    }

    // No licenses assigned (non-new hires)
    if (user.assignedLicenses.length === 0 && !isNewHire(user)) {
      signals.push("No licenses assigned");
      riskLevel = riskLevel === "low" ? "medium" : riskLevel;
      if (!predictedNeed) {
        predictedNeed = "Probably missing tools they need";
        suggestedAction = `Check with ${user.name} if they need software access`;
      }
    }

    // Recent department change
    if (user.recentDeptChange) {
      const daysSinceChange = daysSince(user.recentDeptChange.changedAt);
      if (daysSinceChange <= 30) {
        signals.push(
          `Department changed from ${user.recentDeptChange.from} to ${user.recentDeptChange.to} (${daysSinceChange} days ago)`
        );
        riskLevel = riskLevel === "low" ? "medium" : riskLevel;
        if (!predictedNeed) {
          predictedNeed = `May need different permissions for ${user.recentDeptChange.to}`;
          suggestedAction = `Review ${user.name}'s access for new department`;
        }
      }
    }

    // Old password
    const passwordAge = daysSince(user.lastPasswordChange);
    if (passwordAge > 180) {
      signals.push(`Password is ${passwordAge} days old`);
      if (!predictedNeed) {
        predictedNeed = "Password expiry approaching";
        suggestedAction = `Send password change reminder to ${user.name}`;
      }
    }

    // Only include if there are signals
    if (signals.length > 0) {
      predictions.push({
        userId: user.userId,
        email: user.email,
        riskLevel,
        signals,
        predictedNeed: predictedNeed || "General monitoring",
        suggestedAction: suggestedAction || "No immediate action needed",
      });
    }
  }

  // Sort by risk level
  const riskOrder = { high: 0, medium: 1, low: 2 };
  return predictions.sort(
    (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
  );
}

/**
 * Convert predictions into concrete bot actions.
 * Returns actionable messages the bot can send or execute.
 */
export function getProactiveActions(): ProactiveAction[] {
  const predictions = predictChurn();
  const actions: ProactiveAction[] = [];
  let actionId = 0;

  for (const prediction of predictions) {
    actionId++;

    if (prediction.riskLevel === "high") {
      // High-risk: immediate action
      if (prediction.signals.some((s) => s.includes("failed login"))) {
        actions.push({
          id: `action-${actionId}`,
          userId: prediction.userId,
          email: prediction.email,
          riskLevel: prediction.riskLevel,
          actionType: "message",
          message: `Hi! I noticed you've had some trouble logging in this week. Would you like me to help you reset your password?`,
          urgency: "immediate",
        });
      } else if (prediction.signals.some((s) => s.includes("MFA"))) {
        actions.push({
          id: `action-${actionId}`,
          userId: prediction.userId,
          email: prediction.email,
          riskLevel: prediction.riskLevel,
          actionType: "message",
          message: `Your MFA isn't configured yet. MFA enforcement is coming soon — want me to walk you through setting it up? It only takes 2 minutes.`,
          urgency: "immediate",
        });
      } else if (prediction.signals.some((s) => s.includes("No licenses"))) {
        actions.push({
          id: `action-${actionId}`,
          userId: prediction.userId,
          email: prediction.email,
          riskLevel: prediction.riskLevel,
          actionType: "auto_provision",
          message: `Welcome to SAGA! Let me get your tools set up. I'll provision the standard software for your department.`,
          urgency: "immediate",
        });
      }
    } else if (prediction.riskLevel === "medium") {
      // Medium-risk: action today
      if (prediction.signals.some((s) => s.includes("Department changed"))) {
        actions.push({
          id: `action-${actionId}`,
          userId: prediction.userId,
          email: prediction.email,
          riskLevel: prediction.riskLevel,
          actionType: "message",
          message: `I see you recently moved to a new department. Do you need access to any new tools or groups? I can help get you set up.`,
          urgency: "today",
        });
      } else if (prediction.signals.some((s) => s.includes("MFA"))) {
        actions.push({
          id: `action-${actionId}`,
          userId: prediction.userId,
          email: prediction.email,
          riskLevel: prediction.riskLevel,
          actionType: "message",
          message: `Friendly reminder: your MFA isn't set up yet. Want me to help you configure it?`,
          urgency: "today",
        });
      } else {
        actions.push({
          id: `action-${actionId}`,
          userId: prediction.userId,
          email: prediction.email,
          riskLevel: prediction.riskLevel,
          actionType: "alert_admin",
          message: prediction.suggestedAction,
          urgency: "today",
        });
      }
    } else {
      // Low-risk: this week
      actions.push({
        id: `action-${actionId}`,
        userId: prediction.userId,
        email: prediction.email,
        riskLevel: prediction.riskLevel,
        actionType: "alert_admin",
        message: prediction.suggestedAction,
        urgency: "this_week",
      });
    }
  }

  return actions;
}

/**
 * Get user profiles for display (read-only).
 */
export function getUserProfiles(): UserProfile[] {
  return [...userProfiles];
}
