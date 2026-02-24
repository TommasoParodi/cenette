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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { inputBaseClassName, inputDropzoneClassName } from "@/components/ui/inputBaseStyles";

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

const IconArrowRight = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

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
  const [uploadingPreviewUrl, setUploadingPreviewUrl] = useState<string | null>(null);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const [voteModeConfirmOpen, setVoteModeConfirmOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? "");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const isTitleEmpty = !title.trim();

  const totalPhotoCount = isCreate
    ? pendingPhotos.length
    : serverPhotos.length + (uploadingPreviewUrl ? 1 : 0);
  const canAddMorePhotos = totalPhotoCount < MAX_PHOTOS;

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      if (uploadingPreviewUrl) URL.revokeObjectURL(uploadingPreviewUrl);
    };
  }, [previewUrls, uploadingPreviewUrl]);

  async function handleAddPhotos(filesFromInput?: FileList | null) {
    const input = photoInputRef.current;
    const rawFiles = filesFromInput ? Array.from(filesFromInput) : Array.from(input?.files ?? []);
    if (!rawFiles.length) {
      if (!filesFromInput) setPhotoAddError("Seleziona una foto.");
      return;
    }
    setPhotoAddError(null);
    const raw = rawFiles.slice(0, 1);
    const currentCount = isCreate ? pendingPhotos.length : serverPhotos.length + (uploadingPreviewUrl ? 1 : 0);
    const remaining = Math.max(0, MAX_PHOTOS - currentCount);
    if (remaining === 0 || raw.length === 0) {
      if (remaining === 0) setPhotoAddError("Puoi aggiungere al massimo 3 foto.");
      return;
    }
    if (isCreate) {
      const instantUrl = URL.createObjectURL(raw[0]);
      setPreviewUrls((prev) => [...prev, instantUrl].slice(0, MAX_PHOTOS));
      setPendingPhotos((prev) => [...prev, raw[0]].slice(0, MAX_PHOTOS));
      if (input) input.value = "";
      setPhotoAddPending(true);
      try {
        const compressed = await compressPhotoFiles(raw);
        const newUrl = URL.createObjectURL(compressed[0]);
        setPreviewUrls((prev) => {
          const next = [...prev];
          if (next.length > 0) URL.revokeObjectURL(next[next.length - 1]!);
          next[next.length - 1] = newUrl;
          return next;
        });
        setPendingPhotos((prev) => {
          const next = [...prev];
          next[next.length - 1] = compressed[0];
          return next;
        });
      } catch {
        setPhotoAddError("Errore durante la compressione.");
        setPendingPhotos((prev) => prev.slice(0, -1));
        setPreviewUrls((prev) => {
          const next = prev.slice(0, -1);
          URL.revokeObjectURL(instantUrl);
          return next;
        });
      }
      setPhotoAddPending(false);
      return;
    }
    const instantUrl = URL.createObjectURL(raw[0]);
    setUploadingPreviewUrl(instantUrl);
    setPhotoAddPending(true);
    if (input) input.value = "";
    try {
      const compressed = await compressPhotoFiles(raw);
      const formData = new FormData();
      formData.append("photos", compressed[0]);
      const result = await uploadEntryPhotos(entryId!, formData);
      if (result?.error) setPhotoAddError(result.error);
      else if (result?.success) router.refresh();
    } catch {
      setPhotoAddError("Errore di caricamento.");
    }
    setUploadingPreviewUrl(null);
    URL.revokeObjectURL(instantUrl);
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
    setRemovingPhotoId(photoId);
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
    } finally {
      setRemovingPhotoId(null);
    }
  }

  async function performSubmit() {
    const form = formRef.current;
    if (!form) return;
    setError(null);
    setPending(true);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const voteModeChanged = !isCreate && voteMode !== defaultVoteMode;
    if (voteModeChanged) {
      setVoteModeConfirmOpen(true);
      return;
    }
    await performSubmit();
  }

  const submitLabel = isCreate ? (pending ? "Creazione in corso…" : "Salva evento") : (pending ? "Salvataggio…" : "Salva modifiche");

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="relative flex flex-col pb-8">
      {pending && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-background/80" aria-hidden>
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-separator-line border-t-accent" />
        </div>
      )}

      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="vote_mode" value={voteMode} />

      <section className="mb-8">
        <label htmlFor="title" className="mb-3 block text-base font-bold text-foreground">
          Titolo <span className="text-red-600" aria-hidden>*</span>
        </label>
        <input
          id="title"
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="es. Carbonara da Marco"
          required
          className={inputBaseClassName}
        />
      </section>

      <section className="mb-8">
        <label htmlFor="happened_at" className="mb-3 block text-base font-bold text-foreground">Data</label>
        <input
          id="happened_at"
          type="date"
          name="happened_at"
          required
          defaultValue={defaultHappenedAt}
          className={inputBaseClassName}
        />
      </section>

      <section className="mb-8">
        <span className="mb-3 block text-base font-bold text-foreground">Tipo</span>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setType("HOME")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              type === "HOME" ? "bg-accent text-accent-foreground" : "bg-[#F2F4F8] text-[#24374A] hover:bg-accent/20"
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
              type === "OUT" ? "bg-accent text-accent-foreground" : "bg-[#F2F4F8] text-[#24374A] hover:bg-accent/20"
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

      <section className="mb-8">
        <span className="mb-3 block text-base font-bold text-foreground">Modalità voto</span>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setVoteMode("SIMPLE")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              voteMode === "SIMPLE" ? "bg-accent text-accent-foreground" : "bg-[#F2F4F8] text-[#24374A] hover:bg-accent/20"
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
              voteMode === "DETAILED" ? "bg-accent text-accent-foreground" : "bg-[#F2F4F8] text-[#24374A] hover:bg-accent/20"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Dettagliato
          </button>
        </div>
      </section>

      <section className="mb-8">
        <label htmlFor="description" className="mb-3 block text-base font-bold text-foreground">Descrizione</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Racconta qualcosa su questa cena..."
          defaultValue={defaultDescription}
          className={inputBaseClassName}
        />
      </section>

      <section className="mb-8">
        <span className="mb-3 block text-base font-bold text-foreground">Partecipanti</span>
        <ul className="flex flex-wrap gap-2">
          {props.members.map((m) => {
            const isCreator = m.id === creatorId;
            const defaultChecked = isCreate ? isCreator : (defaultParticipantIds?.includes(m.id) ?? false) || isCreator;
            const initials = getInitials(m.displayName);
            return (
              <li key={m.id}>
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                    isCreator ? "cursor-default bg-accent text-accent-foreground" : "bg-[#F2F4F8] text-[#24374A] hover:bg-accent/20 has-[:checked]:bg-accent has-[:checked]:text-accent-foreground"
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

      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-foreground">Foto (max 3)</h2>
        <input
          ref={photoInputRef}
          id="entry-photos"
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          aria-label="Aggiungi foto"
          onChange={handlePhotoInputChange}
        />
        <div className="flex justify-center gap-3">
          {[0, 1, 2].map((slotIndex) => {
            const serverPhoto = serverPhotos[slotIndex];
            const previewUrl = previewUrls[slotIndex];
            const hasPhoto = !!serverPhoto || previewUrl !== undefined;
            const isAddSlot = canAddMorePhotos && slotIndex === totalPhotoCount;

            if (!isCreate && slotIndex === serverPhotos.length && uploadingPreviewUrl) {
              return (
                <div key="uploading" className="relative aspect-square w-full max-w-[120px] shrink-0 rounded-xl border-2 border-dashed border-[var(--input-border)] bg-[var(--input-bg)]">
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadingPreviewUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
                    <LoadingSpinner className="h-8 w-8 border-2 border-white/40 border-t-white" />
                  </div>
                </div>
              );
            }
            if (isAddSlot) {
              return (
                <button
                  key="add"
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoAddPending}
                  className="flex aspect-square w-full max-w-[120px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-accent bg-transparent transition hover:bg-accent/10 disabled:opacity-50"
                  aria-label="Aggiungi foto"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/camera-plus.png" alt="" className="h-10 w-10 object-contain mix-blend-multiply" width={40} height={40} aria-hidden />
                  <span className="text-xs font-bold uppercase tracking-wide text-accent">Aggiungi</span>
                </button>
              );
            }
            if (serverPhoto) {
              return (
                <div key={serverPhoto.id} className="relative aspect-square w-full max-w-[120px] shrink-0 rounded-xl border-2 border-dashed border-[var(--input-border)] bg-[var(--input-bg)]">
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={serverPhoto.url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveServerPhoto(serverPhoto.id)}
                    disabled={removingPhotoId === serverPhoto.id}
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-white shadow disabled:opacity-70"
                    aria-label={removingPhotoId === serverPhoto.id ? "Sto rimuovendo la foto…" : "Rimuovi foto"}
                  >
                    {removingPhotoId === serverPhoto.id ? (
                      <LoadingSpinner className="h-3.5 w-3.5 border-2 border-white/40 border-t-white" />
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            }
            if (previewUrl !== undefined) {
              return (
                <div key={`p-${slotIndex}`} className="relative aspect-square w-full max-w-[120px] shrink-0 rounded-xl border-2 border-dashed border-[var(--input-border)] bg-[var(--input-bg)]">
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingPhoto(slotIndex)}
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-white shadow"
                    aria-label="Rimuovi foto"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            }
            return (
              <div
                key={`empty-${slotIndex}`}
                className="flex aspect-square w-full max-w-[120px] shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[var(--input-border)] bg-[var(--input-bg)]"
                aria-hidden
              >
                <svg className="h-8 w-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            );
          })}
        </div>
        {photoAddError && <p className="mt-2 text-xs text-red-600">{photoAddError}</p>}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ConfirmDialog
        open={voteModeConfirmOpen}
        onClose={() => setVoteModeConfirmOpen(false)}
        title="Cambio modalità di voto"
        message="Cambiando la modalità di voto (Semplice/Dettagliato) le recensioni già presenti verranno eliminate. Vuoi continuare?"
        confirmLabel="Continua"
        cancelLabel="Annulla"
        onConfirm={performSubmit}
      />

      <button
        type="submit"
        disabled={pending || isTitleEmpty}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-semibold text-accent-foreground shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
        {!pending && <IconArrowRight />}
      </button>
    </form>
  );
}
