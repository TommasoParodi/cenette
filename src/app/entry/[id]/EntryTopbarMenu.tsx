"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useEntryPageActions } from "./EntryPageActions";

const ThreeDotsIcon = () => (
  <svg
    className="h-5 w-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

export function EntryTopbarMenu({
  entryId,
  entryTitle,
}: {
  entryId: string;
  entryTitle: string;
}) {
  const actions = useEntryPageActions();
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const handleDeleteClick = () => {
    setOpen(false);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await actions?.deleteEntry?.();
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-foreground"
        aria-label="Menu evento"
        aria-expanded={open}
      >
        <ThreeDotsIcon />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border border-separator-line bg-surface py-1 shadow-lg"
          role="menu"
        >
          <Link
            href={`/entry/${entryId}/edit`}
            className="block px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Modifica
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleDeleteClick}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-surface-muted"
          >
            Elimina
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Elimina evento"
        message={`Eliminare l'evento «${entryTitle}»? Tutte le recensioni e le foto saranno perse.`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={handleDeleteConfirm}
        destructive
      />
    </div>
  );
}
