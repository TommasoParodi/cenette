"use client";

import Image from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/images/placeholder-event.png";

type Props = {
  imageUrls: { id: string; url: string }[];
};

export function EntryImageCarousel({ imageUrls }: Props) {
  const [index, setIndex] = useState(0);
  const slides = imageUrls.length > 0 ? imageUrls : [{ id: "placeholder", url: PLACEHOLDER }];
  const count = slides.length;
  const isPlaceholder = imageUrls.length === 0;

  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-avatar-member-bg">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-200 ${
            i === index ? "z-10 opacity-100" : "z-0 opacity-0"
          }`}
        >
          {isPlaceholder && i === 0 ? (
            <Image src={PLACEHOLDER} alt="" fill className="object-cover" sizes="100vw" />
          ) : (
            <img src={slide.url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
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
      {imageUrls.length > 0 && (
        <div className="absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
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
  );
}
