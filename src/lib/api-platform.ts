/**
 * Public API Platform — Year 3 Q3 Enterprise Scale.
 *
 * Provides a documented REST API with key-based auth and rate limiting.
 * Generates OpenAPI 3.0 spec for the API portal.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: { name: string; type: string; required: boolean }[];
  auth: "api_key";
  rateLimit: number; // requests per minute
}

interface ApiKey {
  key: string;
  name: string;
  tenantId: string;
  scopes: string[];
  rateLimit: number;
  requestCount: number;
  windowStart: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

interface ApiKeyValidation {
  valid: boolean;
  error?: string;
  tenantId?: string;
  scopes?: string[];
  remainingRequests?: number;
}

// ─── API Catalog ────────────────────────────────────────────

const API_CATALOG: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/v1/users/:email/licenses",
    description: "Does user X have license Y?",
    parameters: [
      { name: "email", type: "string", required: true },
      { name: "licenseId", type: "string", required: false },
    ],
    auth: "api_key",
    rateLimit: 60,
  },
  {
    method: "GET",
    path: "/api/v1/users/:email/groups",
    description: "What groups is user X in?",
    parameters: [
      { name: "email", type: "string", required: true },
    ],
    auth: "api_key",
    rateLimit: 60,
  },
  {
    method: "GET",
    path: "/api/v1/licenses/:id/availability",
    description: "Are there seats available?",
    parameters: [
      { name: "id", type: "string", required: true },
    ],
    auth: "api_key",
    rateLimit: 120,
  },
  {
    method: "POST",
    path: "/api/v1/requests/license",
    description: "Submit a license request",
    parameters: [
      { name: "email", type: "string", required: true },
      { name: "licenseId", type: "string", required: true },
      { name: "justification", type: "string", required: false },
    ],
    auth: "api_key",
    rateLimit: 30,
  },
  {
    method: "POST",
    path: "/api/v1/requests/group",
    description: "Submit a group access request",
    parameters: [
      { name: "email", type: "string", required: true },
      { name: "groupId", type: "string", required: true },
      { name: "justification", type: "string", required: true },
    ],
    auth: "api_key",
    rateLimit: 30,
  },
  {
    method: "GET",
    path: "/api/v1/requests/:id/status",
    description: "Check request status",
    parameters: [
      { name: "id", type: "string", required: true },
    ],
    auth: "api_key",
    rateLimit: 60,
  },
  {
    method: "GET",
    path: "/api/v1/health",
    description: "IT health score",
    parameters: [],
    auth: "api_key",
    rateLimit: 30,
  },
  {
    method: "GET",
    path: "/api/v1/metrics",
    description: "IT metrics summary",
    parameters: [],
    auth: "api_key",
    rateLimit: 30,
  },
];

// ─── In-Memory API Keys ─────────────────────────────────────

const apiKeys: ApiKey[] = [
  {
    key: "qyb_live_saga_k8s2f9x0m1",
    name: "Production API Key",
    tenantId: "tenant-default",
    scopes: ["read", "write"],
    rateLimit: 120,
    requestCount: 0,
    windowStart: new Date(),
    createdAt: new Date("2024-06-01T00:00:00Z"),
  },
  {
    key: "qyb_test_dev_a3b7c1d9e5",
    name: "Development API Key",
    tenantId: "tenant-default",
    scopes: ["read"],
    rateLimit: 60,
    requestCount: 0,
    windowStart: new Date(),
    createdAt: new Date("2024-06-01T00:00:00Z"),
  },
];

// ─── Functions ───────────────────────────────────────────────

/**
 * Return all public API endpoints.
 */
export function getApiCatalog(): ApiEndpoint[] {
  return API_CATALOG.map((e) => ({ ...e }));
}

/**
 * Validate an API key and check rate limits.
 */
export function validateApiKey(key: string): ApiKeyValidation {
  const apiKey = apiKeys.find((k) => k.key === key);
  if (!apiKey) {
    return { valid: false, error: "Invalid API key" };
  }

  // Check rate limit window (1 minute)
  const now = new Date();
  const windowMs = 60 * 1000;
  if (now.getTime() - apiKey.windowStart.getTime() > windowMs) {
    // Reset window
    apiKey.requestCount = 0;
    apiKey.windowStart = now;
  }

  if (apiKey.requestCount >= apiKey.rateLimit) {
    return {
      valid: false,
      error: "Rate limit exceeded. Try again in 60 seconds.",
      remainingRequests: 0,
    };
  }

  apiKey.requestCount++;
  apiKey.lastUsedAt = now;

  return {
    valid: true,
    tenantId: apiKey.tenantId,
    scopes: apiKey.scopes,
    remainingRequests: apiKey.rateLimit - apiKey.requestCount,
  };
}

/**
 * Generate OpenAPI 3.0 specification.
 */
export function generateApiDocs(): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const endpoint of API_CATALOG) {
    const pathKey = endpoint.path.replace(/:(\w+)/g, "{$1}");
    if (!paths[pathKey]) paths[pathKey] = {};

    const method = endpoint.method.toLowerCase();
    const pathParams = endpoint.parameters
      .filter((p) => endpoint.path.includes(`:${p.name}`))
      .map((p) => ({
        name: p.name,
        in: "path",
        required: true,
        schema: { type: p.type },
      }));

    const queryParams = endpoint.parameters
      .filter((p) => !endpoint.path.includes(`:${p.name}`))
      .map((p) => ({
        name: p.name,
        in: method === "get" ? "query" : "query",
        required: p.required,
        schema: { type: p.type },
      }));

    const requestBody =
      method === "post"
        ? {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: Object.fromEntries(
                    endpoint.parameters
                      .filter((p) => !endpoint.path.includes(`:${p.name}`))
                      .map((p) => [p.name, { type: p.type }])
                  ),
                  required: endpoint.parameters
                    .filter(
                      (p) =>
                        p.required && !endpoint.path.includes(`:${p.name}`)
                    )
                    .map((p) => p.name),
                },
              },
            },
          }
        : undefined;

    paths[pathKey][method] = {
      summary: endpoint.description,
      operationId: `${method}_${pathKey.replace(/[{}\/]/g, "_").replace(/_+/g, "_")}`,
      parameters: [...pathParams, ...(method === "get" ? queryParams : [])],
      ...(requestBody ? { requestBody } : {}),
      security: [{ ApiKeyAuth: [] }],
      responses: {
        "200": {
          description: "Success",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        "401": { description: "Unauthorized — invalid or missing API key" },
        "429": { description: "Rate limit exceeded" },
        "500": { description: "Internal server error" },
      },
    };
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Qyburn IT Admin API",
      description:
        "Public REST API for Qyburn IT administration platform. Query licenses, groups, submit requests, and monitor IT health programmatically.",
      version: "1.0.0",
      contact: {
        name: "SAGA Diagnostics IT",
        email: "it@saga.com",
      },
    },
    servers: [
      {
        url: "https://qyburn.sagadiagnostics.com",
        description: "Production",
      },
      {
        url: "http://localhost:3000",
        description: "Development",
      },
    ],
    security: [{ ApiKeyAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },
    paths,
  };
}
