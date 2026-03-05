/**
 * Granular RBAC v2 — Year 3 Q3 Enterprise Scale.
 *
 * Condition-based permission evaluation with spending limits,
 * department scoping, and temporary delegation.
 */

// ─── Types ───────────────────────────────────────────────────

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, unknown>;
}

export interface RoleV2 {
  id: string;
  name: string;
  permissions: Permission[];
  spendingLimit?: number; // monthly $ limit
  delegationRules?: {
    canDelegateTo: string[];
    maxDuration: number; // hours
  };
}

interface DelegatedPermission {
  id: string;
  fromUserId: string;
  toUserId: string;
  permission: Permission;
  expiresAt: Date;
  createdAt: Date;
}

interface UserRoleAssignment {
  userId: string;
  roleId: string;
  department?: string;
  monthlySpend?: number;
}

// ─── Default Roles ──────────────────────────────────────────

export const DEFAULT_ROLES: RoleV2[] = [
  {
    id: "it_admin",
    name: "IT Admin",
    permissions: [
      { action: "*", resource: "*" },
    ],
    spendingLimit: undefined, // unlimited
    delegationRules: {
      canDelegateTo: ["it_manager", "it_support", "department_manager"],
      maxDuration: 720, // 30 days
    },
  },
  {
    id: "it_manager",
    name: "IT Manager",
    permissions: [
      { action: "approve", resource: "license_request" },
      { action: "approve", resource: "group_request" },
      { action: "manage", resource: "licenses" },
      { action: "view", resource: "analytics" },
      { action: "view", resource: "audit_log" },
      { action: "manage", resource: "knowledge_base" },
      { action: "manage", resource: "onboarding" },
      { action: "view", resource: "conversations" },
    ],
    spendingLimit: 5000,
    delegationRules: {
      canDelegateTo: ["it_support", "department_manager"],
      maxDuration: 168, // 7 days
    },
  },
  {
    id: "it_support",
    name: "IT Support",
    permissions: [
      { action: "handle", resource: "tickets" },
      { action: "view", resource: "users" },
      { action: "provision", resource: "standard_licenses" },
      { action: "view", resource: "knowledge_base" },
      { action: "view", resource: "conversations" },
      { action: "initiate", resource: "password_reset" },
    ],
    spendingLimit: 500,
    delegationRules: {
      canDelegateTo: [],
      maxDuration: 24,
    },
  },
  {
    id: "department_manager",
    name: "Department Manager",
    permissions: [
      {
        action: "approve",
        resource: "license_request",
        conditions: { departmentMatch: true },
      },
      {
        action: "approve",
        resource: "group_request",
        conditions: { departmentMatch: true },
      },
      {
        action: "view",
        resource: "analytics",
        conditions: { departmentMatch: true },
      },
      { action: "view", resource: "own_department_users" },
    ],
    spendingLimit: 2000,
    delegationRules: {
      canDelegateTo: ["employee"],
      maxDuration: 48,
    },
  },
  {
    id: "employee",
    name: "Employee",
    permissions: [
      { action: "submit", resource: "license_request" },
      { action: "submit", resource: "group_request" },
      { action: "view", resource: "own_status" },
      { action: "view", resource: "knowledge_base" },
      { action: "initiate", resource: "own_password_reset" },
    ],
    spendingLimit: 0,
    delegationRules: undefined,
  },
];

// ─── In-Memory Store ────────────────────────────────────────

const delegatedPermissions: DelegatedPermission[] = [];

const userRoleAssignments: UserRoleAssignment[] = [
  { userId: "user-admin", roleId: "it_admin", department: "IT" },
  { userId: "user-001", roleId: "employee", department: "Diagnostics" },
  { userId: "user-002", roleId: "employee", department: "Engineering" },
  { userId: "user-003", roleId: "department_manager", department: "Design" },
  { userId: "user-004", roleId: "it_support", department: "IT" },
];

// ─── Functions ───────────────────────────────────────────────

/**
 * Evaluate whether a user has permission for an action on a resource.
 * Checks role permissions, conditions, spending limits, and delegations.
 */
export function checkPermission(
  userId: string,
  action: string,
  resource: string,
  context?: Record<string, unknown>
): { allowed: boolean; reason: string } {
  // 1. Check role-based permissions
  const assignment = userRoleAssignments.find((a) => a.userId === userId);
  if (!assignment) {
    return { allowed: false, reason: "No role assigned to user" };
  }

  const role = DEFAULT_ROLES.find((r) => r.id === assignment.roleId);
  if (!role) {
    return { allowed: false, reason: `Role ${assignment.roleId} not found` };
  }

  // Check direct role permissions
  const hasPermission = role.permissions.some((p) => {
    const actionMatch = p.action === "*" || p.action === action;
    const resourceMatch = p.resource === "*" || p.resource === resource;

    if (!actionMatch || !resourceMatch) return false;

    // Check conditions
    if (p.conditions) {
      if (p.conditions.departmentMatch && context?.department) {
        if (assignment.department !== context.department) return false;
      }
    }

    return true;
  });

  if (hasPermission) {
    // Check spending limit if context includes cost
    if (context?.cost !== undefined && role.spendingLimit !== undefined) {
      const currentSpend = assignment.monthlySpend ?? 0;
      const requestedCost = context.cost as number;
      if (currentSpend + requestedCost > role.spendingLimit) {
        return {
          allowed: false,
          reason: `Spending limit exceeded: $${currentSpend + requestedCost} > $${role.spendingLimit}/month`,
        };
      }
    }
    return { allowed: true, reason: "Permission granted by role" };
  }

  // 2. Check delegated permissions
  const now = new Date();
  const delegated = delegatedPermissions.find(
    (d) =>
      d.toUserId === userId &&
      d.permission.action === action &&
      d.permission.resource === resource &&
      d.expiresAt > now
  );

  if (delegated) {
    return {
      allowed: true,
      reason: `Permission delegated by ${delegated.fromUserId} until ${delegated.expiresAt.toISOString()}`,
    };
  }

  return {
    allowed: false,
    reason: `User ${userId} lacks permission: ${action} on ${resource}`,
  };
}

/**
 * Temporarily delegate a permission from one user to another.
 */
export function delegatePermission(
  fromUserId: string,
  toUserId: string,
  permission: Permission,
  durationHours: number
): { success: boolean; error?: string; delegation?: DelegatedPermission } {
  // Verify the delegator has the permission
  const check = checkPermission(fromUserId, permission.action, permission.resource);
  if (!check.allowed) {
    return {
      success: false,
      error: `Delegator does not have permission: ${permission.action} on ${permission.resource}`,
    };
  }

  // Verify delegation rules allow this
  const fromAssignment = userRoleAssignments.find(
    (a) => a.userId === fromUserId
  );
  const toAssignment = userRoleAssignments.find(
    (a) => a.userId === toUserId
  );

  if (!fromAssignment || !toAssignment) {
    return { success: false, error: "User role assignment not found" };
  }

  const fromRole = DEFAULT_ROLES.find((r) => r.id === fromAssignment.roleId);
  if (!fromRole?.delegationRules) {
    return { success: false, error: "Delegator role does not support delegation" };
  }

  if (!fromRole.delegationRules.canDelegateTo.includes(toAssignment.roleId)) {
    return {
      success: false,
      error: `Cannot delegate to role ${toAssignment.roleId}`,
    };
  }

  if (durationHours > fromRole.delegationRules.maxDuration) {
    return {
      success: false,
      error: `Duration ${durationHours}h exceeds max ${fromRole.delegationRules.maxDuration}h`,
    };
  }

  const delegation: DelegatedPermission = {
    id: `deleg-${Date.now()}`,
    fromUserId,
    toUserId,
    permission,
    expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  delegatedPermissions.push(delegation);

  return { success: true, delegation };
}

/**
 * Get all roles.
 */
export function getRoles(): RoleV2[] {
  return [...DEFAULT_ROLES];
}

/**
 * Get a user's role assignment.
 */
export function getUserRole(
  userId: string
): (UserRoleAssignment & { role: RoleV2 }) | undefined {
  const assignment = userRoleAssignments.find((a) => a.userId === userId);
  if (!assignment) return undefined;

  const role = DEFAULT_ROLES.find((r) => r.id === assignment.roleId);
  if (!role) return undefined;

  return { ...assignment, role };
}

/**
 * Get all active delegations for a user.
 */
export function getActiveDelegations(
  userId: string
): DelegatedPermission[] {
  const now = new Date();
  return delegatedPermissions.filter(
    (d) =>
      (d.toUserId === userId || d.fromUserId === userId) &&
      d.expiresAt > now
  );
}
