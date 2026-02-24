"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createOrUpdateReview } from "@/server-actions/entries";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { inputBaseClassName } from "@/components/ui/inputBaseStyles";

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

const IconStar = () => (
  <svg className="h-5 w-5 shrink-0 text-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconList = () => (
  <svg className="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const IconEuro = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLightbulb = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const IconCutlery = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M12 2c-1.5 0-2.5 1.5-2.5 4v6h5V6c0-2.5-1-4-2.5-4zm0 0c1.5 0 2.5 1.5 2.5 4v6h-5V6c0-2.5 1-4 2.5-4zM5 22V11a2 2 0 012-2h10a2 2 0 012 2v11" />
  </svg>
);

const IconMapPin = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconArrowRight = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

function SliderRow({
  name,
  label,
  defaultValue,
  icon: Icon,
}: {
  name: string;
  label: string;
  defaultValue: number;
  icon: () => JSX.Element;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="rounded-xl bg-[var(--input-bg)] px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-foreground">
            <Icon />
          </span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold text-accent">{value}/10</span>
      </div>
      <div className="w-full">
        <input
          type="range"
          name={name}
          min={1}
          max={10}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="h-2 w-full appearance-none rounded-full bg-surface-muted [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((value - 1) / 9) * 100}%, var(--surface-muted) ${((value - 1) / 9) * 100}%, var(--surface-muted) 100%)`,
          }}
        />
      </div>
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
          className="fixed inset-0 z-10 flex items-center justify-center bg-background/80"
          aria-hidden
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-separator-line border-t-accent"
            aria-hidden
          />
        </div>
      )}

      <input type="hidden" name="rating_overall" value={overallRating ?? ""} required />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Com&apos;è andata?</h1>
        <p className="mt-1 text-sm text-text-tertiary">Raccontaci la tua esperienza da Cenette</p>
      </div>

      {/* Voto complessivo */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <IconStar />
          <h2 className="text-base font-bold text-foreground">Voto complessivo</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setOverallRating(n)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-medium transition ${
                overallRating === n
                  ? "bg-accent text-accent-foreground"
                  : "bg-[#F2F4F8] text-[#24374A] hover:bg-accent/20"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* Dettagli dell'esperienza */}
      {isDetailed && (
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <IconList />
            <h2 className="text-base font-bold text-foreground">Dettagli dell&apos;esperienza</h2>
          </div>
          <div className="space-y-3">
            <SliderRow
              name="rating_cost"
              label="Costo"
              defaultValue={initialRatingCost ?? 7}
              icon={IconEuro}
            />
            <SliderRow
              name="rating_service"
              label="Servizio"
              defaultValue={initialRatingService ?? 7}
              icon={IconLightbulb}
            />
            <SliderRow
              name="rating_food"
              label="Cibo"
              defaultValue={initialRatingFood ?? 7}
              icon={IconCutlery}
            />
            <SliderRow
              name="rating_location"
              label="Location"
              defaultValue={initialRatingLocation ?? 7}
              icon={IconMapPin}
            />
          </div>
        </section>
      )}

      {/* Raccontaci di più */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-foreground">Raccontaci di più</h2>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          placeholder="Com'era l'atmosfera? Qual è stato il tuo piatto preferito?"
          defaultValue={initialComment ?? ""}
          className={inputBaseClassName}
        />
      </section>

      {/* Aggiungi una foto */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Aggiungi una foto</h2>
          <span className="text-sm text-text-tertiary">Massimo 1 foto</span>
        </div>
        <input
          ref={removePhotoCheckboxRef}
          type="checkbox"
          name="remove_photo"
          value="1"
          className="sr-only"
          aria-hidden
        />
        <input
          ref={fileInputRef}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          aria-label="Aggiungi foto"
          onChange={handleFileChange}
        />
        <div className="flex justify-center">
          {hasPhotoPreview ? (
            <div className="relative aspect-square w-full max-w-[120px] shrink-0 rounded-xl border-2 border-dashed border-[var(--input-border)] bg-[var(--input-bg)]">
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={showNewPreview ? previewUrl! : initialPhotoUrl!}
                  alt="Anteprima foto recensione"
                  className="h-full w-full object-cover"
                />
              </div>
              {pending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
                  <LoadingSpinner className="h-8 w-8 border-2 border-white/40 border-t-white" />
                </div>
              )}
              <button
                type="button"
                onClick={showNewPreview ? clearNewPhoto : clearInitialPhoto}
                disabled={pending}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-white shadow disabled:opacity-70"
                aria-label="Rimuovi foto"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              className="flex aspect-square w-full max-w-[120px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-accent bg-transparent transition hover:bg-accent/10 disabled:opacity-50"
              aria-label="Aggiungi foto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/camera-plus.png" alt="" className="h-10 w-10 object-contain mix-blend-multiply" width={40} height={40} aria-hidden />
              <span className="text-xs font-bold uppercase tracking-wide text-accent">Aggiungi</span>
            </button>
          )}
        </div>
      </section>

      {state && <p className="mb-4 text-sm text-red-600">{state}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-semibold text-accent-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Invio in corso…" : isEdit ? "Aggiorna recensione" : "Pubblica recensione"}
        {!pending && <IconArrowRight />}
      </button>

      <p className="mt-4 text-center text-xs text-text-tertiary">
        Pubblicando questa recensione accetti i nostri Termini di Servizio e le Linee Guida sui contenuti.
      </p>
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
    <form action={formAction} className="relative flex flex-col pb-8">
      <ReviewFormContent {...props} state={state} />
    </form>
  );
}
