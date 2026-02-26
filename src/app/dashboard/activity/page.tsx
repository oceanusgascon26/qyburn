"use client";

import {
  Bot,
  MessageSquare,
  Zap,
  Clock,
  CheckCircle2,
  TrendingUp,
  User,
  ArrowRight,
  Flame,
} from "lucide-react";

const botStats = [
  {
    label: "Messages (24h)",
    value: "83",
    icon: MessageSquare,
    color: "text-qyburn-400",
    bg: "bg-qyburn-900/40",
  },
  {
    label: "Resolved",
    value: "78",
    icon: CheckCircle2,
    color: "text-wildfire-400",
    bg: "bg-wildfire-900/40",
  },
  {
    label: "Avg Response",
    value: "1.2s",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-900/40",
  },
  {
    label: "Resolution Rate",
    value: "94%",
    icon: TrendingUp,
    color: "text-wildfire-400",
    bg: "bg-wildfire-900/40",
  },
];

const activityBreakdown = [
  { label: "License Requests", count: 28, pct: 34, color: "bg-qyburn-500" },
  { label: "KB Queries", count: 22, pct: 27, color: "bg-blue-500" },
  { label: "Group Access", count: 15, pct: 18, color: "bg-wildfire-500" },
  { label: "Password Help", count: 12, pct: 14, color: "bg-yellow-500" },
  { label: "Other", count: 6, pct: 7, color: "bg-silver-500" },
];

interface Conversation {
  id: string;
  user: string;
  avatar: string;
  query: string;
  response: string;
  type: string;
  resolved: boolean;
  time: string;
  responseTime: string;
}

const recentConversations: Conversation[] = [
  {
    id: "c1",
    user: "anna.lindberg",
    avatar: "AL",
    query: "How do I set up VPN on my new laptop?",
    response:
      "I provided the VPN setup guide and confirmed Anna is in SG-VPN-Users group.",
    type: "KB Query",
    resolved: true,
    time: "2 min ago",
    responseTime: "0.8s",
  },
  {
    id: "c2",
    user: "erik.svensson",
    avatar: "ES",
    query: "I need a JetBrains license for my new project",
    response:
      "Auto-approved JetBrains All Products license (engineering dept). Provisioned via Graph API.",
    type: "License Request",
    resolved: true,
    time: "15 min ago",
    responseTime: "1.1s",
  },
  {
    id: "c3",
    user: "james.patel",
    avatar: "JP",
    query: "Can I get access to the SG-Engineering-Admin group?",
    response:
      "Submitted access request to VP Engineering for approval. Justification required.",
    type: "Group Access",
    resolved: false,
    time: "32 min ago",
    responseTime: "1.4s",
  },
  {
    id: "c4",
    user: "maria.chen",
    avatar: "MC",
    query: "I need to onboard a new team member starting Monday",
    response:
      "Initiated Lab Technician Onboarding template. Awaiting employee details.",
    type: "Onboarding",
    resolved: false,
    time: "1 hr ago",
    responseTime: "1.8s",
  },
  {
    id: "c5",
    user: "lisa.berg",
    avatar: "LB",
    query: "My password expired, how do I reset it?",
    response:
      "Directed to self-service password reset portal. Provided password policy requirements.",
    type: "KB Query",
    resolved: true,
    time: "2 hr ago",
    responseTime: "0.6s",
  },
];

function StatBar({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-silver-300 w-32 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-3 rounded-full bg-qy-surface-light overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-silver-400 w-16 text-right font-mono">
        {count} ({pct}%)
      </span>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bot Activity</h1>
          <p className="text-sm text-silver-400 mt-1">
            Monitor Qyburn&apos;s conversations and performance in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-wildfire-900/20 border border-wildfire-800/40 rounded-full px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-wildfire-500 animate-pulse" />
          <span className="text-sm font-medium text-wildfire-400">
            Bot Online
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {botStats.map((stat) => (
          <div key={stat.label} className="qy-card">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-silver-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity breakdown */}
        <div className="qy-card">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="h-5 w-5 text-wildfire-400" />
            <h2 className="text-lg font-semibold text-white">
              Activity Breakdown
            </h2>
          </div>
          <div className="space-y-3">
            {activityBreakdown.map((item) => (
              <StatBar key={item.label} {...item} />
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-qy-border text-center">
            <p className="text-xs text-silver-500">
              Based on last 24 hours of activity
            </p>
          </div>
        </div>

        {/* Recent conversations */}
        <div className="lg:col-span-2 qy-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">
              Recent Conversations
            </h2>
            <span className="qy-badge-purple">
              {recentConversations.length} conversations
            </span>
          </div>
          <div className="space-y-4">
            {recentConversations.map((conv) => (
              <div
                key={conv.id}
                className="bg-qy-surface-light/30 rounded-lg p-4 border border-qy-border/50"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-qyburn-800 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-qyburn-300">
                        {conv.avatar}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {conv.user}
                    </span>
                    <ArrowRight className="h-3 w-3 text-silver-600" />
                    <div className="flex items-center gap-1">
                      <Bot className="h-3.5 w-3.5 text-wildfire-400" />
                      <span className="text-sm text-wildfire-400">Qyburn</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-silver-500 font-mono flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {conv.responseTime}
                    </span>
                    <span className="text-xs text-silver-500">{conv.time}</span>
                  </div>
                </div>
                {/* Query & Response */}
                <div className="space-y-2 ml-9">
                  <div className="flex items-start gap-2">
                    <User className="h-3.5 w-3.5 text-silver-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-silver-300">{conv.query}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bot className="h-3.5 w-3.5 text-qyburn-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-silver-400">{conv.response}</p>
                  </div>
                </div>
                {/* Footer */}
                <div className="flex items-center gap-2 mt-2 ml-9">
                  <span className="qy-badge-purple text-[10px]">
                    {conv.type}
                  </span>
                  {conv.resolved ? (
                    <span className="qy-badge-green text-[10px] flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" />
                      Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 qy-badge bg-yellow-900/40 text-yellow-300 text-[10px]">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
