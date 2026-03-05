"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  PenLine,
  BarChart3,
  Star,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface ConversationItem {
  id: string;
  userId: string;
  userEmail: string;
  status: "active" | "resolved" | "escalated";
  intent?: string;
  confidence?: number;
  messages: {
    id: string;
    role: string;
    content: string;
    intent?: string;
    confidence?: number;
    createdAt: string;
  }[];
  satisfaction?: number;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsSummary {
  totalConversations: number;
  resolutionRate: number;
  escalationRate: number;
  avgTurnsToResolve: number;
  avgConfidence: number;
  avgSatisfaction: number | null;
  avgResponseLatencyMs: number;
  intentDistribution: { intent: string; count: number; percentage: number }[];
  topUnansweredQuestions: { question: string; count: number }[];
  busiestHours: { hour: number; count: number }[];
  busiestDays: { day: string; count: number }[];
}

interface KnowledgeGapItem {
  id: string;
  question: string;
  intent: string | null;
  frequency: number;
  status: "open" | "addressed" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

interface FeedbackItem {
  id: string;
  conversationId: string | null;
  userId: string;
  rating: number;
  comment: string | null;
  intent: string | null;
  wasHelpful: boolean | null;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Active
        </span>
      );
    case "resolved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-300">
          <CheckCircle2 className="h-3 w-3" />
          Resolved
        </span>
      );
    case "escalated":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-300">
          <AlertTriangle className="h-3 w-3" />
          Escalated
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-silver-400">
          {status}
        </span>
      );
  }
}

function confidenceBadge(confidence: number | undefined) {
  if (confidence === undefined) return <span className="text-silver-500">--</span>;
  const pct = Math.round(confidence * 100);
  let color = "text-red-400";
  if (pct >= 70) color = "text-green-400";
  else if (pct >= 40) color = "text-yellow-400";
  return <span className={`text-xs font-mono ${color}`}>{pct}%</span>;
}

// ─── Main Page ───────────────────────────────────────────────

export default function ConversationsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [gaps, setGaps] = useState<KnowledgeGapItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, convRes, gapsRes, feedbackRes] = await Promise.all([
        fetch("/api/analytics/bot"),
        fetch("/api/conversations"),
        fetch("/api/knowledge-gaps"),
        fetch("/api/feedback"),
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data.items ?? []);
      }
      if (gapsRes.ok) {
        const data = await gapsRes.json();
        setGaps(data.items ?? []);
      }
      if (feedbackRes.ok) {
        const data = await feedbackRes.json();
        setFeedback(data.items ?? []);
      }
    } catch (err) {
      console.error("[Conversations] Fetch error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Computed values ──────────────────────────────────────

  const totalConvs = analytics?.totalConversations ?? conversations.length;
  const resolutionRate = analytics?.resolutionRate ?? 0;
  const avgTurns = analytics?.avgTurnsToResolve ?? 0;
  const escalationRate = analytics?.escalationRate ?? 0;
  const avgSatisfaction = analytics?.avgSatisfaction;
  const intentDist = analytics?.intentDistribution ?? [];

  // Feedback summary
  const totalFeedback = feedback.length;
  const avgRating =
    totalFeedback > 0
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
      : 0;
  const helpfulCount = feedback.filter((f) => f.wasHelpful === true).length;
  const notHelpfulCount = feedback.filter((f) => f.wasHelpful === false).length;

  // Filtered conversations
  const filteredConvs = conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.userEmail.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q) ||
        (c.intent ?? "").toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Open knowledge gaps
  const openGaps = gaps.filter((g) => g.status === "open");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Conversation Analytics
          </h1>
          <p className="text-sm text-silver-400 mt-1">
            Bot conversations, resolution metrics, knowledge gaps, and feedback.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-sm text-silver-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ─── KPI Row ───────────────────────────────────────── */}
      {loading && !analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="qy-skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="qy-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver-400">Total Conversations</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {totalConvs}
                </p>
              </div>
              <div className="bg-qyburn-900/40 rounded-lg p-2.5">
                <MessageSquare className="h-5 w-5 text-qyburn-400" />
              </div>
            </div>
          </div>

          <div className="qy-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver-400">Resolution Rate</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {resolutionRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-green-900/40 rounded-lg p-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </div>

          <div className="qy-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver-400">Avg Turns</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {avgTurns.toFixed(1)}
                </p>
              </div>
              <div className="bg-blue-900/40 rounded-lg p-2.5">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="qy-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver-400">Escalation Rate</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {escalationRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-red-900/40 rounded-lg p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </div>

          <div className="qy-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-silver-400">Avg Satisfaction</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {avgSatisfaction !== null && avgSatisfaction !== undefined
                    ? `${avgSatisfaction.toFixed(1)}/5`
                    : "--"}
                </p>
              </div>
              <div className="bg-yellow-900/40 rounded-lg p-2.5">
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Intent Distribution + Feedback Summary Row ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intent Distribution */}
        <div className="qy-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-qyburn-400" />
            <h2 className="text-lg font-semibold text-white">
              Intent Distribution
            </h2>
          </div>
          {intentDist.length === 0 ? (
            <p className="text-sm text-silver-500 py-4 text-center">
              No conversation data yet. Intents will appear as conversations are
              recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {intentDist.slice(0, 8).map((item) => (
                <div key={item.intent} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-silver-200 capitalize">
                      {item.intent}
                    </span>
                    <span className="text-silver-400">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-qy-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-qyburn-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Summary */}
        <div className="qy-card">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">
              Feedback Summary
            </h2>
          </div>
          {totalFeedback === 0 ? (
            <p className="text-sm text-silver-500 py-4 text-center">
              No feedback collected yet. Feedback will appear as users rate
              responses.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-silver-400">Average Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(avgRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-silver-600"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-silver-200 ml-2">
                    {avgRating.toFixed(1)}/5
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-silver-400">Total Ratings</span>
                <span className="text-sm text-silver-200">{totalFeedback}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-silver-400">
                  Helpful / Not Helpful
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sm text-green-400">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {helpfulCount}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-red-400">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    {notHelpfulCount}
                  </span>
                </div>
              </div>
              {helpfulCount + notHelpfulCount > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-silver-500">
                    <span>Helpfulness Ratio</span>
                    <span>
                      {(
                        (helpfulCount / (helpfulCount + notHelpfulCount)) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-qy-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${
                          (helpfulCount / (helpfulCount + notHelpfulCount)) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent Conversations ────────────────────────── */}
      <div className="qy-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-qyburn-400" />
            <h2 className="text-lg font-semibold text-white">
              Recent Conversations
            </h2>
            <span className="qy-badge-purple">{filteredConvs.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-500" />
              <input
                type="text"
                placeholder="Search..."
                className="qy-input pl-10 text-sm w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              {["all", "active", "resolved", "escalated"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-qyburn-600 text-white"
                      : "bg-qy-surface-light text-silver-400 hover:text-white"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && conversations.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="qy-skeleton h-14 rounded-lg" />
            ))}
          </div>
        ) : filteredConvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-qyburn-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              No conversations found
            </h3>
            <p className="text-sm text-silver-400">
              {searchQuery || statusFilter !== "all"
                ? "Try different filters or search terms."
                : "Conversations will appear here as users interact with Qyburn."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="qy-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Intent</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Turns</th>
                  <th>Created</th>
                  <th className="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredConvs.slice(0, 20).map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    expanded={expandedConv === conv.id}
                    onToggle={() =>
                      setExpandedConv(
                        expandedConv === conv.id ? null : conv.id
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Knowledge Gaps ──────────────────────────────── */}
      <div className="qy-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              Knowledge Gaps
            </h2>
            {openGaps.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
                {openGaps.length} open
              </span>
            )}
          </div>
        </div>

        {openGaps.length === 0 ? (
          <p className="text-sm text-silver-500 py-4 text-center">
            No knowledge gaps detected. Questions the bot cannot answer will
            appear here.
          </p>
        ) : (
          <div className="overflow-hidden">
            <table className="qy-table">
              <thead>
                <tr>
                  <th>Unanswered Question</th>
                  <th>Frequency</th>
                  <th>First Seen</th>
                  <th>Last Seen</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {openGaps.slice(0, 15).map((gap) => (
                  <tr key={gap.id}>
                    <td>
                      <p className="text-sm text-silver-200 max-w-md truncate">
                        {gap.question}
                      </p>
                    </td>
                    <td>
                      <span className="inline-flex items-center rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs font-medium text-yellow-300">
                        {gap.frequency}x
                      </span>
                    </td>
                    <td className="text-xs text-silver-400">
                      {relativeTime(gap.createdAt)}
                    </td>
                    <td className="text-xs text-silver-400">
                      {relativeTime(gap.updatedAt)}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() =>
                          window.open(
                            `/dashboard/knowledge?prefill=${encodeURIComponent(gap.question)}`,
                            "_self"
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-qyburn-300 bg-qyburn-900/30 hover:bg-qyburn-900/50 transition-colors"
                      >
                        <PenLine className="h-3 w-3" />
                        Write Article
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Conversation Row Component ──────────────────────────────

function ConversationRow({
  conv,
  expanded,
  onToggle,
}: {
  conv: ConversationItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="cursor-pointer" onClick={onToggle}>
        <td>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-qyburn-800 flex items-center justify-center text-[10px] font-bold text-qyburn-300">
              {conv.userEmail
                .split("@")[0]
                .split(".")
                .map((n) => n[0]?.toUpperCase() ?? "")
                .join("")
                .slice(0, 2) || "??"}
            </div>
            <span className="text-sm text-silver-200">{conv.userEmail}</span>
          </div>
        </td>
        <td>
          <span className="text-xs font-mono text-silver-300 capitalize">
            {conv.intent ?? "unknown"}
          </span>
        </td>
        <td>{statusBadge(conv.status)}</td>
        <td>{confidenceBadge(conv.confidence)}</td>
        <td className="text-sm text-silver-300">{conv.messages.length}</td>
        <td className="text-xs text-silver-400">
          {relativeTime(conv.createdAt)}
        </td>
        <td className="text-right">
          <button className="text-silver-400 hover:text-white transition-colors">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </td>
      </tr>
      {expanded && conv.messages.length > 0 && (
        <tr>
          <td colSpan={7} className="!p-0">
            <div className="bg-qy-surface-light/30 border-t border-qy-border px-6 py-4 space-y-3">
              {conv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "" : "pl-6"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-qyburn-900/40 text-qyburn-300"
                    }`}
                  >
                    {msg.role === "user" ? "U" : "QB"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-silver-200 whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <p className="text-[10px] text-silver-600 mt-1">
                      {relativeTime(msg.createdAt)}
                      {msg.intent && ` | intent: ${msg.intent}`}
                      {msg.confidence !== undefined &&
                        ` | confidence: ${Math.round(msg.confidence * 100)}%`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
