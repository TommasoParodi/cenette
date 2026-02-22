"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";

/**
 * Overlay a tutta pagina con spinner, come nelle loading.tsx.
 * Usare durante azioni async (es. eliminazione) per mostrare attesa.
 */
export function PageLoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background/80"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner />
    </div>
  );
}
