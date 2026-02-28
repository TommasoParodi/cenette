import { Topbar } from "@/components/Topbar";

type EntryFormPageLayoutProps = {
  title: string;
  backHref: string;
  /** Indietro con replace (per non rientrare nella pagina transazionale con back del browser) */
  backReplace?: boolean;
  children: React.ReactNode;
};

/**
 * Layout condiviso per le pagine "Nuovo evento" e "Modifica evento":
 * topbar + contenuto (stile allineato alla pagina recensioni, senza card).
 */
export function EntryFormPageLayout({
  title,
  backHref,
  backReplace,
  children,
}: EntryFormPageLayoutProps) {
  return (
    <main className="min-h-screen pb-8">
      <div className="mx-auto max-w-2xl">
        <Topbar showBack backHref={backHref} backReplace={backReplace} title={title} />

        <div className="px-4 pt-6">
          {children}
        </div>
      </div>
    </main>
  );
}
