/**
 * SLA monitoring and escalation tracking for IT requests.
 * Tracks response-time thresholds, checks for breaches,
 * and determines escalation targets based on elapsed time.
 */

// ─── Types ──────────────────────────────────────────────────

export interface SlaConfig {
  requestType: string;
  maxResponseHours: number;
  warningThresholdPct: number;
  escalationChain: string[];
}

export interface SlaBreachResult {
  requestId: string;
  requestType: string;
  hoursElapsed: number;
  maxHours: number;
  percentUsed: number;
  status: 'ok' | 'warning' | 'breached';
  escalationTarget: string | null;
}

export interface SlaMetrics {
  complianceRate: number;
  avgResponseHoursByType: Record<string, number>;
  totalChecked: number;
  totalBreached: number;
  totalWarning: number;
}

// ─── Default SLA Configurations ─────────────────────────────

const DEFAULT_SLAS: SlaConfig[] = [
  {
    requestType: 'license',
    maxResponseHours: 24,
    warningThresholdPct: 75,
    escalationChain: ['it.manager@saga.com', 'vp.it@saga.com'],
  },
  {
    requestType: 'group_access',
    maxResponseHours: 8,
    warningThresholdPct: 75,
    escalationChain: ['group.owner@saga.com', 'it.manager@saga.com'],
  },
  {
    requestType: 'password_reset',
    maxResponseHours: 1,
    warningThresholdPct: 75,
    escalationChain: ['it.support.lead@saga.com'],
  },
  {
    requestType: 'hardware',
    maxResponseHours: 72,
    warningThresholdPct: 75,
    escalationChain: ['it.procurement@saga.com', 'it.manager@saga.com'],
  },
];

const slaConfigs: SlaConfig[] = [...DEFAULT_SLAS];

// ─── Helper ─────────────────────────────────────────────────

function getHoursElapsed(createdAt: Date): number {
  return (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
}

function getSlaConfig(requestType: string): SlaConfig | undefined {
  return slaConfigs.find((s) => s.requestType === requestType);
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Check all open requests against their SLA configurations.
 * Returns breach/warning status for each request.
 */
export function checkSlaBreaches(
  requests: { id: string; type: string; createdAt: Date; status: string }[]
): SlaBreachResult[] {
  const openStatuses = ['pending', 'submitted', 'in_review', 'SUBMITTED', 'IN_REVIEW', 'DRAFT'];

  return requests
    .filter((r) => openStatuses.includes(r.status))
    .map((request) => {
      const config = getSlaConfig(request.type);
      if (!config) {
        return {
          requestId: request.id,
          requestType: request.type,
          hoursElapsed: getHoursElapsed(request.createdAt),
          maxHours: 0,
          percentUsed: 0,
          status: 'ok' as const,
          escalationTarget: null,
        };
      }

      const hoursElapsed = getHoursElapsed(request.createdAt);
      const percentUsed = (hoursElapsed / config.maxResponseHours) * 100;

      let status: 'ok' | 'warning' | 'breached';
      if (percentUsed >= 100) {
        status = 'breached';
      } else if (percentUsed >= config.warningThresholdPct) {
        status = 'warning';
      } else {
        status = 'ok';
      }

      const escalationTarget =
        status !== 'ok'
          ? getEscalationTarget(request.type, hoursElapsed)
          : null;

      return {
        requestId: request.id,
        requestType: request.type,
        hoursElapsed: Math.round(hoursElapsed * 100) / 100,
        maxHours: config.maxResponseHours,
        percentUsed: Math.round(percentUsed * 100) / 100,
        status,
        escalationTarget,
      };
    });
}

/**
 * Determine who to escalate to based on request type and hours elapsed.
 * As time increases, escalation moves up the chain.
 */
export function getEscalationTarget(
  requestType: string,
  hoursElapsed: number
): string | null {
  const config = getSlaConfig(requestType);
  if (!config || config.escalationChain.length === 0) return null;

  const maxHours = config.maxResponseHours;
  const chainLength = config.escalationChain.length;

  // Determine escalation level: each level gets an equal fraction of time beyond the SLA
  // Level 0 at breach, Level 1 at 1.5x, Level 2 at 2x, etc.
  if (hoursElapsed < maxHours) {
    // Warning zone — first escalation target
    return config.escalationChain[0];
  }

  const overageRatio = hoursElapsed / maxHours;
  // Level 0 at 1x, level 1 at 1.5x, level 2 at 2x, etc.
  const level = Math.min(
    Math.floor((overageRatio - 1) * 2),
    chainLength - 1
  );

  return config.escalationChain[level];
}

/**
 * Compute SLA compliance metrics from a set of completed and open requests.
 */
export function getSlaMetrics(
  requests: {
    id: string;
    type: string;
    createdAt: Date;
    resolvedAt?: Date | null;
    status: string;
  }[]
): SlaMetrics {
  const typeResponseTimes: Record<string, number[]> = {};
  let totalBreached = 0;
  let totalWarning = 0;
  let totalChecked = 0;

  for (const request of requests) {
    const config = getSlaConfig(request.type);
    if (!config) continue;

    totalChecked++;

    const endTime = request.resolvedAt
      ? request.resolvedAt.getTime()
      : Date.now();
    const hoursElapsed =
      (endTime - request.createdAt.getTime()) / (1000 * 60 * 60);

    if (!typeResponseTimes[request.type]) {
      typeResponseTimes[request.type] = [];
    }
    typeResponseTimes[request.type].push(hoursElapsed);

    const percentUsed = (hoursElapsed / config.maxResponseHours) * 100;
    if (percentUsed >= 100) {
      totalBreached++;
    } else if (percentUsed >= config.warningThresholdPct) {
      totalWarning++;
    }
  }

  const avgResponseHoursByType: Record<string, number> = {};
  for (const [type, times] of Object.entries(typeResponseTimes)) {
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    avgResponseHoursByType[type] = Math.round(avg * 100) / 100;
  }

  const complianceRate =
    totalChecked > 0
      ? Math.round(((totalChecked - totalBreached) / totalChecked) * 10000) / 100
      : 100;

  return {
    complianceRate,
    avgResponseHoursByType,
    totalChecked,
    totalBreached,
    totalWarning,
  };
}

/** Get all SLA configurations. */
export function getSlaConfigs(): SlaConfig[] {
  return [...slaConfigs];
}

/** Add or update an SLA configuration. */
export function upsertSlaConfig(config: SlaConfig): void {
  const idx = slaConfigs.findIndex((s) => s.requestType === config.requestType);
  if (idx >= 0) {
    slaConfigs[idx] = config;
  } else {
    slaConfigs.push(config);
  }
}
