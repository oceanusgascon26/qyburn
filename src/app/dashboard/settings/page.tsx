import { Settings, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-silver-400 mt-1">
            Configure Qyburn&apos;s behavior and integrations.
          </p>
        </div>
        <button className="qy-btn-primary">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slack config */}
        <div className="qy-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Slack Connection
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Bot Token
              </label>
              <input
                type="password"
                placeholder="xoxb-..."
                className="qy-input"
                defaultValue="xoxb-stub-token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                App Token
              </label>
              <input
                type="password"
                placeholder="xapp-..."
                className="qy-input"
                defaultValue="xapp-stub-token"
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
          <h3 className="text-lg font-semibold text-white mb-4">
            Microsoft Azure AD
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Tenant ID
              </label>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="qy-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Client ID
              </label>
              <input type="text" placeholder="Client ID" className="qy-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Client Secret
              </label>
              <input
                type="password"
                placeholder="Client Secret"
                className="qy-input"
              />
            </div>
          </div>
        </div>

        {/* AI config */}
        <div className="qy-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Anthropic (Claude AI)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                API Key
              </label>
              <input
                type="password"
                placeholder="sk-ant-..."
                className="qy-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                Model
              </label>
              <select className="qy-input">
                <option>claude-sonnet-4-20250514</option>
                <option>claude-haiku-4-5-20251001</option>
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
                defaultValue="SAGA Diagnostics"
                className="qy-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-300 mb-1.5">
                IT Admin Channel
              </label>
              <input
                type="text"
                defaultValue="#it-admin"
                className="qy-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
