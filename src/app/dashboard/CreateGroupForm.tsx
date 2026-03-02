"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createGroup } from "@/server-actions/groups";
import { navigateHistoryOrReplace } from "@/lib/history-navigation";

type CreateGroupState =
  | null
  | { error: string; data?: undefined }
  | { data: { groupId: string }; error: null };

function PendingNotifier({
  onPendingChange,
  redirecting,
}: { onPendingChange?: (pending: boolean) => void; redirecting: boolean }) {
  const { pending } = useFormStatus();
  const showLoading = pending || redirecting;
  useEffect(() => {
    onPendingChange?.(showLoading);
  }, [showLoading, onPendingChange]);
  return null;
}

function SubmitButton({
  disabledWhenEmpty,
  redirecting,
}: { disabledWhenEmpty?: boolean; redirecting: boolean }) {
  const { pending } = useFormStatus();
  const showLoading = pending || redirecting;
  const disabled = showLoading || disabledWhenEmpty;
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
    >
      {showLoading ? "Attendere…" : "Crea gruppo"}
    </button>
  );
}

export function CreateGroupForm({
  redirectToGroup = false,
  onPendingChange,
}: { redirectToGroup?: boolean; onPendingChange?: (pending: boolean) => void } = {}) {
  const router = useRouter();
  const [state, formAction] = useActionState<CreateGroupState, FormData>(
    async (_prevState: CreateGroupState, formData: FormData) => {
      const result = await createGroup(formData);
      if ("error" in result && result.error) {
        return { error: result.error, data: undefined };
      }
      return { data: result.data!, error: null };
    },
    null
  );

  const redirecting = !!(state && !state.error && redirectToGroup);
  const navigatedRef = useRef(false);
  useEffect(() => {
    if (navigatedRef.current) return;
    if (state && !state.error && redirectToGroup) {
      navigatedRef.current = true;
      navigateHistoryOrReplace(router, { fallbackHref: "/dashboard" });
    }
  }, [state, redirectToGroup, router]);

  const errorMessage = state?.error ?? null;
  const [name, setName] = useState("");
  const isNameEmpty = !name.trim();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <PendingNotifier onPendingChange={onPendingChange} redirecting={redirecting} />
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
      <SubmitButton disabledWhenEmpty={isNameEmpty} redirecting={redirecting} />
    </form>
  );
}
