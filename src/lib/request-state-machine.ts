/**
 * Request lifecycle state machine.
 * Defines valid states, transitions, and audit-logged state changes
 * for IT access / license / group requests.
 */

// ─── Types ──────────────────────────────────────────────────

export type RequestState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'DENIED'
  | 'ASSIGNED'
  | 'ACTIVE'
  | 'REVOKED'
  | 'EXPIRED';

export interface StateTransitionRecord {
  requestId: string;
  from: RequestState;
  to: RequestState;
  actor: string;
  reason?: string;
  timestamp: string;
}

// ─── Valid Transitions ──────────────────────────────────────

const VALID_TRANSITIONS: Record<RequestState, RequestState[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['IN_REVIEW', 'DENIED'],
  IN_REVIEW: ['APPROVED', 'DENIED'],
  APPROVED: ['ASSIGNED'],
  ASSIGNED: ['ACTIVE'],
  ACTIVE: ['REVOKED', 'EXPIRED'],
  DENIED: ['DRAFT'],
  REVOKED: ['DRAFT'],
  EXPIRED: ['DRAFT'],
};

// ─── In-memory audit log for transitions ────────────────────

const transitionLog: StateTransitionRecord[] = [];

// ─── Functions ──────────────────────────────────────────────

/** Check whether a transition from one state to another is valid. */
export function canTransition(from: RequestState, to: RequestState): boolean {
  // Any state can restart to DRAFT
  if (to === 'DRAFT' && from !== 'DRAFT') return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Execute a state transition with audit logging.
 * Throws if the transition is not valid.
 */
export function transition(
  requestId: string,
  from: RequestState,
  to: RequestState,
  actor: string,
  reason?: string
): StateTransitionRecord {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid state transition: ${from} → ${to} for request ${requestId}`
    );
  }

  const record: StateTransitionRecord = {
    requestId,
    from,
    to,
    actor,
    reason,
    timestamp: new Date().toISOString(),
  };

  transitionLog.push(record);

  console.log(
    `[StateMachine] ${requestId}: ${from} → ${to} by ${actor}${reason ? ` (${reason})` : ''}`
  );

  return record;
}

/** Get the list of valid next states from the current state. */
export function getNextStates(current: RequestState): RequestState[] {
  const next = [...(VALID_TRANSITIONS[current] ?? [])];
  // Any state (except DRAFT) can also go back to DRAFT
  if (current !== 'DRAFT' && !next.includes('DRAFT')) {
    next.push('DRAFT');
  }
  return next;
}

/** Return a UI badge color for a given state. */
export function getStateColor(
  state: RequestState
): string {
  const colors: Record<RequestState, string> = {
    DRAFT: 'gray',
    SUBMITTED: 'blue',
    IN_REVIEW: 'yellow',
    APPROVED: 'green',
    DENIED: 'red',
    ASSIGNED: 'indigo',
    ACTIVE: 'emerald',
    REVOKED: 'orange',
    EXPIRED: 'slate',
  };
  return colors[state] ?? 'gray';
}

/** Get the full transition audit log, optionally filtered by request ID. */
export function getTransitionLog(requestId?: string): StateTransitionRecord[] {
  if (requestId) {
    return transitionLog.filter((r) => r.requestId === requestId);
  }
  return [...transitionLog];
}
