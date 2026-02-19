"use client";

import { useState } from "react";
import { createEntry } from "@/server-actions/entries";
import { compressPhotoFiles } from "@/lib/compress-photos";

type Member = { id: string; displayName: string };

type Props = {
  groupId: string;
  members: Member[];
  currentUserId: string;
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CreateEntryForm({ groupId, members, currentUserId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const rawPhotos = (formData.getAll("photos") as File[]).filter(
      (f): f is File => f instanceof File && f.size > 0
    );
    let photos = rawPhotos.slice(0, 3);
    if (photos.length > 0) {
      try {
        photos = await compressPhotoFiles(photos);
      } catch {
        setError("Errore durante la compressione delle foto.");
        setPending(false);
        return;
      }
    }
    const newFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key === "photos") continue;
      newFormData.append(key, value);
    }
    for (const file of photos) {
      newFormData.append("photos", file);
    }
    const result = await createEntry(groupId, newFormData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        name="title"
        placeholder="Titolo evento"
        required
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <select
        name="type"
        required
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
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="SIMPLE">Voto semplice (solo voto 1–10)</option>
          <option value="DETAILED">Voto dettagliato (costo, servizio, …)</option>
        </select>
      </div>
      <div>
        <label htmlFor="happened_at" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
          Data
        </label>
        <input
          id="happened_at"
          type="date"
          name="happened_at"
          required
          defaultValue={todayISO()}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
          Descrizione (opzionale)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Dove, cosa avete mangiato..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label htmlFor="photos" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
          Foto evento (max 3, opzionale)
        </label>
        <input
          id="photos"
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:file:bg-zinc-700 dark:file:text-zinc-200 dark:hover:file:bg-zinc-600"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          JPEG, PNG, WebP o GIF. Max 3 file. Verranno compresse automaticamente (~400 KB ciascuna).
        </p>
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Partecipanti all&apos;evento (solo loro potranno scrivere una recensione)
        </span>
        <ul className="flex flex-wrap gap-2">
          {members.map((m) => {
            const isCreator = m.id === currentUserId;
            return (
              <li key={m.id}>
                <label
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800 ${
                    isCreator
                      ? "cursor-default border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                      : "cursor-pointer border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                  title={isCreator ? "L'organizzatore è sempre partecipante" : undefined}
                >
                  <input
                    type="checkbox"
                    name="participants"
                    value={m.id}
                    defaultChecked={isCreator}
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
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Creazione in corso…" : "Crea evento"}
      </button>
    </form>
  );
}
