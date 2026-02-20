"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/server-actions/groups";

const REDIRECT_PREFIX = "redirect:";

export function CreateGroupForm({
  redirectToGroup = false,
}: { redirectToGroup?: boolean } = {}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await createGroup(formData);
      if (result.error) return result.error;
      if (redirectToGroup && result.data?.groupId) {
        return `${REDIRECT_PREFIX}${result.data.groupId}`;
      }
      return null;
    },
    null as string | null
  );

  useEffect(() => {
    if (typeof state === "string" && state.startsWith(REDIRECT_PREFIX)) {
      router.push(`/group/${state.slice(REDIRECT_PREFIX.length)}`);
    }
  }, [state, router]);

  const isRedirect = typeof state === "string" && state.startsWith(REDIRECT_PREFIX);
  const errorMessage = typeof state === "string" && !isRedirect ? state : null;

  return (
    <form action={formAction} className="flex flex-col gap-2">
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
      <button
        type="submit"
        className="rounded-xl bg-accent-strong px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Crea gruppo
      </button>
    </form>
  );
}
