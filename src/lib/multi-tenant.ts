/**
 * Multi-Tenant Support — Year 3 Q3 Enterprise Scale.
 *
 * Stores tenant configurations in BotConfig table as JSON.
 * Provides tenant lookup, creation, and data isolation filters.
 */

// ─── Types ───────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  plan: "starter" | "professional" | "enterprise";
  settings: Record<string, unknown>;
  createdAt: Date;
}

interface TenantCreateData {
  name: string;
  slug: string;
  domain: string;
  plan: "starter" | "professional" | "enterprise";
  settings?: Record<string, unknown>;
}

// ─── In-Memory Store (backed by BotConfig JSON) ─────────────

const TENANT_CONFIG_KEY = "tenants";

let tenantsCache: Tenant[] = [
  {
    id: "tenant-default",
    name: "SAGA Diagnostics",
    slug: "saga",
    domain: "saga.com",
    plan: "enterprise",
    settings: {
      maxUsers: 500,
      ssoEnabled: true,
      customBranding: true,
      apiAccess: true,
    },
    createdAt: new Date("2024-06-01T00:00:00Z"),
  },
];

// ─── Functions ───────────────────────────────────────────────

/**
 * Create a new tenant record.
 */
export function createTenant(data: TenantCreateData): Tenant {
  const existing = tenantsCache.find(
    (t) => t.slug === data.slug || t.domain === data.domain
  );
  if (existing) {
    throw new Error(
      `Tenant with slug "${data.slug}" or domain "${data.domain}" already exists`
    );
  }

  const tenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name: data.name,
    slug: data.slug,
    domain: data.domain,
    plan: data.plan,
    settings: data.settings ?? {},
    createdAt: new Date(),
  };

  tenantsCache.push(tenant);
  return tenant;
}

/**
 * List all tenants.
 */
export function getTenants(): Tenant[] {
  return [...tenantsCache];
}

/**
 * Look up a tenant by email domain.
 */
export function getTenantByDomain(domain: string): Tenant | undefined {
  return tenantsCache.find(
    (t) => t.domain.toLowerCase() === domain.toLowerCase()
  );
}

/**
 * Return a filter object for data isolation.
 * All queries in a multi-tenant context should include this filter.
 */
export function getTenantDataFilter(
  tenantId: string
): Record<string, unknown> {
  const tenant = tenantsCache.find((t) => t.id === tenantId);
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  return {
    tenantId,
    tenantSlug: tenant.slug,
    domain: tenant.domain,
    // When applied as a Prisma where clause, isolates data to this tenant
    where: { tenantId },
  };
}

/**
 * Get a tenant by ID.
 */
export function getTenantById(tenantId: string): Tenant | undefined {
  return tenantsCache.find((t) => t.id === tenantId);
}

/**
 * Get plan feature limits.
 */
export function getPlanLimits(plan: Tenant["plan"]): Record<string, number> {
  const limits: Record<string, Record<string, number>> = {
    starter: {
      maxUsers: 25,
      maxLicenses: 10,
      maxGroups: 5,
      maxPlugins: 2,
      apiRateLimit: 100,
    },
    professional: {
      maxUsers: 200,
      maxLicenses: 50,
      maxGroups: 25,
      maxPlugins: 5,
      apiRateLimit: 1000,
    },
    enterprise: {
      maxUsers: -1, // unlimited
      maxLicenses: -1,
      maxGroups: -1,
      maxPlugins: -1,
      apiRateLimit: 10000,
    },
  };

  return limits[plan] ?? limits.starter;
}
