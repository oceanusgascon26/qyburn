"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UsageBar } from "@/components/ui/UsageBar";
import type { License } from "@/lib/mock-data";

function LicenseForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: License;
  onSubmit: (data: Partial<License>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    vendor: initial?.vendor ?? "",
    sku: initial?.sku ?? "",
    totalSeats: initial?.totalSeats ?? 0,
    usedSeats: initial?.usedSeats ?? 0,
    costPerSeat: initial?.costPerSeat ?? 0,
    autoApprove: initial?.autoApprove ?? false,
    description: initial?.description ?? "",
  });

  const set = (key: string, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-silver-300 mb-1.5">
            Name *
          </label>
          <input
            className="qy-input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Microsoft 365 E3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-silver-300 mb-1.5">
            Vendor *
          </label>
          <input
            className="qy-input"
            value={form.vendor}
            onChange={(e) => set("vendor", e.target.value)}
            placeholder="e.g. Microsoft"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-silver-300 mb-1.5">
            SKU
          </label>
          <input
            className="qy-input font-mono"
            value={form.sku}
            onChange={(e) => set("sku", e.target.value)}
            placeholder="M365-E3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-silver-300 mb-1.5">
            Total Seats
          </label>
          <input
            className="qy-input"
            type="number"
            value={form.totalSeats}
            onChange={(e) => set("totalSeats", parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-silver-300 mb-1.5">
            Cost/Seat ($)
          </label>
          <input
            className="qy-input"
            type="number"
            step="0.01"
            value={form.costPerSeat}
            onChange={(e) =>
              set("costPerSeat", parseFloat(e.target.value) || 0)
            }
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
          placeholder="Brief description of this license..."
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoApprove"
          checked={form.autoApprove}
          onChange={(e) => set("autoApprove", e.target.checked)}
          className="h-4 w-4 rounded border-qy-border bg-qy-surface text-qyburn-500 focus:ring-qyburn-500"
        />
        <label htmlFor="autoApprove" className="text-sm text-silver-300">
          Auto-approve requests (no admin approval needed)
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-qy-border">
        <button onClick={onCancel} className="qy-btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(form)}
          className="qy-btn-primary"
          disabled={!form.name || !form.vendor}
        >
          {initial ? "Save Changes" : "Add License"}
        </button>
      </div>
    </div>
  );
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<License | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<License | null>(null);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/licenses");
    const data = await res.json();
    setLicenses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const filtered = licenses.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.vendor.toLowerCase().includes(search.toLowerCase()) ||
      (l.sku && l.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (data: Partial<License>) => {
    const res = await fetch("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("License added successfully");
      setAddOpen(false);
      fetchLicenses();
    }
  };

  const handleEdit = async (data: Partial<License>) => {
    if (!editTarget) return;
    const res = await fetch(`/api/licenses/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("License updated");
      setEditTarget(null);
      fetchLicenses();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/licenses/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      fetchLicenses();
    }
  };

  const totalCost = licenses.reduce(
    (sum, l) => sum + (l.costPerSeat ?? 0) * l.usedSeats,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">License Catalog</h1>
          <p className="text-sm text-silver-400 mt-1">
            {licenses.length} licenses &middot; $
            {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            /mo estimated cost
          </p>
        </div>
        <button className="qy-btn-primary" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add License
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-500" />
        <input
          type="text"
          placeholder="Search licenses..."
          className="qy-input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="qy-skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="qy-card flex flex-col items-center justify-center py-16">
          <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
            <KeyRound className="h-8 w-8 text-qyburn-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {search ? "No matches found" : "No licenses configured"}
          </h3>
          <p className="text-sm text-silver-400 mb-4">
            {search
              ? "Try a different search term."
              : "Add software licenses to your catalog."}
          </p>
          {!search && (
            <button
              className="qy-btn-primary"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Your First License
            </button>
          )}
        </div>
      ) : (
        <div className="qy-card p-0 overflow-hidden">
          <table className="qy-table">
            <thead>
              <tr>
                <th>License</th>
                <th>Vendor</th>
                <th>SKU</th>
                <th>Seat Usage</th>
                <th>Cost/Seat</th>
                <th>Auto-Approve</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((license) => (
                <tr key={license.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-qyburn-900/40 flex items-center justify-center">
                        <KeyRound className="h-4 w-4 text-qyburn-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{license.name}</p>
                        {license.description && (
                          <p className="text-xs text-silver-500 max-w-[200px] truncate">
                            {license.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-silver-300">{license.vendor}</td>
                  <td>
                    <span className="font-mono text-xs text-silver-400">
                      {license.sku || "—"}
                    </span>
                  </td>
                  <td className="min-w-[180px]">
                    <UsageBar
                      used={license.usedSeats}
                      total={license.totalSeats}
                    />
                  </td>
                  <td className="text-silver-300">
                    {license.costPerSeat
                      ? `$${license.costPerSeat.toFixed(2)}`
                      : "—"}
                  </td>
                  <td>
                    {license.autoApprove ? (
                      <span className="flex items-center gap-1 text-wildfire-400 text-sm">
                        <CheckCircle2 className="h-4 w-4" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-silver-500 text-sm">
                        <XCircle className="h-4 w-4" /> No
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTarget(license)}
                        className="rounded-lg p-2 text-silver-400 hover:text-white hover:bg-qy-surface-light transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(license)}
                        className="rounded-lg p-2 text-silver-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add License"
        description="Add a new software license to the catalog."
      >
        <LicenseForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit License"
        description={`Editing ${editTarget?.name}`}
      >
        {editTarget && (
          <LicenseForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete License"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove it from the catalog and cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
