"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** Se true, il pulsante di conferma è rosso (azioni distruttive) */
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await Promise.resolve(onConfirm());
      onClose();
    } catch {
      // errore gestito dal chiamante
    } finally {
      setPending(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !pending) onClose();
  };

  const dialog = open ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-separator-line bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p id="confirm-dialog-desc" className="mt-2 text-sm text-text-secondary">
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 rounded-xl border border-separator-line bg-surface-muted py-2.5 text-sm font-medium text-foreground transition hover:bg-avatar-member-bg disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-50 ${
              destructive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-accent-strong text-accent-foreground hover:opacity-90"
            }`}
          >
            {pending ? "Attendere…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}
