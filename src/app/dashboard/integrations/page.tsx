"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Clock,
  ExternalLink,
  Ticket,
  Shield,
  Monitor,
  BookOpen,
} from "lucide-react";

interface IntegrationStatus {
  name: string;
  key: string;
  connected: boolean;
  mode: "live" | "stub";
  lastSync?: string;
  envVar: string;
}

interface SyncEvent {
  id: string;
  integration: string;
  direction: string;
  entityType: string;
  recordCount: number;
  status: string;
  syncedAt: string;
}

const integrationIcons: Record<string, typeof Plug> = {
  jira: Ticket,
  servicenow: Ticket,
  intune: Monitor,
  defender: Shield,
  confluence: BookOpen,
};

const integrationColors: Record<string, string> = {
  jira: "text-blue-400 bg-blue-900/40",
  servicenow: "text-green-400 bg-green-900/40",
  intune: "text-cyan-400 bg-cyan-900/40",
  defender: "text-red-400 bg-red-900/40",
  confluence: "text-amber-400 bg-amber-900/40",
};

// Mock sync events for display
const mockSyncEvents: SyncEvent[] = [
  {
    id: "sync-1",
    integration: "Jira",
    direction: "inbound",
    entityType: "tickets",
    recordCount: 12,
    status: "success",
    syncedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "sync-2",
    integration: "Confluence",
    direction: "inbound",
    entityType: "pages",
    recordCount: 4,
    status: "success",
    syncedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "sync-3",
    integration: "Intune",
    direction: "inbound",
    entityType: "devices",
    recordCount: 15,
    status: "success",
    syncedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "sync-4",
    integration: "Defender",
    direction: "inbound",
    entityType: "alerts",
    recordCount: 5,
    status: "success",
    syncedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "sync-5",
    integration: "ServiceNow",
    direction: "outbound",
    entityType: "incidents",
    recordCount: 2,
    status: "partial",
    syncedAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [syncEvents] = useState<SyncEvent[]>(mockSyncEvents);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/status");
      const data = await res.json();
      setIntegrations(data.integrations ?? []);
    } catch (err) {
      console.error("Failed to fetch integration status:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integration Hub</h1>
          <p className="text-sm text-silver-400 mt-1">
            {connectedCount} of {integrations.length} integrations connected.
            Configure external systems for bi-directional sync.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 text-sm text-silver-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Integration Status Cards */}
      {loading && integrations.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="qy-skeleton h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => {
            const Icon = integrationIcons[integration.key] ?? Plug;
            const colorClass =
              integrationColors[integration.key] ??
              "text-silver-400 bg-silver-900/40";
            const [textColor, bgColor] = colorClass.split(" ");

            return (
              <div key={integration.key} className="qy-card group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-lg p-2.5 ${bgColor}`}>
                    <Icon className={`h-5 w-5 ${textColor}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {integration.connected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-wildfire-400" />
                        <span className="text-xs text-wildfire-400 font-medium">
                          Connected
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-silver-500" />
                        <span className="text-xs text-silver-500 font-medium">
                          Stub Mode
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">
                  {integration.name}
                </h3>

                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-silver-500">Mode</span>
                    <span
                      className={
                        integration.mode === "live"
                          ? "text-wildfire-400"
                          : "text-silver-400"
                      }
                    >
                      {integration.mode === "live" ? "Live" : "Stub (Demo)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-silver-500">Last Sync</span>
                    <span className="text-silver-300">
                      {integration.lastSync
                        ? relativeTime(integration.lastSync)
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-silver-500">Env Var</span>
                    <code className="text-xs font-mono text-qyburn-300 bg-qyburn-900/50 px-1.5 py-0.5 rounded">
                      {integration.envVar}
                    </code>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two columns: Recent Syncs + Connection Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Syncs */}
        <div className="lg:col-span-2 qy-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-qyburn-400" />
              Recent Syncs
            </h2>
            <span className="qy-badge-purple">
              {syncEvents.length} events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-qy-border">
                  <th className="text-left py-2 px-3 text-silver-500 font-medium">
                    Integration
                  </th>
                  <th className="text-left py-2 px-3 text-silver-500 font-medium">
                    Direction
                  </th>
                  <th className="text-left py-2 px-3 text-silver-500 font-medium">
                    Type
                  </th>
                  <th className="text-right py-2 px-3 text-silver-500 font-medium">
                    Records
                  </th>
                  <th className="text-left py-2 px-3 text-silver-500 font-medium">
                    Status
                  </th>
                  <th className="text-right py-2 px-3 text-silver-500 font-medium">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {syncEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-qy-border/50 last:border-0"
                  >
                    <td className="py-2.5 px-3 text-white font-medium">
                      {event.integration}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          event.direction === "inbound"
                            ? "bg-blue-900/30 text-blue-400"
                            : "bg-amber-900/30 text-amber-400"
                        }`}
                      >
                        {event.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-silver-300 capitalize">
                      {event.entityType}
                    </td>
                    <td className="py-2.5 px-3 text-right text-silver-200 font-mono">
                      {event.recordCount}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          event.status === "success"
                            ? "bg-wildfire-900/30 text-wildfire-400"
                            : event.status === "failed"
                              ? "bg-red-900/30 text-red-400"
                              : "bg-amber-900/30 text-amber-400"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-silver-400">
                      {relativeTime(event.syncedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connection Setup */}
        <div className="qy-card">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Plug className="h-5 w-5 text-qyburn-400" />
            Setup Guide
          </h2>

          <div className="space-y-4 text-sm">
            <p className="text-silver-400">
              To connect a live integration, set the required environment
              variables and restart:
            </p>

            <div className="space-y-3">
              <div>
                <p className="font-medium text-white mb-1">Jira</p>
                <code className="block text-xs font-mono text-qyburn-300 bg-qyburn-950 p-2 rounded">
                  JIRA_BASE_URL=https://your-domain.atlassian.net
                  <br />
                  JIRA_EMAIL=you@company.com
                  <br />
                  JIRA_API_TOKEN=your-token
                </code>
              </div>

              <div>
                <p className="font-medium text-white mb-1">ServiceNow</p>
                <code className="block text-xs font-mono text-qyburn-300 bg-qyburn-950 p-2 rounded">
                  SERVICENOW_INSTANCE=https://your-instance.service-now.com
                  <br />
                  SERVICENOW_USERNAME=admin
                  <br />
                  SERVICENOW_PASSWORD=your-password
                </code>
              </div>

              <div>
                <p className="font-medium text-white mb-1">
                  Intune / Defender
                </p>
                <code className="block text-xs font-mono text-qyburn-300 bg-qyburn-950 p-2 rounded">
                  AZURE_CLIENT_ID=your-app-id
                  <br />
                  AZURE_CLIENT_SECRET=your-secret
                  <br />
                  AZURE_TENANT_ID=your-tenant-id
                </code>
              </div>

              <div>
                <p className="font-medium text-white mb-1">Confluence</p>
                <code className="block text-xs font-mono text-qyburn-300 bg-qyburn-950 p-2 rounded">
                  CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
                  <br />
                  CONFLUENCE_EMAIL=you@company.com
                  <br />
                  CONFLUENCE_API_TOKEN=your-token
                </code>
              </div>
            </div>

            <p className="text-silver-500 text-xs mt-4">
              All integrations run in stub mode with realistic mock data when
              environment variables are not set.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
