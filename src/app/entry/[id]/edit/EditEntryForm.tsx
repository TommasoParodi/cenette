"use client";

import { useActionState } from "react";
import { updateEntry } from "@/server-actions/entries";

type Props = {
  entryId: string;
  defaultTitle: string;
  defaultType: "HOME" | "OUT";
  defaultHappenedAt: string;
  defaultDescription: string | null;
};

function formatDateForInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EditEntryForm({
  entryId,
  defaultTitle,
  defaultType,
  defaultHappenedAt,
  defaultDescription,
}: Props) {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await updateEntry(entryId, formData);
      if (result?.error) return result.error;
      return null;
    },
    null as string | null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        type="text"
        name="title"
        placeholder="Titolo evento"
        required
        defaultValue={defaultTitle}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <select
        name="type"
        required
        defaultValue={defaultType}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="HOME">Cena a casa</option>
        <option value="OUT">Uscita / Fuori</option>
      </select>
      <div>
        <label
          htmlFor="happened_at"
          className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
        >
          Data
        </label>
        <input
          id="happened_at"
          type="date"
          name="happened_at"
          required
          defaultValue={formatDateForInput(defaultHappenedAt)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
        >
          Descrizione (opzionale)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Dove, cosa avete mangiato..."
          defaultValue={defaultDescription ?? ""}
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
        Salva modifiche
      </button>
    </form>
  );
}
