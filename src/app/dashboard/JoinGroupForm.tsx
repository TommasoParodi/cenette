"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { joinGroup } from "@/server-actions/groups";

function PendingNotifier({ onPendingChange }: { onPendingChange?: (pending: boolean) => void }) {
  const { pending } = useFormStatus();
  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);
  return null;
}

function SubmitButton({ disabledWhenEmpty }: { disabledWhenEmpty?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabledWhenEmpty}
      className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-70"
    >
      {pending ? "Attendere…" : "Entra nel gruppo"}
    </button>
  );
}

export function JoinGroupForm({
  redirectToGroup = false,
  onPendingChange,
}: { redirectToGroup?: boolean; onPendingChange?: (pending: boolean) => void } = {}) {
  const [inviteCode, setInviteCode] = useState("");
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await joinGroup(formData);
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
        Entra con codice invito <span className="text-red-600" aria-hidden="true">*</span>
      </h3>
      <input
        type="text"
        name="invite_code"
        value={inviteCode ?? ""}
        onChange={(e) => setInviteCode(e.target.value)}
        placeholder="Codice (es. ABC12XYZ)"
        required
        maxLength={8}
        className="rounded-xl border border-separator-line bg-surface px-3 py-2 font-mono uppercase tracking-wider text-foreground placeholder-placeholder placeholder:normal-case placeholder:tracking-normal focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      <SubmitButton disabledWhenEmpty={!inviteCode.trim()} />
    </form>
  );
}
