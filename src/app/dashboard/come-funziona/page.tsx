import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";
import { CenetteLogo } from "@/components/CenetteLogo";

export default async function ComeFunzionaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-2xl">
        <Topbar
          showBack
          backHref="/dashboard"
          backReplace
          title="Come funziona"
        />
        <div className="px-4 py-6 space-y-10">
          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand flex justify-center">
              <CenetteLogo href="/dashboard" />
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Cenette è l&apos;app per organizzare cene con amici e familiari: crea gruppi, proponi eventi e conserva le recensioni delle serate. Qui sotto trovi come funzionano gruppi, eventi e recensioni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand">
              Gruppi
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Dalla dashboard tocchi &quot;Nuovo gruppo&quot;, dai un nome al gruppo e l&apos;app ti assegna un codice invito. 
              Condividi quel codice (a messaggio o a voce) con chi vuoi invitare: entrano nella schermata &quot;Nuovo gruppo&quot;, 
              incollano il codice e si uniscono. Da quel momento vedono il gruppo nella loro dashboard e possono aprire 
              la pagina del gruppo per vedere e creare eventi.
            </p>
            <div className="flex justify-center mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/illustrazione-1-nb.png"
                alt="Pianificazione in gruppo: due persone al tavolo con calendario e lista"
                width={280}
                className="h-auto w-[280px] object-contain"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand">
              Eventi
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Entrando in un gruppo trovi la lista degli eventi. Per crearne uno tocchi &quot;Nuovo evento&quot;, inserisci 
              data, luogo e una breve descrizione; il creatore dell&apos;evento sceglie anche i partecipanti alla cena 
              tra i membri del gruppo. L&apos;evento compare nella lista e tutti i membri del gruppo lo vedono. 
              Il giorno della cena puoi aprire l&apos;evento per consultare i dettagli. Dopo che la serata è passata, 
              dalla stessa pagina (o dalla lista) puoi avviare la recensione.
            </p>
            <div className="flex justify-center mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/illustrazione-2-nb.png"
                alt="Cena in gruppo: persone attorno al tavolo"
                width={280}
                className="h-auto w-[280px] object-contain"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand">
              Recensioni
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Quando l&apos;evento è trascorso, dall&apos;evento compare l&apos;opzione per scrivere la recensione. Apri la schermata, 
              dai un voto e aggiungi note (piatto preferito, atmosfera, ecc.): si salva e resta legata a quell&apos;evento. 
              In seguito, riaprendo l&apos;evento dalla lista del gruppo, puoi tornare alla recensione per rileggerla o 
              modificarla.
            </p>
            <div className="flex justify-center mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/illustrazione-3-nb.png"
                alt="Recensione: dare un voto e aggiungere note"
                width={280}
                className="h-auto w-[280px] object-contain"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
