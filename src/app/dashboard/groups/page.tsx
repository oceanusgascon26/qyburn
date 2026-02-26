"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { RestrictedGroup, GroupAccessRequest } from "@/lib/mock-data";

function GroupForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: RestrictedGroup;
  onSubmit: (data: Partial<RestrictedGroup>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    azureGroupId: initial?.azureGroupId ?? "",
    displayName: initial?.displayName ?? "",
    description: initial?.description ?? "",
    approverEmail: initial?.approverEmail ?? "",
    requiresJustification: initial?.requiresJustification ?? true,
  });

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-silver-300 mb-1.5">
            Display Name *
          </label>
          <input
            className="qy-input"
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="e.g. SG-Engineering-Admin"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-silver-300 mb-1.5">
            Azure Group ID *
          </label>
          <input
            className="qy-input font-mono"
            value={form.azureGroupId}
            onChange={(e) => set("azureGroupId", e.target.value)}
            placeholder="group-xxx-xxx"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Description
        </label>
        <textarea
          className="qy-input min-h-[80px] resize-y"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What does this group control access to?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Approver Email *
        </label>
        <input
          className="qy-input"
          type="email"
          value={form.approverEmail}
          onChange={(e) => set("approverEmail", e.target.value)}
          placeholder="approver@saga.com"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requiresJustification"
          checked={form.requiresJustification}
          onChange={(e) => set("requiresJustification", e.target.checked)}
          className="h-4 w-4 rounded border-qy-border bg-qy-surface text-qyburn-500 focus:ring-qyburn-500"
        />
        <label
          htmlFor="requiresJustification"
          className="text-sm text-silver-300"
        >
          Require justification for access requests
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-qy-border">
        <button onClick={onCancel} className="qy-btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(form)}
          className="qy-btn-primary"
          disabled={!form.displayName || !form.azureGroupId || !form.approverEmail}
        >
          {initial ? "Save Changes" : "Add Group"}
        </button>
      </div>
    </div>
  );
}

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-400", badge: "bg-yellow-900/40 text-yellow-300" },
  approved: { icon: CheckCircle2, color: "text-wildfire-400", badge: "bg-wildfire-900/40 text-wildfire-300" },
  denied: { icon: XCircle, color: "text-red-400", badge: "bg-red-900/40 text-red-300" },
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<RestrictedGroup[]>([]);
  const [requests, setRequests] = useState<GroupAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RestrictedGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RestrictedGroup | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [groupsRes, requestsRes] = await Promise.all([
      fetch("/api/groups"),
      fetch("/api/groups/requests"),
    ]);
    setGroups(await groupsRes.json());
    setRequests(await requestsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = groups.filter(
    (g) =>
      g.displayName.toLowerCase().includes(search.toLowerCase()) ||
      g.approverEmail.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const handleAdd = async (data: Partial<RestrictedGroup>) => {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Restricted group added");
      setAddOpen(false);
      fetchData();
    }
  };

  const handleEdit = async (data: Partial<RestrictedGroup>) => {
    if (!editTarget) return;
    const res = await fetch(`/api/groups/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Group updated");
      setEditTarget(null);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/groups/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`${deleteTarget.displayName} deleted`);
      setDeleteTarget(null);
      fetchData();
    }
  };

  const handleRequestAction = async (
    requestId: string,
    status: "approved" | "denied"
  ) => {
    const res = await fetch("/api/groups/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: requestId,
        status,
        reviewedBy: "admin@saga.com",
        reviewedAt: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      toast.success(`Request ${status}`);
      fetchData();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Restricted Groups</h1>
          <p className="text-sm text-silver-400 mt-1">
            {groups.length} groups &middot; {pendingRequests.length} pending
            requests
          </p>
        </div>
        <button className="qy-btn-primary" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </div>

      {/* Pending requests banner */}
      {pendingRequests.length > 0 && (
        <div className="qy-card border-yellow-800/50">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              Pending Access Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const group = groups.find((g) => g.id === req.groupId);
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between bg-qy-surface-light/50 rounded-lg p-4"
                >
                  <div>
                    <p className="text-sm text-white">
                      <span className="font-medium">{req.requesterEmail}</span>{" "}
                      wants to join{" "}
                      <span className="font-medium text-qyburn-300">
                        {group?.displayName ?? req.groupId}
                      </span>
                    </p>
                    {req.justification && (
                      <p className="text-xs text-silver-400 mt-1 italic">
                        &quot;{req.justification}&quot;
                      </p>
                    )}
                    <p className="text-xs text-silver-500 mt-1">
                      {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRequestAction(req.id, "approved")}
                      className="qy-btn-accent text-xs px-3 py-1.5"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestAction(req.id, "denied")}
                      className="qy-btn-danger text-xs px-3 py-1.5"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Deny
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-500" />
        <input
          type="text"
          placeholder="Search groups..."
          className="qy-input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Groups table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="qy-skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="qy-card flex flex-col items-center justify-center py-16">
          <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
            <ShieldCheck className="h-8 w-8 text-qyburn-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {search ? "No matches found" : "No restricted groups"}
          </h3>
          <p className="text-sm text-silver-400 mb-4">
            {search
              ? "Try a different search term."
              : "Define which groups require approval."}
          </p>
        </div>
      ) : (
        <div className="qy-card p-0 overflow-hidden">
          <table className="qy-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Azure Group ID</th>
                <th>Approver</th>
                <th>Justification</th>
                <th>Requests</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((group) => {
                const groupReqs = requests.filter((r) => r.groupId === group.id);
                const pending = groupReqs.filter((r) => r.status === "pending").length;
                return (
                  <tr key={group.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-qyburn-900/40 flex items-center justify-center">
                          <ShieldCheck className="h-4 w-4 text-qyburn-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {group.displayName}
                          </p>
                          {group.description && (
                            <p className="text-xs text-silver-500 max-w-[250px] truncate">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-silver-400">
                        {group.azureGroupId}
                      </span>
                    </td>
                    <td className="text-silver-300 text-sm">
                      {group.approverEmail}
                    </td>
                    <td>
                      {group.requiresJustification ? (
                        <span className="qy-badge-purple">Required</span>
                      ) : (
                        <span className="qy-badge-silver">Optional</span>
                      )}
                    </td>
                    <td>
                      {pending > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm text-yellow-400">
                          <Clock className="h-3.5 w-3.5" />
                          {pending} pending
                        </span>
                      ) : (
                        <span className="text-sm text-silver-500">None</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditTarget(group)}
                          className="rounded-lg p-2 text-silver-400 hover:text-white hover:bg-qy-surface-light transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(group)}
                          className="rounded-lg p-2 text-silver-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent request history */}
      {requests.filter((r) => r.status !== "pending").length > 0 && (
        <div className="qy-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Request History
          </h3>
          <div className="space-y-2">
            {requests
              .filter((r) => r.status !== "pending")
              .map((req) => {
                const cfg = statusConfig[req.status];
                const group = groups.find((g) => g.id === req.groupId);
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-2 border-b border-qy-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                      <div>
                        <p className="text-sm text-silver-200">
                          {req.requesterEmail} &rarr;{" "}
                          {group?.displayName ?? req.groupId}
                        </p>
                        <p className="text-xs text-silver-500">
                          Reviewed by {req.reviewedBy} on{" "}
                          {req.reviewedAt
                            ? new Date(req.reviewedAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <span className={`qy-badge ${cfg.badge}`}>
                      {req.status}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Restricted Group"
        description="Groups defined here will require approval for membership."
      >
        <GroupForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Group"
        description={`Editing ${editTarget?.displayName}`}
      >
        {editTarget && (
          <GroupForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Group"
        message={`Are you sure you want to remove "${deleteTarget?.displayName}" from restricted groups? Users will be able to join without approval.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
