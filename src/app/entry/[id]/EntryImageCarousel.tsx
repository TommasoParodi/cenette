"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

const PLACEHOLDER = "/images/placeholder-event.png";

type Props = {
  imageUrls: { id: string; url: string }[];
};

export function EntryImageCarousel({ imageUrls }: Props) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const slides = imageUrls.length > 0 ? imageUrls : [{ id: "placeholder", url: PLACEHOLDER }];
  const count = slides.length;
  const isPlaceholder = imageUrls.length === 0;

  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const currentSlide = slides[index];

  return (
    <>
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-avatar-member-bg">
      {slides.map((slide, i) => (
        <button
          type="button"
          key={slide.id}
          onClick={() => setLightboxOpen(true)}
          className={`absolute inset-0 w-full transition-opacity duration-200 ${
            i === index ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
          }`}
          aria-label="Ingrandisci foto"
        >
          {isPlaceholder && i === 0 ? (
            <Image src={PLACEHOLDER} alt="" fill className="object-cover" sizes="100vw" />
          ) : (
            <img src={slide.url} alt="" className="h-full w-full object-cover" />
          )}
        </button>
      ))}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white"
            aria-label="Foto precedente"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white"
            aria-label="Foto successiva"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      {count > 1 && (
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Anteprima foto"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black transition hover:bg-white"
            aria-label="Chiudi"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black transition hover:bg-white"
                aria-label="Foto precedente"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black transition hover:bg-white"
                aria-label="Foto successiva"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {isPlaceholder && currentSlide.id === "placeholder" ? (
              <img
                src={PLACEHOLDER}
                alt=""
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <img
                src={currentSlide.url}
                alt=""
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
