/**
 * Workflow rules engine for approval routing.
 * Evaluates incoming requests against a priority-ordered set of rules
 * to determine the approval action (auto-approve, require approval, deny, etc.).
 */

// ─── Types ──────────────────────────────────────────────────

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in';
  value: unknown;
}

export interface WorkflowAction {
  type:
    | 'auto_approve'
    | 'require_approval'
    | 'require_vp_approval'
    | 'deny'
    | 'notify';
  approver?: string;
  reason?: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  condition: WorkflowCondition[];
  action: WorkflowAction;
  priority: number;
  enabled: boolean;
}

export interface WorkflowRequest {
  type: string;
  target: string;
  user: { dept: string; role: string };
  cost?: number;
}

// ─── Default Rules ──────────────────────────────────────────

const DEFAULT_RULES: WorkflowRule[] = [
  {
    id: 'rule-001',
    name: 'Engineering auto-approve JetBrains/GitHub',
    condition: [
      { field: 'user.dept', operator: 'eq', value: 'Engineering' },
      { field: 'target', operator: 'in', value: ['JetBrains', 'GitHub'] },
    ],
    action: { type: 'auto_approve', reason: 'Standard engineering tooling' },
    priority: 100,
    enabled: true,
  },
  {
    id: 'rule-002',
    name: 'High-cost licenses require VP approval',
    condition: [
      { field: 'cost', operator: 'gt', value: 50 },
    ],
    action: {
      type: 'require_vp_approval',
      approver: 'vp@saga.com',
      reason: 'License cost exceeds $50/seat threshold',
    },
    priority: 80,
    enabled: true,
  },
  {
    id: 'rule-003',
    name: 'Finance dept requires CFO approval',
    condition: [
      { field: 'user.dept', operator: 'eq', value: 'Finance' },
      { field: 'type', operator: 'eq', value: 'license' },
    ],
    action: {
      type: 'require_approval',
      approver: 'cfo@saga.com',
      reason: 'Finance department license request requires CFO sign-off',
    },
    priority: 90,
    enabled: true,
  },
  {
    id: 'rule-004',
    name: 'Interns require manager approval for group access',
    condition: [
      { field: 'user.role', operator: 'eq', value: 'Intern' },
      { field: 'type', operator: 'eq', value: 'group' },
    ],
    action: {
      type: 'require_approval',
      reason: 'Intern access requests require manager approval',
    },
    priority: 70,
    enabled: true,
  },
  {
    id: 'rule-005',
    name: 'Lab Technician auto-approve Lab-Instruments group',
    condition: [
      { field: 'user.role', operator: 'eq', value: 'Lab Technician' },
      { field: 'target', operator: 'contains', value: 'Lab-Instruments' },
    ],
    action: {
      type: 'auto_approve',
      reason: 'Lab technicians have standing access to lab instruments',
    },
    priority: 95,
    enabled: true,
  },
];

// ─── Rule Store ─────────────────────────────────────────────

const rules: WorkflowRule[] = [...DEFAULT_RULES];

// ─── Condition Evaluator ────────────────────────────────────

function getFieldValue(request: WorkflowRequest, field: string): unknown {
  const parts = field.split('.');
  let current: unknown = request;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function evaluateCondition(
  request: WorkflowRequest,
  condition: WorkflowCondition
): boolean {
  const actual = getFieldValue(request, condition.field);
  const expected = condition.value;

  switch (condition.operator) {
    case 'eq':
      return actual === expected;
    case 'ne':
      return actual !== expected;
    case 'gt':
      return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    case 'lt':
      return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    case 'contains':
      return typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected);
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    default:
      return false;
  }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Evaluate all enabled rules against a request.
 * Returns the action from the highest-priority matching rule, or null if no rules match.
 */
export function evaluateRules(request: WorkflowRequest): WorkflowAction | null {
  const enabledRules = rules
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority); // highest priority first

  for (const rule of enabledRules) {
    const allMatch = rule.condition.every((c) => evaluateCondition(request, c));
    if (allMatch) {
      console.log(
        `[WorkflowRules] Rule "${rule.name}" (${rule.id}) matched for ${request.type}:${request.target}`
      );
      return rule.action;
    }
  }

  return null;
}

/** Add a custom rule to the engine. */
export function addRule(rule: WorkflowRule): void {
  rules.push(rule);
}

/** Get all rules (both default and custom). */
export function getRules(): WorkflowRule[] {
  return [...rules];
}

/** Remove a rule by ID. Returns true if found and removed. */
export function removeRule(id: string): boolean {
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  rules.splice(idx, 1);
  return true;
}

/** Enable or disable a rule by ID. */
export function toggleRule(id: string, enabled: boolean): boolean {
  const rule = rules.find((r) => r.id === id);
  if (!rule) return false;
  rule.enabled = enabled;
  return true;
}
