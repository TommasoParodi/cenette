/**
 * Classi base per tutti gli input: sfondo e bordo tenui, poco contrasto con la pagina.
 * Usare per input, textarea e aree di upload (variante dashed).
 */

/** Classe per input e textarea (bordo solido) */
export const inputBaseClassName =
  "w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

/** Classe per area upload / dropzone (bordo tratteggiato) */
export const inputDropzoneClassName =
  "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--input-border)] bg-[var(--input-bg)] py-10 text-foreground transition hover:border-accent/50 hover:opacity-90";
