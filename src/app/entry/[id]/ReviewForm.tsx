"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createOrUpdateReview } from "@/server-actions/entries";

type Props = {
  entryId: string;
  voteMode: "SIMPLE" | "DETAILED";
  initialRating?: number | null;
  initialComment?: string | null;
  initialRatingCost?: number | null;
  initialRatingService?: number | null;
  initialRatingFood?: number | null;
  initialRatingLocation?: number | null;
  initialPhotoUrl?: string | null;
};

function SliderRow({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex items-center gap-3">
      <label className="w-20 shrink-0 text-sm text-foreground">{label}</label>
      <input
        type="range"
        name={name}
        min={1}
        max={10}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="h-2 flex-1 appearance-none rounded-full bg-surface-muted [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(value / 10) * 100}%, var(--surface-muted) ${(value / 10) * 100}%, var(--surface-muted) 100%)`,
        }}
      />
      <span className="w-6 shrink-0 text-right text-sm font-medium text-accent">{value}</span>
    </div>
  );
}

function ReviewFormContent({
  entryId,
  voteMode,
  initialRating,
  initialComment,
  initialRatingCost,
  initialRatingService,
  initialRatingFood,
  initialRatingLocation,
  initialPhotoUrl,
  state,
}: Props & { state: string | null }) {
  const { pending } = useFormStatus();
  const isEdit = initialRating != null;
  const isDetailed = voteMode === "DETAILED";
  const [overallRating, setOverallRating] = useState<number | null>(initialRating ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const removePhotoCheckboxRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeInitialPhoto, setRemoveInitialPhoto] = useState(false);

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const showInitialPhoto = initialPhotoUrl && !removeInitialPhoto;
  const showNewPreview = previewUrl && selectedFile;
  const hasPhotoPreview = showInitialPhoto || showNewPreview;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
    if (!file) setPreviewUrl(null);
  }

  function clearNewPhoto() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearInitialPhoto() {
    setRemoveInitialPhoto(true);
    removePhotoCheckboxRef.current?.click();
  }

  return (
    <>
      {pending && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80"
          aria-hidden
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-separator-line border-t-accent"
            aria-hidden
          />
        </div>
      )}

      <input type="hidden" name="rating_overall" value={overallRating ?? ""} required />

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Voto complessivo</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setOverallRating(n)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition ${
                overallRating === n
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-separator-line bg-surface text-foreground hover:border-accent/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {isDetailed && (
        <section className="mb-6 rounded-xl bg-avatar-member-bg/50 p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Voti dettagliati</h2>
          <div className="space-y-4">
            <SliderRow
              name="rating_food"
              label="Cibo"
              defaultValue={initialRatingFood ?? 7}
            />
            <SliderRow
              name="rating_service"
              label="Servizio"
              defaultValue={initialRatingService ?? 7}
            />
            <SliderRow
              name="rating_cost"
              label="Costo"
              defaultValue={initialRatingCost ?? 7}
            />
            <SliderRow
              name="rating_location"
              label="Location"
              defaultValue={initialRatingLocation ?? 7}
            />
          </div>
        </section>
      )}

      <section className="mb-6">
        <label htmlFor="comment" className="mb-2 block text-sm font-semibold text-foreground">
          Commento
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          placeholder="Com'era la cena? Racconta la tua esperienza..."
          defaultValue={initialComment ?? ""}
          className="w-full rounded-xl border border-separator-line bg-surface px-3 py-2.5 text-sm text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </section>

      <section className="mb-6">
        <span className="mb-2 block text-sm font-semibold text-foreground">
          Foto (opzionale)
        </span>
        <input
          ref={removePhotoCheckboxRef}
          type="checkbox"
          name="remove_photo"
          value="1"
          className="sr-only"
          aria-hidden
        />
        {hasPhotoPreview && (
          <div className="mb-3 flex justify-center">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showNewPreview ? previewUrl! : initialPhotoUrl!}
                alt="Anteprima foto recensione"
                className="h-32 w-32 rounded-xl border border-separator-line object-cover"
              />
              <button
                type="button"
                onClick={showNewPreview ? clearNewPhoto : clearInitialPhoto}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-surface shadow-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Rimuovi foto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          aria-label="Aggiungi foto"
          onChange={handleFileChange}
        />
        {!hasPhotoPreview && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-separator-line bg-surface py-8 text-text-secondary transition hover:border-accent/50 hover:bg-avatar-member-bg/30"
          >
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
            </svg>
            <span className="text-xs font-medium">Aggiungi foto</span>
            <span className="text-xs text-text-secondary">JPEG, PNG, WebP o GIF, max 5 MB</span>
          </button>
        )}
      </section>

      {state && <p className="mb-4 text-sm text-red-600">{state}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent-strong py-3 text-sm font-medium text-accent-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Invio in corso…" : isEdit ? "Aggiorna recensione" : "Invia recensione"}
      </button>
    </>
  );
}

export function ReviewForm(props: Props) {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await createOrUpdateReview(props.entryId, formData);
      if (result?.error) return result.error;
      return null;
    },
    null as string | null
  );

  return (
    <form action={formAction} className="relative flex flex-col">
      <ReviewFormContent {...props} state={state} />
    </form>
  );
}
