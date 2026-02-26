import {
  KeyRound,
  Users,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Clock,
  Flame,
} from "lucide-react";

const stats = [
  {
    label: "Active Licenses",
    value: "247",
    change: "+12 this month",
    icon: KeyRound,
    color: "text-qyburn-400",
    bgColor: "bg-qyburn-900/40",
  },
  {
    label: "Bot Requests (24h)",
    value: "83",
    change: "+18% vs last week",
    icon: MessageSquare,
    color: "text-wildfire-400",
    bgColor: "bg-wildfire-900/40",
  },
  {
    label: "Managed Users",
    value: "156",
    change: "3 pending onboarding",
    icon: Users,
    color: "text-silver-300",
    bgColor: "bg-silver-800/40",
  },
  {
    label: "Restricted Groups",
    value: "14",
    change: "2 pending approvals",
    icon: ShieldCheck,
    color: "text-qyburn-300",
    bgColor: "bg-qyburn-900/40",
  },
];

const recentActivity = [
  {
    user: "anna.lindberg",
    action: "requested access to",
    target: "Adobe Creative Cloud",
    time: "2 min ago",
    status: "pending",
  },
  {
    user: "erik.svensson",
    action: "was auto-provisioned",
    target: "Microsoft 365 E3",
    time: "15 min ago",
    status: "completed",
  },
  {
    user: "maria.chen",
    action: "asked Qyburn about",
    target: "VPN setup",
    time: "32 min ago",
    status: "completed",
  },
  {
    user: "james.patel",
    action: "requested to join",
    target: "SG-Engineering-Admin",
    time: "1 hr ago",
    status: "pending",
  },
  {
    user: "lisa.berg",
    action: "completed onboarding step",
    target: "Security Training",
    time: "2 hr ago",
    status: "completed",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-silver-400 mt-1">
            Welcome back. Here&apos;s what&apos;s happening with Qyburn today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-silver-400">
          <Clock className="h-4 w-4" />
          Last updated: just now
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="qy-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver-400">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-silver-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-wildfire-500" />
                  {stat.change}
                </p>
              </div>
              <div
                className={`${stat.bgColor} rounded-lg p-2.5 transition-transform group-hover:scale-110`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 qy-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <span className="qy-badge-purple">Live</span>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-qy-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-qyburn-800 flex items-center justify-center text-xs font-bold text-qyburn-300">
                    {item.user
                      .split(".")
                      .map((n) => n[0].toUpperCase())
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm text-silver-200">
                      <span className="font-medium text-white">
                        {item.user}
                      </span>{" "}
                      {item.action}{" "}
                      <span className="font-medium text-qyburn-300">
                        {item.target}
                      </span>
                    </p>
                    <p className="text-xs text-silver-500">{item.time}</p>
                  </div>
                </div>
                <span
                  className={
                    item.status === "completed"
                      ? "qy-badge-green"
                      : "qy-badge-purple"
                  }
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick info */}
        <div className="qy-card">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-wildfire-400" />
            <h2 className="text-lg font-semibold text-white">Bot Status</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Status</span>
              <span className="flex items-center gap-1.5 text-sm text-wildfire-400">
                <span className="h-2 w-2 rounded-full bg-wildfire-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Uptime</span>
              <span className="text-sm text-silver-200">14d 6h 32m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Avg Response</span>
              <span className="text-sm text-silver-200">1.2s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Resolution Rate</span>
              <span className="text-sm text-wildfire-400">94%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-400">Knowledge Docs</span>
              <span className="text-sm text-silver-200">38</span>
            </div>
            <hr className="border-qy-border" />
            <div className="text-center">
              <p className="text-xs text-silver-500">
                Connected to Slack workspace
              </p>
              <p className="text-sm font-medium text-qyburn-300 mt-1">
                SAGA Diagnostics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
