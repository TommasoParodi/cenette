"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { joinGroup } from "@/server-actions/groups";
import { navigateHistoryOrReplace } from "@/lib/history-navigation";

type JoinGroupState =
  | null
  | { error: string; data?: undefined }
  | { data: { groupId: string }; error: null };

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
      className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-lg transition hover:opacity-90 disabled:opacity-50 w-fit"
    >
      {pending ? "Attendere…" : "Entra nel gruppo"}
    </button>
  );
}

export function JoinGroupForm({
  redirectToGroup = false,
  onPendingChange,
}: { redirectToGroup?: boolean; onPendingChange?: (pending: boolean) => void } = {}) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [state, formAction] = useActionState<JoinGroupState, FormData>(
    async (_prevState: JoinGroupState, formData: FormData) => {
      const result = await joinGroup(formData);
      if ("error" in result && result.error) {
        return { error: result.error, data: undefined };
      }
      return { data: result.data!, error: null };
    },
    null
  );

  const navigatedRef = useRef(false);
  useEffect(() => {
    if (navigatedRef.current) return;
    if (state && !state.error && redirectToGroup) {
      navigatedRef.current = true;
      navigateHistoryOrReplace(router, { fallbackHref: "/dashboard" });
    }
  }, [state, redirectToGroup, router]);

  const errorMessage = state?.error ?? null;

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
