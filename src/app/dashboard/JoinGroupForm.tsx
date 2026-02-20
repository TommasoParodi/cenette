"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { joinGroup } from "@/server-actions/groups";

const REDIRECT_PREFIX = "redirect:";

export function JoinGroupForm({
  redirectToGroup = false,
}: { redirectToGroup?: boolean } = {}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await joinGroup(formData);
      if (result.error) return result.error;
      if (redirectToGroup) {
        if (result.data?.groupId) return `${REDIRECT_PREFIX}${result.data.groupId}`;
        return `${REDIRECT_PREFIX}dashboard`;
      }
      return null;
    },
    null as string | null
  );

  useEffect(() => {
    if (typeof state === "string" && state.startsWith(REDIRECT_PREFIX)) {
      const path = state.slice(REDIRECT_PREFIX.length);
      router.push(path === "dashboard" ? "/dashboard" : `/group/${path}`);
    }
  }, [state, router]);

  const isRedirect = typeof state === "string" && state.startsWith(REDIRECT_PREFIX);
  const errorMessage = typeof state === "string" && !isRedirect ? state : null;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-label">
        Entra con codice invito
      </h3>
      <input
        type="text"
        name="invite_code"
        placeholder="Codice (es. ABC12XYZ)"
        required
        maxLength={8}
        className="rounded-xl border border-separator-line bg-surface px-3 py-2 font-mono uppercase tracking-wider text-foreground placeholder-placeholder placeholder:normal-case placeholder:tracking-normal focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      <button
        type="submit"
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Entra nel gruppo
      </button>
    </form>
  );
}
