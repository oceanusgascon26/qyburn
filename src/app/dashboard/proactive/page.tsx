"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquarePlus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Shield,
  Key,
  UserPlus,
  AlertTriangle,
  Timer,
  SkipForward,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

interface ScheduledMessage {
  id: string;
  type: string;
  userId: string;
  userEmail: string;
  channel?: string;
  message: string;
  blocks: unknown[];
  scheduledFor: string;
  sent: boolean;
  sentAt?: string;
  response?: string;
}

interface TypeBreakdown {
  type: string;
  total: number;
  sent: number;
  pending: number;
}

// ─── Component ───────────────────────────────────────────────

export default function ProactivePage() {
  const [loading, setLoading] = useState(true);
  const [pendingMessages, setPendingMessages] = useState<ScheduledMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<ScheduledMessage[]>([]);
  const [breakdown, setBreakdown] = useState<TypeBreakdown[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [tab, setTab] = useState<"pending" | "sent">("pending");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, sentRes] = await Promise.all([
        fetch("/api/proactive?sent=false"),
        fetch("/api/proactive?sent=true"),
      ]);
      const pendingData = await pendingRes.json();
      const sentData = await sentRes.json();
      setPendingMessages(pendingData.messages ?? []);
      setSentMessages(sentData.messages ?? []);
      setBreakdown(pendingData.breakdown ?? []);
    } catch {
      toast.error("Failed to load proactive messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/proactive", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Generated ${data.generated} new messages`);
        fetchData();
      } else {
        toast.error("Failed to generate messages");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSendOne = async (messageId: string) => {
    const res = await fetch("/api/proactive/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    if (res.ok) {
      toast.success("Message sent");
      fetchData();
    } else {
      toast.error("Failed to send message");
    }
  };

  const handleSendAllDue = async () => {
    setSendingAll(true);
    try {
      const res = await fetch("/api/proactive/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sent ${data.sent} due messages`);
        fetchData();
      }
    } finally {
      setSendingAll(false);
    }
  };

  const handleSkip = async (messageId: string) => {
    const res = await fetch(`/api/proactive?id=${messageId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Message skipped");
      fetchData();
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "mfa_reminder":
        return <Shield className="h-4 w-4 text-blue-400" />;
      case "license_expiry":
        return <Key className="h-4 w-4 text-orange-400" />;
      case "password_age":
        return <Key className="h-4 w-4 text-yellow-400" />;
      case "onboarding_checkin":
        return <UserPlus className="h-4 w-4 text-green-400" />;
      case "security_nudge":
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case "sla_warning":
        return <Timer className="h-4 w-4 text-purple-400" />;
      default:
        return <Mail className="h-4 w-4 text-silver-400" />;
    }
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mfa_reminder: "MFA Reminder",
      license_expiry: "License Expiry",
      password_age: "Password Age",
      onboarding_checkin: "Onboarding Check-in",
      security_nudge: "Security Nudge",
      sla_warning: "SLA Warning",
    };
    return labels[type] ?? type;
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "mfa_reminder":
        return "bg-blue-900/30 text-blue-400";
      case "license_expiry":
        return "bg-orange-900/30 text-orange-400";
      case "password_age":
        return "bg-yellow-900/30 text-yellow-400";
      case "onboarding_checkin":
        return "bg-green-900/30 text-green-400";
      case "security_nudge":
        return "bg-red-900/30 text-red-400";
      case "sla_warning":
        return "bg-purple-900/30 text-purple-400";
      default:
        return "bg-qy-surface text-silver-400";
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Proactive Messages</h1>
          <p className="text-sm text-silver-400 mt-1">Loading...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="qy-skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="qy-skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const totalPending = pendingMessages.length;
  const totalSent = sentMessages.length;
  const totalAll = totalPending + totalSent;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proactive Messages</h1>
          <p className="text-sm text-silver-400 mt-1">
            Automated outreach to help users before they ask
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-sm text-silver-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="qy-btn-primary"
          >
            <Zap className="h-4 w-4" />
            {generating ? "Generating..." : "Generate Messages"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="qy-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-silver-400">Pending</p>
              <p className="text-2xl font-bold text-white mt-1">{totalPending}</p>
            </div>
            <div className="bg-yellow-900/40 rounded-lg p-2.5">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="qy-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-silver-400">Sent</p>
              <p className="text-2xl font-bold text-wildfire-400 mt-1">{totalSent}</p>
            </div>
            <div className="bg-wildfire-900/40 rounded-lg p-2.5">
              <CheckCircle2 className="h-5 w-5 text-wildfire-400" />
            </div>
          </div>
        </div>
        <div className="qy-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-silver-400">Total Messages</p>
              <p className="text-2xl font-bold text-white mt-1">{totalAll}</p>
            </div>
            <div className="bg-qyburn-900/40 rounded-lg p-2.5">
              <MessageSquarePlus className="h-5 w-5 text-qyburn-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Message Type Breakdown */}
      <div className="qy-card">
        <h2 className="text-lg font-semibold text-white mb-4">Message Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {breakdown.map((b) => (
            <div
              key={b.type}
              className="border border-qy-border rounded-lg p-3 text-center"
            >
              <div className="flex justify-center mb-2">{typeIcon(b.type)}</div>
              <p className="text-xs text-silver-400 mb-1">{typeLabel(b.type)}</p>
              <p className="text-lg font-bold text-white">{b.total}</p>
              <div className="flex justify-center gap-2 mt-1 text-[10px]">
                <span className="text-wildfire-400">{b.sent} sent</span>
                <span className="text-silver-500">{b.pending} pending</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-qy-border">
        <button
          onClick={() => setTab("pending")}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "pending"
              ? "border-wildfire-500 text-white"
              : "border-transparent text-silver-400 hover:text-silver-200"
          }`}
        >
          Pending ({totalPending})
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "sent"
              ? "border-wildfire-500 text-white"
              : "border-transparent text-silver-400 hover:text-silver-200"
          }`}
        >
          Sent ({totalSent})
        </button>
        {tab === "pending" && totalPending > 0 && (
          <div className="ml-auto pb-2">
            <button
              onClick={handleSendAllDue}
              disabled={sendingAll}
              className="text-xs text-wildfire-400 hover:text-wildfire-300 flex items-center gap-1.5 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              {sendingAll ? "Sending..." : "Send all due"}
            </button>
          </div>
        )}
      </div>

      {/* Message list */}
      <div className="space-y-2">
        {tab === "pending" &&
          (pendingMessages.length === 0 ? (
            <div className="qy-card flex flex-col items-center justify-center py-16">
              <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
                <MessageSquarePlus className="h-8 w-8 text-qyburn-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                No pending messages
              </h3>
              <p className="text-sm text-silver-400 mb-4">
                Click &quot;Generate Messages&quot; to scan for proactive opportunities.
              </p>
              <button onClick={handleGenerate} className="qy-btn-primary">
                <Zap className="h-4 w-4" />
                Generate Messages
              </button>
            </div>
          ) : (
            pendingMessages.map((msg) => (
              <div
                key={msg.id}
                className="qy-card flex items-start gap-4 !py-3"
              >
                <div className="flex-shrink-0 mt-0.5">{typeIcon(msg.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeColor(msg.type)}`}>
                      {typeLabel(msg.type)}
                    </span>
                    <span className="text-xs text-silver-500">
                      {msg.userEmail}
                    </span>
                  </div>
                  <p className="text-sm text-silver-200">{msg.message}</p>
                  <p className="text-xs text-silver-500 mt-1">
                    Scheduled: {formatTime(msg.scheduledFor)}
                    {msg.channel && ` in ${msg.channel}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleSendOne(msg.id)}
                    className="p-2 rounded-lg text-wildfire-400 hover:bg-wildfire-900/20 transition-colors"
                    title="Send now"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSkip(msg.id)}
                    className="p-2 rounded-lg text-silver-500 hover:text-silver-300 hover:bg-qy-surface-light transition-colors"
                    title="Skip"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ))}

        {tab === "sent" &&
          (sentMessages.length === 0 ? (
            <div className="qy-card flex flex-col items-center justify-center py-16">
              <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
                <CheckCircle2 className="h-8 w-8 text-qyburn-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                No sent messages yet
              </h3>
              <p className="text-sm text-silver-400">
                Messages will appear here after they are sent.
              </p>
            </div>
          ) : (
            sentMessages.map((msg) => (
              <div
                key={msg.id}
                className="qy-card flex items-start gap-4 !py-3 opacity-80"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeColor(msg.type)}`}>
                      {typeLabel(msg.type)}
                    </span>
                    <span className="text-xs text-silver-500">
                      {msg.userEmail}
                    </span>
                  </div>
                  <p className="text-sm text-silver-200">{msg.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-silver-500">
                      Sent: {msg.sentAt ? formatTime(msg.sentAt) : "—"}
                    </p>
                    {msg.response && (
                      <span className="text-xs text-wildfire-400">
                        Response: {msg.response}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ))}
      </div>
    </div>
  );
}
