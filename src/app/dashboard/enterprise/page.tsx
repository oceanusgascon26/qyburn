"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Shield,
  Puzzle,
  Globe,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  plan: string;
  settings: Record<string, unknown>;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  permissions: { action: string; resource: string; conditions?: Record<string, unknown> }[];
  spendingLimit?: number;
  delegationRules?: { canDelegateTo: string[]; maxDuration: number };
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  author: string;
  config: Record<string, { type: string; label: string; required: boolean }>;
  hooks: Record<string, boolean>;
  enabled: boolean;
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: { name: string; type: string; required: boolean }[];
  auth: string;
  rateLimit: number;
}

// ─── Component ───────────────────────────────────────────────

export default function EnterprisePage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "tenants" | "rbac" | "plugins" | "api"
  >("tenants");

  // Data
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [installingPlugin, setInstallingPlugin] = useState<string | null>(null);

  // Static data (from lib modules)
  const tenants: Tenant[] = [
    {
      id: "tenant-default",
      name: "SAGA Diagnostics",
      slug: "saga",
      domain: "saga.com",
      plan: "enterprise",
      settings: { maxUsers: 500, ssoEnabled: true, customBranding: true, apiAccess: true },
      createdAt: "2024-06-01T00:00:00Z",
    },
  ];

  const roles: Role[] = [
    {
      id: "it_admin",
      name: "IT Admin",
      permissions: [{ action: "*", resource: "*" }],
      spendingLimit: undefined,
      delegationRules: { canDelegateTo: ["it_manager", "it_support", "department_manager"], maxDuration: 720 },
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
      delegationRules: { canDelegateTo: ["it_support", "department_manager"], maxDuration: 168 },
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
      delegationRules: { canDelegateTo: [], maxDuration: 24 },
    },
    {
      id: "department_manager",
      name: "Department Manager",
      permissions: [
        { action: "approve", resource: "license_request", conditions: { departmentMatch: true } },
        { action: "approve", resource: "group_request", conditions: { departmentMatch: true } },
        { action: "view", resource: "analytics", conditions: { departmentMatch: true } },
        { action: "view", resource: "own_department_users" },
      ],
      spendingLimit: 2000,
      delegationRules: { canDelegateTo: ["employee"], maxDuration: 48 },
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
    },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pluginRes, docsRes] = await Promise.all([
        fetch("/api/plugins"),
        fetch("/api/v1/docs"),
      ]);

      if (pluginRes.ok) {
        const pData = await pluginRes.json();
        setPlugins(pData.catalog ?? []);
        setInstalledPlugins(pData.installed ?? []);
      }

      if (docsRes.ok) {
        const dData = await docsRes.json();
        setApiEndpoints(dData.catalog ?? []);
      }
    } catch {
      toast.error("Failed to load enterprise data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInstallPlugin = async (pluginId: string) => {
    setInstallingPlugin(pluginId);
    try {
      const res = await fetch("/api/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "install",
          pluginId,
          config: { placeholder: "configure-me" },
        }),
      });

      if (res.ok) {
        toast.success("Plugin installed");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Install failed");
      }
    } finally {
      setInstallingPlugin(null);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    const res = await fetch("/api/plugins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "uninstall", pluginId }),
    });

    if (res.ok) {
      toast.success("Plugin uninstalled");
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Uninstall failed");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "password_manager":
        return "bg-blue-900/30 text-blue-400";
      case "mdm":
        return "bg-purple-900/30 text-purple-400";
      case "siem":
        return "bg-red-900/30 text-red-400";
      case "identity":
        return "bg-green-900/30 text-green-400";
      case "custom":
        return "bg-yellow-900/30 text-yellow-400";
      default:
        return "bg-qy-surface text-silver-400";
    }
  };

  const methodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-900/30 text-green-400";
      case "POST":
        return "bg-blue-900/30 text-blue-400";
      case "PUT":
        return "bg-yellow-900/30 text-yellow-400";
      case "DELETE":
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-qy-surface text-silver-400";
    }
  };

  const tabs = [
    { id: "tenants" as const, label: "Tenants", icon: Building2 },
    { id: "rbac" as const, label: "RBAC", icon: Shield },
    { id: "plugins" as const, label: "Plugins", icon: Puzzle },
    { id: "api" as const, label: "API Portal", icon: Globe },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Enterprise</h1>
          <p className="text-sm text-silver-400 mt-1">Loading...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="qy-skeleton h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Enterprise</h1>
          <p className="text-sm text-silver-400 mt-1">
            Multi-tenant management, RBAC, plugins, and API portal
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-silver-400 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-qy-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-wildfire-500 text-white"
                : "border-transparent text-silver-400 hover:text-silver-200"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tenants Tab ───────────────────────────────── */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="qy-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {tenant.name}
                  </h3>
                  <p className="text-sm text-silver-400 mt-1">
                    {tenant.domain} &middot; {tenant.slug}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-wildfire-900/30 text-wildfire-400 capitalize">
                  {tenant.plan}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {Object.entries(tenant.settings).map(([key, value]) => (
                  <div key={key} className="border border-qy-border rounded-lg p-3">
                    <p className="text-xs text-silver-500 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-sm font-medium text-white mt-1">
                      {typeof value === "boolean" ? (
                        value ? (
                          <Check className="h-4 w-4 text-green-400 inline" />
                        ) : (
                          <X className="h-4 w-4 text-red-400 inline" />
                        )
                      ) : (
                        String(value)
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-silver-500 mt-4">
                Created{" "}
                {new Date(tenant.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
          <p className="text-sm text-silver-500 text-center py-4">
            Single-tenant deployment. Multi-tenant provisioning available on Enterprise plan.
          </p>
        </div>
      )}

      {/* ─── RBAC Tab ──────────────────────────────────── */}
      {activeTab === "rbac" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="qy-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">
                  {role.name}
                </h3>
                {role.spendingLimit !== undefined ? (
                  <span className="text-xs text-silver-400">
                    ${role.spendingLimit.toLocaleString()}/mo
                  </span>
                ) : (
                  <span className="text-xs text-wildfire-400">Unlimited</span>
                )}
              </div>
              <div className="space-y-1.5">
                {role.permissions.map((perm, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-qy-surface-light text-silver-300 font-mono">
                      {perm.action}
                    </span>
                    <span className="text-silver-500">{perm.resource.replace(/_/g, " ")}</span>
                    {Boolean(perm.conditions?.departmentMatch) && (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400 text-[10px]">
                        dept only
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {role.delegationRules && (
                <div className="mt-3 pt-3 border-t border-qy-border">
                  <p className="text-[10px] text-silver-500 uppercase tracking-wider mb-1">
                    Delegation
                  </p>
                  <p className="text-xs text-silver-400">
                    Can delegate to:{" "}
                    {role.delegationRules.canDelegateTo.length > 0
                      ? role.delegationRules.canDelegateTo.join(", ")
                      : "none"}
                  </p>
                  <p className="text-xs text-silver-400">
                    Max: {role.delegationRules.maxDuration}h
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Plugins Tab ───────────────────────────────── */}
      {activeTab === "plugins" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="qy-card text-center">
              <p className="text-2xl font-bold text-white">{plugins.length}</p>
              <p className="text-xs text-silver-400">Available</p>
            </div>
            <div className="qy-card text-center">
              <p className="text-2xl font-bold text-green-400">
                {installedPlugins.length}
              </p>
              <p className="text-xs text-silver-400">Installed</p>
            </div>
            <div className="qy-card text-center">
              <p className="text-2xl font-bold text-blue-400">
                {new Set(plugins.map((p) => p.category)).size}
              </p>
              <p className="text-xs text-silver-400">Categories</p>
            </div>
            <div className="qy-card text-center">
              <p className="text-2xl font-bold text-purple-400">
                {plugins.reduce(
                  (sum, p) =>
                    sum + Object.values(p.hooks).filter(Boolean).length,
                  0
                )}
              </p>
              <p className="text-xs text-silver-400">Total Hooks</p>
            </div>
          </div>

          <div className="space-y-3">
            {plugins.map((plugin) => {
              const isInstalled = installedPlugins.some(
                (ip) => ip.id === plugin.id
              );
              return (
                <div
                  key={plugin.id}
                  className="border border-qy-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedPlugin(
                        expandedPlugin === plugin.id ? null : plugin.id
                      )
                    }
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-qy-surface-light/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${categoryColor(plugin.category)}`}
                      >
                        {plugin.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-medium text-white truncate">
                        {plugin.name}
                      </span>
                      <span className="text-xs text-silver-500">
                        v{plugin.version}
                      </span>
                      {isInstalled && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-green-900/30 text-green-400">
                          Installed
                        </span>
                      )}
                    </div>
                    {expandedPlugin === plugin.id ? (
                      <ChevronUp className="h-4 w-4 text-silver-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-silver-500 flex-shrink-0" />
                    )}
                  </button>
                  {expandedPlugin === plugin.id && (
                    <div className="px-4 pb-4 border-t border-qy-border pt-3 space-y-3">
                      <p className="text-sm text-silver-300">
                        {plugin.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-silver-500">
                          Author: {plugin.author}
                        </span>
                        <span className="text-xs text-silver-500">|</span>
                        <span className="text-xs text-silver-500">
                          Hooks:{" "}
                          {Object.entries(plugin.hooks)
                            .filter(([, v]) => v)
                            .map(([k]) => k)
                            .join(", ")}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-silver-500 mb-1">
                          Configuration:
                        </p>
                        <div className="space-y-1">
                          {Object.entries(plugin.config).map(
                            ([key, schema]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span className="font-mono text-silver-300">
                                  {key}
                                </span>
                                <span className="text-silver-500">
                                  ({schema.type})
                                </span>
                                {schema.required && (
                                  <span className="text-red-400">
                                    required
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {isInstalled ? (
                          <button
                            onClick={() =>
                              handleUninstallPlugin(plugin.id)
                            }
                            className="px-4 py-2 text-xs font-medium rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                          >
                            Uninstall
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleInstallPlugin(plugin.id)
                            }
                            disabled={installingPlugin === plugin.id}
                            className="px-4 py-2 text-xs font-medium rounded-lg bg-qyburn-700 text-white hover:bg-qyburn-600 transition-colors disabled:opacity-50"
                          >
                            {installingPlugin === plugin.id
                              ? "Installing..."
                              : "Install"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── API Portal Tab ────────────────────────────── */}
      {activeTab === "api" && (
        <div className="space-y-4">
          <div className="qy-card">
            <h3 className="text-sm font-semibold text-white mb-2">
              Authentication
            </h3>
            <p className="text-xs text-silver-400 mb-3">
              All API requests require an{" "}
              <code className="px-1.5 py-0.5 rounded bg-qy-surface-light text-silver-300">
                X-API-Key
              </code>{" "}
              header.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-qy-surface-light text-silver-300 text-xs font-mono truncate">
                curl -H &quot;X-API-Key: qyb_live_saga_k8s2f9x0m1&quot;
                https://qyburn.sagadiagnostics.com/api/v1/health
              </code>
              <button
                onClick={() =>
                  copyToClipboard(
                    'curl -H "X-API-Key: qyb_live_saga_k8s2f9x0m1" https://qyburn.sagadiagnostics.com/api/v1/health'
                  )
                }
                className="p-2 rounded-lg text-silver-400 hover:text-white hover:bg-qy-surface-light transition-colors flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {apiEndpoints.map((endpoint) => {
              const endpointKey = `${endpoint.method}-${endpoint.path}`;
              const curlExample =
                endpoint.method === "GET"
                  ? `curl -H "X-API-Key: YOUR_KEY" https://qyburn.sagadiagnostics.com${endpoint.path.replace(/:(\w+)/g, "EXAMPLE")}`
                  : `curl -X POST -H "X-API-Key: YOUR_KEY" -H "Content-Type: application/json" -d '{}' https://qyburn.sagadiagnostics.com${endpoint.path}`;

              return (
                <div
                  key={endpointKey}
                  className="border border-qy-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedEndpoint(
                        expandedEndpoint === endpointKey
                          ? null
                          : endpointKey
                      )
                    }
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-qy-surface-light/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${methodColor(endpoint.method)}`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-silver-200 font-mono truncate">
                        {endpoint.path}
                      </code>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-silver-500">
                        {endpoint.rateLimit} req/min
                      </span>
                      {expandedEndpoint === endpointKey ? (
                        <ChevronUp className="h-4 w-4 text-silver-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-silver-500" />
                      )}
                    </div>
                  </button>
                  {expandedEndpoint === endpointKey && (
                    <div className="px-4 pb-4 border-t border-qy-border pt-3 space-y-3">
                      <p className="text-sm text-silver-300">
                        {endpoint.description}
                      </p>
                      {endpoint.parameters.length > 0 && (
                        <div>
                          <p className="text-xs text-silver-500 mb-1">
                            Parameters:
                          </p>
                          <div className="space-y-1">
                            {endpoint.parameters.map((param) => (
                              <div
                                key={param.name}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span className="font-mono text-silver-300">
                                  {param.name}
                                </span>
                                <span className="text-silver-500">
                                  ({param.type})
                                </span>
                                {param.required && (
                                  <span className="text-red-400">
                                    required
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-silver-500 mb-1">
                          Example:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 rounded-lg bg-qy-surface-light text-silver-300 text-[11px] font-mono truncate">
                            {curlExample}
                          </code>
                          <button
                            onClick={() => copyToClipboard(curlExample)}
                            className="p-1.5 rounded-lg text-silver-400 hover:text-white hover:bg-qy-surface-light transition-colors flex-shrink-0"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <a
              href="/api/v1/docs"
              target="_blank"
              className="flex items-center gap-2 text-sm text-qyburn-400 hover:text-qyburn-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View full OpenAPI specification
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
