"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={`rounded-full p-3 mb-3 ${
            variant === "danger"
              ? "bg-red-900/30 text-red-400"
              : "bg-yellow-900/30 text-yellow-400"
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-silver-300 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="qy-btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${
              variant === "danger" ? "qy-btn-danger" : "qy-btn-primary"
            }`}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
