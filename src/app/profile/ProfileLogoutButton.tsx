"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function ProfileLogoutButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirm() {
    const form = document.getElementById("logout-form") as HTMLFormElement;
    form?.requestSubmit();
  }

  return (
    <>
      <form id="logout-form" action="/auth/logout" method="post" className="hidden" />
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="mt-4 rounded-xl border border-separator-line bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary shadow-sm transition hover:bg-surface-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background"
      >
        Esci
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Esci dall’account"
        message="Sei sicuro di voler uscire?"
        confirmLabel="Esci"
        onConfirm={handleConfirm}
      />
    </>
  );
}
