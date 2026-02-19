"use client";

import { useActionState } from "react";
import { joinGroup } from "@/server-actions/groups";

export function JoinGroupForm() {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await joinGroup(formData);
      if (result.error) return result.error;
      return null;
    },
    null as string | null
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Entra con codice invito
      </h3>
      <input
        type="text"
        name="invite_code"
        placeholder="Codice (es. ABC12XYZ)"
        required
        maxLength={8}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono uppercase tracking-wider text-zinc-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />
      {state && (
        <p className="text-sm text-red-600 dark:text-red-400">{state}</p>
      )}
      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Entra nel gruppo
      </button>
    </form>
  );
}
