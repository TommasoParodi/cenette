import Link from "next/link";
import { TopbarBackButton } from "@/components/TopbarBackButton";

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
  /** Se true, prova ad andare davvero indietro; se non c'è history usa backHref come fallback */
  backReplace?: boolean;
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
  right,
  sticky = true,
  className = "",
}: TopbarProps) {
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
      {showBack && backHref ? backReplace ? (
        <TopbarBackButton backHref={backHref} />
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
