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

function getInitials(name: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const inputClass =
  "w-full rounded-xl border border-separator-line bg-surface px-3 py-2.5 text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

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
  const [type, setType] = useState<"HOME" | "OUT">(defaultType ?? "HOME");
  const [voteMode, setVoteMode] = useState<"SIMPLE" | "DETAILED">(defaultVoteMode ?? "SIMPLE");
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [photoAddError, setPhotoAddError] = useState<string | null>(null);
  const [photoAddPending, setPhotoAddPending] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const totalPhotoCount = isCreate ? pendingPhotos.length : serverPhotos.length;
  const canAddMorePhotos = totalPhotoCount < MAX_PHOTOS;

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  async function handleAddPhotos(filesFromInput?: FileList | null) {
    const input = photoInputRef.current;
    const rawFiles = filesFromInput ? Array.from(filesFromInput) : Array.from(input?.files ?? []);
    if (!rawFiles.length) {
      if (!filesFromInput) setPhotoAddError("Seleziona almeno una foto.");
      return;
    }
    setPhotoAddError(null);
    setPhotoAddPending(true);
    const remaining = Math.max(0, MAX_PHOTOS - totalPhotoCount);
    const raw = rawFiles.slice(0, remaining);
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
        if (input) input.value = "";
      } else {
        const formData = new FormData();
        for (const f of compressed) formData.append("photos", f);
        const result = await uploadEntryPhotos(entryId!, formData);
        if (result?.error) setPhotoAddError(result.error);
        else if (result?.success) {
          if (input) input.value = "";
          router.refresh();
        }
      }
    } catch {
      setPhotoAddError(isCreate ? "Errore durante la compressione." : "Errore di caricamento.");
    }
    setPhotoAddPending(false);
  }

  function handlePhotoInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files?.length) handleAddPhotos(files);
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

  const submitLabel = isCreate ? (pending ? "Creazione in corso…" : "Salva evento") : (pending ? "Salvataggio…" : "Salva modifiche");

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-6">
      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80" aria-hidden>
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-separator-line border-t-accent" />
        </div>
      )}

      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="vote_mode" value={voteMode} />

      <section>
        <label htmlFor="title" className="mb-2 block text-sm font-semibold text-foreground">Titolo</label>
        <input
          id="title"
          type="text"
          name="title"
          placeholder="es. Carbonara da Marco"
          required
          defaultValue={defaultTitle}
          className={inputClass}
        />
      </section>

      <section>
        <label htmlFor="happened_at" className="mb-2 block text-sm font-semibold text-foreground">Data</label>
        <div className="relative">
          <input
            id="happened_at"
            type="date"
            name="happened_at"
            required
            defaultValue={defaultHappenedAt}
            className={`${inputClass} pr-10`}
          />
          <svg className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </section>

      <section>
        <span className="mb-2 block text-sm font-semibold text-foreground">Tipo</span>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setType("HOME")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              type === "HOME" ? "bg-accent-strong text-accent-foreground" : "bg-avatar-member-bg text-foreground hover:bg-surface-muted"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            A casa
          </button>
          <button
            type="button"
            onClick={() => setType("OUT")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              type === "OUT" ? "bg-accent-strong text-accent-foreground" : "bg-avatar-member-bg text-foreground hover:bg-surface-muted"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Fuori
          </button>
        </div>
      </section>

      <section>
        <span className="mb-2 block text-sm font-semibold text-foreground">Modalità voto</span>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setVoteMode("SIMPLE")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              voteMode === "SIMPLE" ? "bg-accent-strong text-accent-foreground" : "bg-avatar-member-bg text-foreground hover:bg-surface-muted"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Semplice
          </button>
          <button
            type="button"
            onClick={() => setVoteMode("DETAILED")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              voteMode === "DETAILED" ? "bg-accent-strong text-accent-foreground" : "bg-avatar-member-bg text-foreground hover:bg-surface-muted"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Dettagliato
          </button>
        </div>
      </section>

      <section>
        <label htmlFor="description" className="mb-2 block text-sm font-semibold text-foreground">Descrizione</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Racconta qualcosa su questa cena..."
          defaultValue={defaultDescription}
          className={inputClass}
        />
      </section>

      <section>
        <span className="mb-2 block text-sm font-semibold text-foreground">Partecipanti</span>
        <ul className="flex flex-wrap gap-2">
          {props.members.map((m) => {
            const isCreator = m.id === creatorId;
            const defaultChecked = isCreate ? isCreator : (defaultParticipantIds?.includes(m.id) ?? false) || isCreator;
            const initials = getInitials(m.displayName);
            return (
              <li key={m.id}>
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                    isCreator ? "cursor-default bg-accent-strong text-accent-foreground" : "bg-avatar-member-bg text-foreground hover:bg-surface-muted has-[:checked]:bg-accent-strong has-[:checked]:text-accent-foreground"
                  }`}
                  title={isCreator ? "L'organizzatore è sempre partecipante" : undefined}
                >
                  <input
                    type="checkbox"
                    name="participants"
                    value={m.id}
                    defaultChecked={defaultChecked}
                    disabled={isCreator}
                    className="peer sr-only"
                  />
                  <span className="font-medium">{initials}</span>
                  {m.displayName}
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <span className="mb-2 block text-sm font-semibold text-foreground">Foto (max 3)</span>
        {(serverPhotos.length > 0 || previewUrls.length > 0) && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {serverPhotos.map(({ id, url }) => (
              <div key={id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-24 w-24 rounded-xl border border-separator-line object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveServerPhoto(id)}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface shadow"
                  aria-label="Rimuovi foto"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {previewUrls.map((url, i) => (
              <div key={`p-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-24 w-24 rounded-xl border border-separator-line object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePendingPhoto(i)}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface shadow"
                  aria-label="Rimuovi foto"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {canAddMorePhotos && (
          <>
            <input
              ref={photoInputRef}
              id="entry-photos"
              type="file"
              name="photos"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              aria-label="Aggiungi foto"
              onChange={handlePhotoInputChange}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoAddPending}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-separator-line bg-surface py-8 text-text-secondary transition hover:border-accent/50 hover:bg-avatar-member-bg/30 disabled:opacity-50"
            >
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Aggiungi foto</span>
              <span className="text-xs text-text-secondary">JPEG, PNG, WebP o GIF, max 5 MB</span>
            </button>
            {photoAddError && <p className="mt-1 text-xs text-red-600">{photoAddError}</p>}
          </>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent-strong py-3 text-sm font-medium text-accent-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}
