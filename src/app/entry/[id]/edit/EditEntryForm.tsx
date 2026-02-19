"use client";

import { useActionState } from "react";
import { updateEntry } from "@/server-actions/entries";

type Member = { id: string; displayName: string };

type Props = {
  entryId: string;
  defaultTitle: string;
  defaultType: "HOME" | "OUT";
  defaultVoteMode: "SIMPLE" | "DETAILED";
  defaultHappenedAt: string;
  defaultDescription: string | null;
  members: Member[];
  defaultParticipantIds: string[];
  creatorId: string;
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
  defaultVoteMode,
  defaultHappenedAt,
  defaultDescription,
  members,
  defaultParticipantIds,
  creatorId,
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
        <label htmlFor="vote_mode" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
          Modalità voto recensioni
        </label>
        <select
          id="vote_mode"
          name="vote_mode"
          required
          defaultValue={defaultVoteMode}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="SIMPLE">Voto semplice (solo voto 1–10)</option>
          <option value="DETAILED">Voto dettagliato (costo, servizio, …)</option>
        </select>
      </div>
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
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Partecipanti all&apos;evento (solo loro potranno scrivere una recensione)
        </span>
        <ul className="flex flex-wrap gap-2">
          {members.map((m) => {
            const isCreator = m.id === creatorId;
            return (
              <li key={m.id}>
                <label
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800 ${
                    isCreator
                      ? "cursor-default border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                      : "cursor-pointer border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                  title={isCreator ? "L'organizzatore non può essere rimosso" : undefined}
                >
                  <input
                    type="checkbox"
                    name="participants"
                    value={m.id}
                    defaultChecked={defaultParticipantIds.includes(m.id) || isCreator}
                    disabled={isCreator}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700"
                  />
                  {m.displayName}
                  {isCreator && (
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      (organizzatore)
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
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
