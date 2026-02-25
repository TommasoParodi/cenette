import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";

export const metadata = {
  title: "Termini e Condizioni | Cenette",
  description: "Termini e condizioni di utilizzo della web application Cenette.",
};

export default async function TerminiPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const backHref = user ? "/dashboard" : "/";

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-2xl">
        <Topbar
          showBack
          backHref={backHref}
          title="Termini e Condizioni"
        />
        <div className="px-4 py-6 space-y-8 prose prose-sm max-w-none">
          <p className="text-text-secondary">
            Ultimo aggiornamento: 25 febbraio 2026
          </p>
          <p className="text-text-secondary">
            Benvenuto su <strong>Cenette</strong>. I presenti Termini e Condizioni regolano
            l&apos;accesso e l&apos;utilizzo della web application &quot;Cenette&quot;. Accedendo o
            utilizzando l&apos;app, l&apos;utente accetta integralmente i presenti termini.
          </p>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              1. Cos&apos;è Cenette
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Cenette è una web application privata che consente a gruppi di persone di:
            </p>
            <ul className="mt-2 text-sm text-text-secondary list-disc pl-5 space-y-1">
              <li>creare gruppi chiusi</li>
              <li>registrare eventi (cene a casa o uscite)</li>
              <li>caricare fotografie relative agli eventi</li>
              <li>lasciare recensioni e voti personali</li>
              <li>tenere traccia delle esperienze condivise</li>
            </ul>
            <p className="mt-2 text-sm text-text-secondary">
              Cenette non è una piattaforma pubblica di recensioni né un servizio commerciale. I
              contenuti sono visibili esclusivamente ai membri dei singoli gruppi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              2. Accesso e Registrazione
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              L&apos;accesso a Cenette avviene tramite autenticazione con provider esterni (es.
              Google) o registrazione tramite email e password. L&apos;utente è responsabile della
              veridicità dei dati forniti e della sicurezza delle proprie credenziali di accesso, nonché
              di ogni attività effettuata tramite il proprio account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              3. Utilizzo del Servizio
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              L&apos;utente si impegna a utilizzare l&apos;app in modo lecito e rispettoso degli altri
              membri. È vietato caricare contenuti illegali, offensivi o diffamatori, discriminatori,
              che violino diritti di terzi o diritti d&apos;autore. Cenette si riserva il diritto di
              rimuovere contenuti o sospendere account in caso di violazione dei presenti termini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              4. Contenuti Caricati dagli Utenti
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              L&apos;utente rimane l&apos;unico responsabile dei contenuti caricati (testi, recensioni,
              valutazioni, immagini). Caricando contenuti sull&apos;app, l&apos;utente dichiara di avere
              il diritto di pubblicarli. I contenuti restano di proprietà dell&apos;utente, che concede a
              Cenette una licenza non esclusiva, gratuita e limitata al solo funzionamento del servizio
              per ospitare, archiviare e visualizzare i contenuti all&apos;interno del gruppo di
              appartenenza.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              5. Foto e Immagini
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              L&apos;app consente il caricamento di fino a 3 foto per evento e fino a 1 foto per
              recensione. Le immagini sono archiviate su servizi di terze parti utilizzati per il
              funzionamento tecnico dell&apos;app. L&apos;utente è responsabile delle immagini caricate
              e delle eventuali persone ritratte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              6. Limitazione di Responsabilità
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Cenette fornisce il servizio &quot;così com&apos;è&quot;. Non viene garantita l&apos;assenza di
              errori, la disponibilità continua del servizio o l&apos;assenza di interruzioni o perdita
              di dati. Cenette non è responsabile delle opinioni espresse dagli utenti all&apos;interno
              dei gruppi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              7. Privacy e Dati Personali
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              L&apos;utilizzo dell&apos;app comporta il trattamento di dati personali quali indirizzo
              email, nome visualizzato, contenuti caricati e dati relativi ai gruppi. Il trattamento
              dei dati è disciplinato dalla Privacy Policy disponibile alla pagina dedicata.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              8. Cancellazione Account
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              L&apos;utente può richiedere la cancellazione del proprio account. Cenette si riserva il
              diritto di sospendere o disattivare account in caso di violazione dei presenti Termini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              9. Modifiche ai Termini
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Cenette si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Le
              modifiche entreranno in vigore dalla data di pubblicazione sulla presente pagina.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand mt-8">
              10. Legge Applicabile
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia sarà
              competente il foro del luogo di residenza del titolare del servizio, salvo diversa
              disposizione di legge.
            </p>
          </section>

          <p className="mt-8 text-sm text-text-secondary">
            Per qualsiasi comunicazione relativa ai presenti Termini è possibile contattare il titolare
            del servizio tramite i canali indicati nell&apos;app.
          </p>

          <p className="mt-6">
            <Link
              href={backHref}
              className="text-sm font-medium text-accent hover:underline"
            >
              ← Torna indietro
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
