"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEntryPhoto, updateEntry, uploadEntryPhotos } from "@/server-actions/entries";
import { compressPhotoFiles } from "@/lib/compress-photos";

type Member = { id: string; displayName: string };
type PhotoItem = { id: string; url: string };

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
  currentPhotos: PhotoItem[];
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
  currentPhotos,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoUploadPending, setPhotoUploadPending] = useState(false);
  const [hasPhotoSelected, setHasPhotoSelected] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUploadPhotos() {
    const input = photoInputRef.current;
    if (!input?.files?.length) {
      setPhotoUploadError("Seleziona almeno una foto.");
      return;
    }
    setPhotoUploadError(null);
    setPhotoUploadPending(true);
    const raw = Array.from(input.files).slice(0, Math.max(0, 3 - currentPhotos.length));
    if (raw.length === 0) {
      setPhotoUploadError("Puoi aggiungere al massimo 3 foto.");
      setPhotoUploadPending(false);
      return;
    }
    let files: File[];
    try {
      files = await compressPhotoFiles(raw);
    } catch {
      setPhotoUploadError("Errore durante la compressione.");
      setPhotoUploadPending(false);
      return;
    }
    const formData = new FormData();
    for (const f of files) formData.append("photos", f);
    try {
      const result = await uploadEntryPhotos(entryId, formData);
      setPhotoUploadPending(false);
      if (result?.error) {
        setPhotoUploadError(result.error);
        return;
      }
      if (result?.success) {
        input.value = "";
        setHasPhotoSelected(false);
        router.refresh();
      }
    } catch (e) {
      setPhotoUploadPending(false);
      setPhotoUploadError("Errore di caricamento.");
    }
  }

  async function handleRemovePhoto(photoId: string) {
    const formData = new FormData();
    formData.append("photoId", photoId);
    try {
      await deleteEntryPhoto(formData);
    } catch (e) {
      if (typeof (e as { digest?: string })?.digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        return;
      }
      setError("Errore durante la rimozione della foto.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    // Le foto si caricano solo con "Carica foto", non con Salva modifiche
    const newFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key === "photos") continue;
      newFormData.append(key, value);
    }
    const result = await updateEntry(entryId, newFormData);
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
          Foto evento (max 3)
        </span>
        {currentPhotos.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {currentPhotos.map(({ id, url }) => (
              <li
                key={id}
                className="relative aspect-square w-24 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(id)}
                  className="absolute right-1 top-1 rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700"
                  title="Rimuovi foto"
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
        {currentPhotos.length < 3 && (
          <>
            <label htmlFor="edit-photos" className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
              Aggiungi foto (max {3 - currentPhotos.length}) — caricate subito, senza salvare il form
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={photoInputRef}
                id="edit-photos"
                type="file"
                name="photos"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => setHasPhotoSelected((e.target.files?.length ?? 0) > 0)}
                className="flex-1 min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:file:bg-zinc-700 dark:file:text-zinc-200 dark:hover:file:bg-zinc-600"
              />
              <button
                type="button"
                onClick={handleUploadPhotos}
                disabled={!hasPhotoSelected || photoUploadPending}
                className="shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {photoUploadPending ? "Caricamento…" : "Carica foto"}
              </button>
            </div>
            {photoUploadError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{photoUploadError}</p>
            )}
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Seleziona una o più foto e clicca &quot;Carica foto&quot;. Verranno compresse (~400 KB ciascuna).
            </p>
          </>
        )}
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
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Salvataggio…" : "Salva modifiche"}
      </button>
    </form>
  );
}
