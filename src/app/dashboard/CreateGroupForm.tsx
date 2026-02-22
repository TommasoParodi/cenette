"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createGroup } from "@/server-actions/groups";

function PendingNotifier({ onPendingChange }: { onPendingChange?: (pending: boolean) => void }) {
  const { pending } = useFormStatus();
  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);
  return null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-accent-strong px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-70"
    >
      {pending ? "Attendere…" : "Crea gruppo"}
    </button>
  );
}

export function CreateGroupForm({
  redirectToGroup = false,
  onPendingChange,
}: { redirectToGroup?: boolean; onPendingChange?: (pending: boolean) => void } = {}) {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await createGroup(formData);
      if (result.error) return result.error;
      return null;
    },
    null as string | null
  );

  const errorMessage = typeof state === "string" ? state : null;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <PendingNotifier onPendingChange={onPendingChange} />
      {redirectToGroup && (
        <input type="hidden" name="redirect_to_dashboard" value="1" />
      )}
      <h3 className="text-sm font-medium text-label">
        Crea un gruppo
      </h3>
      <input
        type="text"
        name="name"
        placeholder="Nome gruppo"
        required
        className="rounded-xl border border-separator-line bg-surface px-3 py-2 text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      <SubmitButton />
    </form>
  );
}
