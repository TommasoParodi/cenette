"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const BackIcon = () => (
  <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l-7 7 7 7" />
  </svg>
);

export type TopbarProps = {
  /** Titolo o logo (es. "Cenette", nome gruppo, nome evento) */
  title: React.ReactNode;
  /** Mostra il pulsante Indietro (nascosto nella pagina principale dashboard) */
  showBack?: boolean;
  /** Link del pulsante Indietro */
  backHref?: string;
  /** Se true, Indietro usa router.back() (per pagine transazionali) */
  backReplace?: boolean;
  /** Se true, Indietro va sempre a backHref con replace (es. dettaglio evento → lista eventi) */
  backAlwaysToHref?: boolean;
  /** Contenuto a destra (es. Esci, Modifica, codice invito) */
  right?: React.ReactNode;
  /** Barra sticky in alto (default true) */
  sticky?: boolean;
  className?: string;
};

export function Topbar({
  title,
  showBack = false,
  backHref = "/dashboard",
  backReplace = false,
  backAlwaysToHref = false,
  right,
  sticky = true,
  className = "",
}: TopbarProps) {
  const router = useRouter();

  return (
    <header
      className={
        [
          "flex items-center gap-3 border-b bg-surface px-4 py-3 shadow-[0_1px_3px_rgb(0_0_0_/0.06)]",
          "border-b-[#E0E4E8]",
          sticky && "sticky top-0 z-30",
          className,
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {showBack && backHref ? backAlwaysToHref ? (
        <button
          type="button"
          onClick={() => router.replace(backHref)}
          className="flex shrink-0 items-center justify-center text-foreground/70 hover:text-foreground"
          aria-label="Indietro"
        >
          <BackIcon />
        </button>
      ) : backReplace ? (
        <button
          type="button"
          onClick={() => router.back()}
          className="flex shrink-0 items-center justify-center text-foreground/70 hover:text-foreground"
          aria-label="Indietro"
        >
          <BackIcon />
        </button>
      ) : (
        <Link
          href={backHref}
          className="flex shrink-0 items-center justify-center text-foreground/70 hover:text-foreground"
          aria-label="Indietro"
        >
          <BackIcon />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        {typeof title === "string" ? (
          <span className="block truncate text-lg font-semibold text-foreground">{title}</span>
        ) : (
          title
        )}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-3">{right}</div> : null}
    </header>
  );
}
