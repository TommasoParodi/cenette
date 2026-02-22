import Link from "next/link";

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
  right,
  sticky = true,
  className = "",
}: TopbarProps) {
  return (
    <header
      className={
        [
          "flex items-center gap-3 border-b border-separator-line bg-background px-4 py-3",
          sticky && "sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
          className,
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {showBack && backHref ? (
        <Link
          href={backHref}
          className="flex shrink-0 items-center justify-center text-text-secondary hover:text-foreground"
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
