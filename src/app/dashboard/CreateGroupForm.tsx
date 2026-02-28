"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createGroup } from "@/server-actions/groups";

function PendingNotifier({ onPendingChange }: { onPendingChange?: (pending: boolean) => void }) {
  const { pending } = useFormStatus();
  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);
  return null;
}

function SubmitButton({ disabledWhenEmpty }: { disabledWhenEmpty?: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || disabledWhenEmpty;
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
    >
      {pending ? "Attendere…" : "Crea gruppo"}
    </button>
  );
}

type CreateGroupState = { data?: { redirectToDashboard?: true }; error?: string } | null;

export function CreateGroupForm({
  redirectToGroup = false,
  onPendingChange,
}: { redirectToGroup?: boolean; onPendingChange?: (pending: boolean) => void } = {}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await createGroup(formData);
      if (result.error) return { error: result.error };
      return result as CreateGroupState;
    },
    null as CreateGroupState
  );

  useEffect(() => {
    if (state?.data?.redirectToDashboard) {
      router.replace("/dashboard");
    }
  }, [state, router]);

  const errorMessage = state?.error ?? null;
  const [name, setName] = useState("");
  const isNameEmpty = !name.trim();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <PendingNotifier onPendingChange={onPendingChange} />
      {redirectToGroup && (
        <input type="hidden" name="redirect_to_dashboard" value="1" />
      )}
      <h3 className="text-sm font-medium text-label">
        Nome gruppo <span className="text-red-600" aria-hidden>*</span>
      </h3>
      <input
        type="text"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome gruppo"
        required
        className="rounded-xl border border-separator-line bg-surface px-3 py-2 text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      <SubmitButton disabledWhenEmpty={isNameEmpty} />
    </form>
  );
}
