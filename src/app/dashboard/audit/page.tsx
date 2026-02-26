"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollText,
  Search,
  KeyRound,
  ShieldCheck,
  BookOpen,
  UserPlus,
  Bot,
  Filter,
  Clock,
} from "lucide-react";
import type { AuditLogEntry } from "@/lib/mock-data";

const actionConfig: Record<
  string,
  { icon: typeof KeyRound; label: string; color: string; bg: string }
> = {
  "license.assign": {
    icon: KeyRound,
    label: "License Assigned",
    color: "text-qyburn-400",
    bg: "bg-qyburn-900/40",
  },
  "license.revoke": {
    icon: KeyRound,
    label: "License Revoked",
    color: "text-red-400",
    bg: "bg-red-900/40",
  },
  "group.request": {
    icon: ShieldCheck,
    label: "Group Request",
    color: "text-yellow-400",
    bg: "bg-yellow-900/40",
  },
  "group.approve": {
    icon: ShieldCheck,
    label: "Group Approved",
    color: "text-wildfire-400",
    bg: "bg-wildfire-900/40",
  },
  "group.deny": {
    icon: ShieldCheck,
    label: "Group Denied",
    color: "text-red-400",
    bg: "bg-red-900/40",
  },
  "kb.query": {
    icon: BookOpen,
    label: "KB Query",
    color: "text-blue-400",
    bg: "bg-blue-900/40",
  },
  "onboarding.start": {
    icon: UserPlus,
    label: "Onboarding Started",
    color: "text-wildfire-400",
    bg: "bg-wildfire-900/40",
  },
};

function getActionConfig(action: string) {
  return (
    actionConfig[action] ?? {
      icon: Bot,
      label: action,
      color: "text-silver-400",
      bg: "bg-silver-800/40",
    }
  );
}

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

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/audit");
    setLogs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const uniqueActions = useMemo(
    () => [...new Set(logs.map((l) => l.action))].sort(),
    [logs]
  );
  const uniqueActors = useMemo(
    () => [...new Set(logs.map((l) => l.actor))].sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (actorFilter !== "all" && log.actor !== actorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          log.actor.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          (log.target && log.target.toLowerCase().includes(q)) ||
          (log.details && log.details.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [logs, search, actionFilter, actorFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-silver-400 mt-1">
            {logs.length} total events &middot; showing {filtered.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-500" />
          <input
            type="text"
            placeholder="Search logs..."
            className="qy-input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-silver-500" />
          <select
            className="qy-input w-auto pr-8"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>
                {getActionConfig(a).label}
              </option>
            ))}
          </select>
          <select
            className="qy-input w-auto pr-8"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
          >
            <option value="all">All Actors</option>
            {uniqueActors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="qy-skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="qy-card flex flex-col items-center justify-center py-16">
          <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
            <ScrollText className="h-8 w-8 text-qyburn-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {search || actionFilter !== "all" || actorFilter !== "all"
              ? "No matching entries"
              : "No audit entries yet"}
          </h3>
          <p className="text-sm text-silver-400">
            {search
              ? "Try adjusting your filters."
              : "Events will appear here as Qyburn processes requests."}
          </p>
        </div>
      ) : (
        <div className="qy-card p-0 overflow-hidden">
          <table className="qy-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Channel</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const cfg = getActionConfig(log.action);
                const Icon = cfg.icon;
                return (
                  <tr key={log.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-white">
                            {cfg.label}
                          </span>
                          <p className="text-[11px] text-silver-500 font-mono">
                            {log.action}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {log.actor === "qyburn-bot" ? (
                          <span className="qy-badge-green text-[11px]">
                            <Bot className="h-3 w-3 mr-1" />
                            Qyburn
                          </span>
                        ) : (
                          <span className="text-sm text-silver-300">
                            {log.actor}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {log.target ? (
                        <span className="text-sm text-qyburn-300">
                          {log.target}
                        </span>
                      ) : (
                        <span className="text-sm text-silver-600">&mdash;</span>
                      )}
                    </td>
                    <td>
                      {log.channel ? (
                        <span className="font-mono text-xs text-silver-400">
                          {log.channel}
                        </span>
                      ) : (
                        <span className="text-silver-600">&mdash;</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-silver-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">{relativeTime(log.createdAt)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
