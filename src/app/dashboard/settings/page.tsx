"use client";

import { useState } from "react";
import { Save, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    slackBotToken: "xoxb-stub-token",
    slackAppToken: "xapp-stub-token",
    azureTenantId: "",
    azureClientId: "",
    azureClientSecret: "",
    anthropicApiKey: "",
    anthropicModel: "claude-sonnet-4-20250514",
    orgName: "SAGA Diagnostics",
    adminChannel: "#it-admin",
    autoApproveDefault: false,
    maxSeatsWarningPct: 90,
  });

  const set = (key: string, value: string | boolean | number) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    // Simulate save delay
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved successfully", {
      description: "Configuration has been updated. Changes take effect immediately.",
      icon: <CheckCircle2 className="h-4 w-4 text-wildfire-400" />,
    });
  };

  const handleTestConnection = async (service: string) => {
    toast.info(`Testing ${service} connection...`);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(`${service} connection successful (stub mode)`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-silver-400 mt-1">
            Configure Qyburn&apos;s behavior and integrations.
          </p>
        </div>
        <button
          className="qy-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slack config */}
        <div className="qy-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Slack Connection
            </h3>
            <button
              onClick={() => handleTestConnection("Slack")}
              className="qy-btn-secondary text-xs px-3 py-1.5"
            >
              Test Connection
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Bot Token
              </label>
              <input
                type="password"
                placeholder="xoxb-..."
                className="qy-input"
                value={config.slackBotToken}
                onChange={(e) => set("slackBotToken", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                App Token (Socket Mode)
              </label>
              <input
                type="password"
                placeholder="xapp-..."
                className="qy-input"
                value={config.slackAppToken}
                onChange={(e) => set("slackAppToken", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-wildfire-500" />
              <span className="text-wildfire-400">Connected (stub mode)</span>
            </div>
          </div>
        </div>

        {/* Azure AD config */}
        <div className="qy-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Microsoft Azure AD
            </h3>
            <button
              onClick={() => handleTestConnection("Azure AD")}
              className="qy-btn-secondary text-xs px-3 py-1.5"
            >
              Test Connection
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Tenant ID
              </label>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="qy-input font-mono text-xs"
                value={config.azureTenantId}
                onChange={(e) => set("azureTenantId", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Client ID
              </label>
              <input
                type="text"
                placeholder="Application (client) ID"
                className="qy-input font-mono text-xs"
                value={config.azureClientId}
                onChange={(e) => set("azureClientId", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Client Secret
              </label>
              <input
                type="password"
                placeholder="Client Secret Value"
                className="qy-input"
                value={config.azureClientSecret}
                onChange={(e) => set("azureClientSecret", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* AI config */}
        <div className="qy-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Anthropic (Claude AI)
            </h3>
            <button
              onClick={() => handleTestConnection("Anthropic")}
              className="qy-btn-secondary text-xs px-3 py-1.5"
            >
              Test Connection
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                API Key
              </label>
              <input
                type="password"
                placeholder="sk-ant-..."
                className="qy-input"
                value={config.anthropicApiKey}
                onChange={(e) => set("anthropicApiKey", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Model
              </label>
              <select
                className="qy-input"
                value={config.anthropicModel}
                onChange={(e) => set("anthropicModel", e.target.value)}
              >
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Faster)</option>
              </select>
            </div>
          </div>
        </div>

        {/* General */}
        <div className="qy-card">
          <h3 className="text-lg font-semibold text-white mb-4">General</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                className="qy-input"
                value={config.orgName}
                onChange={(e) => set("orgName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                IT Admin Channel
              </label>
              <input
                type="text"
                className="qy-input"
                value={config.adminChannel}
                onChange={(e) => set("adminChannel", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Seat Warning Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                className="qy-input"
                value={config.maxSeatsWarningPct}
                onChange={(e) =>
                  set("maxSeatsWarningPct", parseInt(e.target.value) || 90)
                }
              />
              <p className="text-xs text-silver-500 mt-1">
                Alert when license usage exceeds this percentage.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoApproveDefault"
                checked={config.autoApproveDefault}
                onChange={(e) => set("autoApproveDefault", e.target.checked)}
                className="h-4 w-4 rounded border-qy-border bg-qy-surface text-qyburn-500 focus:ring-qyburn-500"
              />
              <label
                htmlFor="autoApproveDefault"
                className="text-sm text-silver-300"
              >
                Auto-approve new licenses by default
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
