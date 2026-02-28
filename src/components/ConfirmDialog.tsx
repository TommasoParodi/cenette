"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
  /** Se false, il dialog non si chiude dopo onConfirm (es. logout: resta aperto con loading fino al redirect). Default true. */
  closeOnConfirm?: boolean;
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
  closeOnConfirm = true,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await Promise.resolve(onConfirm());
      if (closeOnConfirm) onClose();
    } catch {
      // errore gestito dal chiamante
    } finally {
      if (closeOnConfirm) setPending(false);
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
        className="relative w-full max-w-sm rounded-2xl border border-card-border bg-surface p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {pending && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/90"
            aria-live="polite"
            aria-busy="true"
          >
            <LoadingSpinner />
          </div>
        )}
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
            className="flex-1 rounded-full border border-separator-line bg-surface-muted py-2.5 text-sm font-medium text-foreground transition hover:bg-avatar-member-bg disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition disabled:opacity-50 ${
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
