"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEntry,
  deleteEntryPhoto,
  updateEntry,
  uploadEntryPhotos,
} from "@/server-actions/entries";
import { compressPhotoFiles } from "@/lib/compress-photos";

export type EntryFormMember = { id: string; displayName: string };
export type EntryFormPhotoItem = { id: string; url: string };

type CreateProps = {
  mode: "create";
  groupId: string;
  members: EntryFormMember[];
  currentUserId: string;
};

type EditProps = {
  mode: "edit";
  entryId: string;
  defaultTitle: string;
  defaultType: "HOME" | "OUT";
  defaultVoteMode: "SIMPLE" | "DETAILED";
  defaultHappenedAt: string;
  defaultDescription: string | null;
  members: EntryFormMember[];
  defaultParticipantIds: string[];
  creatorId: string;
  currentPhotos: EntryFormPhotoItem[];
};

export type EntryFormProps = CreateProps | EditProps;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateForInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MAX_PHOTOS = 3;
const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
const fileInputClass =
  "min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:file:bg-zinc-700 dark:file:text-zinc-200 dark:hover:file:bg-zinc-600";

export function EntryForm(props: EntryFormProps) {
  const isCreate = props.mode === "create";
  const groupId = isCreate ? props.groupId : undefined;
  const entryId = !isCreate ? props.entryId : undefined;
  const creatorId = isCreate ? props.currentUserId : props.creatorId;
  const defaultTitle = isCreate ? undefined : props.defaultTitle;
  const defaultType = isCreate ? undefined : props.defaultType;
  const defaultVoteMode = isCreate ? undefined : props.defaultVoteMode;
  const defaultHappenedAt = isCreate ? todayISO() : formatDateForInput(props.defaultHappenedAt);
  const defaultDescription = isCreate ? undefined : (props.defaultDescription ?? "");
  const defaultParticipantIds = !isCreate ? props.defaultParticipantIds : [];
  const serverPhotos = !isCreate ? props.currentPhotos : [];

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [photoAddError, setPhotoAddError] = useState<string | null>(null);
  const [photoAddPending, setPhotoAddPending] = useState(false);
  const [hasPhotoSelected, setHasPhotoSelected] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const totalPhotoCount = isCreate ? pendingPhotos.length : serverPhotos.length;
  const canAddMorePhotos = totalPhotoCount < MAX_PHOTOS;

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  async function handleAddPhotos() {
    const input = photoInputRef.current;
    if (!input?.files?.length) {
      setPhotoAddError("Seleziona almeno una foto.");
      return;
    }
    setPhotoAddError(null);
    setPhotoAddPending(true);
    const remaining = Math.max(0, MAX_PHOTOS - totalPhotoCount);
    const raw = Array.from(input.files).slice(0, remaining);
    if (raw.length === 0) {
      setPhotoAddError("Puoi aggiungere al massimo 3 foto.");
      setPhotoAddPending(false);
      return;
    }
    try {
      const compressed = await compressPhotoFiles(raw);
      if (isCreate) {
        const newUrls = compressed.map((f) => URL.createObjectURL(f));
        setPendingPhotos((prev) => [...prev, ...compressed].slice(0, MAX_PHOTOS));
        setPreviewUrls((prev) => [...prev, ...newUrls].slice(0, MAX_PHOTOS));
        input.value = "";
        setHasPhotoSelected(false);
      } else {
        const formData = new FormData();
        for (const f of compressed) formData.append("photos", f);
        const result = await uploadEntryPhotos(entryId!, formData);
        if (result?.error) {
          setPhotoAddError(result.error);
        } else if (result?.success) {
          input.value = "";
          setHasPhotoSelected(false);
          router.refresh();
        }
      }
    } catch {
      setPhotoAddError(isCreate ? "Errore durante la compressione." : "Errore di caricamento.");
    }
    setPhotoAddPending(false);
  }

  function handleRemovePendingPhoto(index: number) {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index] ?? "");
      return next.filter((_, i) => i !== index);
    });
  }

  async function handleRemoveServerPhoto(photoId: string) {
    const formData = new FormData();
    formData.append("photoId", photoId);
    try {
      await deleteEntryPhoto(formData);
      router.refresh();
    } catch (e) {
      if (
        typeof (e as { digest?: string })?.digest === "string" &&
        (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
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
    const newFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key === "photos") continue;
      newFormData.append(key, value);
    }
    if (isCreate && groupId) {
      for (const file of pendingPhotos) {
        newFormData.append("photos", file);
      }
      const result = await createEntry(groupId, newFormData);
      setPending(false);
      if (result?.error) setError(result.error);
    } else if (!isCreate && entryId) {
      const result = await updateEntry(entryId, newFormData);
      setPending(false);
      if (result?.error) setError(result.error);
    } else {
      setPending(false);
    }
  }

  const submitLabel = isCreate ? (pending ? "Creazione in corso…" : "Crea evento") : (pending ? "Salvataggio…" : "Salva modifiche");
  const photoHint = isCreate
    ? `Aggiungi foto (max ${MAX_PHOTOS - pendingPhotos.length}) — verranno caricate alla creazione dell'evento`
    : `Aggiungi foto (max ${MAX_PHOTOS - serverPhotos.length}) — caricate subito, senza salvare il form`;

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
      {pending && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-zinc-900/80"
          aria-hidden="true"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-400" />
        </div>
      )}
      <input
        type="text"
        name="title"
        placeholder="Titolo evento"
        required
        defaultValue={defaultTitle}
        className={inputClass}
      />
      <select name="type" required defaultValue={defaultType} className={inputClass}>
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
          className={`w-full ${inputClass}`}
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
          defaultValue={defaultHappenedAt}
          className={inputClass}
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
          defaultValue={defaultDescription}
          className={`w-full ${inputClass}`}
        />
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Foto evento (max 3)
        </span>
        {serverPhotos.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {serverPhotos.map(({ id, url }) => (
              <li
                key={id}
                className="relative aspect-square w-24 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveServerPhoto(id)}
                  className="absolute right-1 top-1 rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700"
                  title="Rimuovi foto"
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
        {pendingPhotos.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {previewUrls.map((url, i) => (
              <li
                key={`pending-${i}`}
                className="relative aspect-square w-24 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePendingPhoto(i)}
                  className="absolute right-1 top-1 rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700"
                  title="Rimuovi foto"
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
        {canAddMorePhotos && (
          <>
            <label htmlFor="entry-photos" className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
              {photoHint}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={photoInputRef}
                id="entry-photos"
                type="file"
                name="photos"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => setHasPhotoSelected((e.target.files?.length ?? 0) > 0)}
                className={fileInputClass}
              />
              <button
                type="button"
                onClick={handleAddPhotos}
                disabled={!hasPhotoSelected || photoAddPending}
                className="shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {photoAddPending ? "Caricamento…" : "Carica foto"}
              </button>
            </div>
            {photoAddError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{photoAddError}</p>
            )}
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Seleziona una o più foto e clicca &quot;Carica foto&quot;. Verranno compresse (~400 KB
              ciascuna).
            </p>
          </>
        )}
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Partecipanti all&apos;evento (solo loro potranno scrivere una recensione)
        </span>
        <ul className="flex flex-wrap gap-2">
          {props.members.map((m) => {
            const isCreator = m.id === creatorId;
            const defaultChecked =
              isCreate ? isCreator : (defaultParticipantIds?.includes(m.id) ?? false) || isCreator;
            return (
              <li key={m.id}>
                <label
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800 ${
                    isCreator
                      ? "cursor-default border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                      : "cursor-pointer border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                  title={
                    isCreator
                      ? isCreate
                        ? "L'organizzatore è sempre partecipante"
                        : "L'organizzatore non può essere rimosso"
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    name="participants"
                    value={m.id}
                    defaultChecked={defaultChecked}
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
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {submitLabel}
      </button>
    </form>
  );
}
