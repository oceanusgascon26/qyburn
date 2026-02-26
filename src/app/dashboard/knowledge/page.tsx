"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  Tag,
  ChevronDown,
  ChevronUp,
  FileText,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { KnowledgeDocument } from "@/lib/mock-data";

function DocumentCard({
  doc,
  expanded,
  onToggle,
  onDelete,
}: {
  doc: KnowledgeDocument;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const wordCount = doc.content.split(/\s+/).length;

  return (
    <div className="qy-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-qyburn-900/40 flex items-center justify-center">
            <FileText className="h-5 w-5 text-qyburn-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{doc.title}</h3>
            <div className="flex items-center gap-3 mt-1">
              {doc.category && (
                <span className="flex items-center gap-1 text-xs text-silver-400">
                  <FolderOpen className="h-3 w-3" />
                  {doc.category}
                </span>
              )}
              <span className="text-xs text-silver-500">
                {wordCount} words
              </span>
              <span className="text-xs text-silver-500">
                Updated{" "}
                {new Date(doc.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-silver-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {doc.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-qyburn-900/30 px-2.5 py-0.5 text-[11px] text-qyburn-300"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expand/collapse */}
      <div className="mt-3 pt-3 border-t border-qy-border">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs text-qyburn-400 hover:text-qyburn-300 transition-colors"
        >
          {expanded ? (
            <>
              Hide content <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Preview content <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-3 bg-qy-surface-light/50 rounded-lg p-4 text-sm text-silver-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
            {doc.content}
          </div>
        )}
      </div>
    </div>
  );
}

function AddDocumentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "",
    tagsInput: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Title *
        </label>
        <input
          className="qy-input"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. VPN Setup Guide"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Category
        </label>
        <input
          className="qy-input"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          placeholder="e.g. Network, Security, Software"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Tags (comma-separated)
        </label>
        <input
          className="qy-input"
          value={form.tagsInput}
          onChange={(e) =>
            setForm((f) => ({ ...f, tagsInput: e.target.value }))
          }
          placeholder="vpn, remote-access, network"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-silver-300 mb-1.5">
          Content * (Markdown supported)
        </label>
        <textarea
          className="qy-input min-h-[200px] resize-y font-mono text-xs"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="# Document Title&#10;&#10;Write the knowledge base article here..."
        />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-qy-border">
        <button onClick={onCancel} className="qy-btn-secondary">
          Cancel
        </button>
        <button
          onClick={() =>
            onSubmit({
              title: form.title,
              content: form.content,
              category: form.category,
              tags: form.tagsInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="qy-btn-primary"
          disabled={!form.title || !form.content}
        >
          Add Document
        </button>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocument | null>(
    null
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/knowledge");
    setDocs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const categories = useMemo(
    () => [...new Set(docs.map((d) => d.category).filter(Boolean))].sort(),
    [docs]
  );

  const filtered = useMemo(() => {
    return docs.filter((doc) => {
      if (categoryFilter !== "all" && doc.category !== categoryFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.content.toLowerCase().includes(q) ||
          doc.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [docs, search, categoryFilter]);

  const handleAdd = async (data: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }) => {
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Document added to knowledge base");
      setAddOpen(false);
      fetchDocs();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/knowledge/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      fetchDocs();
    }
  };

  const totalWords = docs.reduce(
    (sum, d) => sum + d.content.split(/\s+/).length,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-sm text-silver-400 mt-1">
            {docs.length} documents &middot; ~{totalWords.toLocaleString()}{" "}
            words indexed
          </p>
        </div>
        <button className="qy-btn-primary" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-500" />
          <input
            type="text"
            placeholder="Search documents..."
            className="qy-input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Category pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-qyburn-600 text-white"
                : "bg-qy-surface-light text-silver-400 hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setCategoryFilter(categoryFilter === cat ? "all" : cat!)
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-qyburn-600 text-white"
                  : "bg-qy-surface-light text-silver-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="qy-skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="qy-card flex flex-col items-center justify-center py-16">
          <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
            <BookOpen className="h-8 w-8 text-qyburn-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {search || categoryFilter !== "all"
              ? "No matching documents"
              : "Knowledge base is empty"}
          </h3>
          <p className="text-sm text-silver-400 mb-4">
            {search
              ? "Try different search terms."
              : "Upload IT docs so Qyburn can answer questions."}
          </p>
          {!search && categoryFilter === "all" && (
            <button
              className="qy-btn-primary"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Upload First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              expanded={expandedId === doc.id}
              onToggle={() =>
                setExpandedId(expandedId === doc.id ? null : doc.id)
              }
              onDelete={() => setDeleteTarget(doc)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Knowledge Document"
        description="This document will be used by Qyburn to answer IT questions."
        size="lg"
      >
        <AddDocumentForm
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? Qyburn will no longer be able to reference this document.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
