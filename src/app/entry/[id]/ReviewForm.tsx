"use client";

import { useActionState } from "react";
import { createOrUpdateReview } from "@/server-actions/entries";

type Props = {
  entryId: string;
  initialRating?: number | null;
  initialComment?: string | null;
};

export function ReviewForm({
  entryId,
  initialRating,
  initialComment,
}: Props) {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await createOrUpdateReview(entryId, formData);
      if (result?.error) return result.error;
      return null;
    },
    null as string | null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="rating_overall"
          className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
        >
          Voto (1–10)
        </label>
        <input
          id="rating_overall"
          type="number"
          name="rating_overall"
          min={1}
          max={10}
          required
          defaultValue={initialRating ?? ""}
          className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label
          htmlFor="comment"
          className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
        >
          Commento (opzionale)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          placeholder="Come è andata?"
          defaultValue={initialComment ?? ""}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      {state && (
        <p className="text-sm text-red-600 dark:text-red-400">{state}</p>
      )}
      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {initialRating != null ? "Aggiorna recensione" : "Salva recensione"}
      </button>
    </form>
  );
}
