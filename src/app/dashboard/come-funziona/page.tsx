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
          title="Come funziona"
        />
        <div className="px-4 py-6 space-y-10">
          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand flex justify-center">
              <CenetteLogo href="/dashboard" />
            </h2>
            <div className="mt-2 space-y-3 text-sm text-text-secondary">
              <p>
                Cenette è un modo semplice per organizzare cene, pranzi o colazioni con amici o familiari e ricordarsi le occasioni più belle.
              </p>
              <p>
                Con l&apos;app puoi creare gruppi con le persone con cui esci più spesso, organizzare facilmente nuovi pasti e lasciare una recensione con voti e commenti. In questo modo rimangono salvati i ricordi delle serate, i piatti migliori e le opinioni di tutti.
              </p>
              <p>
                L&apos;idea è molto semplice: un gruppo di amici, tanti momenti a tavola, e un posto dove tenerne traccia.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand">
              Gruppi
            </h2>
            <div className="mt-2 space-y-3 text-sm text-text-secondary">
              <p>
                I gruppi servono per riunire le persone con cui organizzi cene, pranzi o colazioni.
              </p>
              <p>
                Puoi creare un nuovo gruppo dalla dashboard e condividere con gli amici il codice invito generato dall&apos;app. Chi riceve il codice può inserirlo nella schermata &quot;Nuovo gruppo&quot; ed entrare subito.
              </p>
              <p>
                Una volta dentro, tutti i membri vedono il gruppo nella propria dashboard e possono aprirlo per vedere i pasti già fatti o organizzarne di nuovi.
              </p>
            </div>
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
              Eventi (cene, pranzi, colazioni)
            </h2>
            <div className="mt-2 space-y-3 text-sm text-text-secondary">
              <p>
                All&apos;interno di ogni gruppo puoi creare un nuovo evento: una cena, un pranzo o una colazione.
              </p>
              <p>
                Quando crei un evento inserisci: la data, il tipo (a casa oppure fuori) e una breve descrizione. Puoi anche scegliere quali membri del gruppo parteciperanno.
              </p>
              <p>
                Una volta creato, l&apos;evento appare nella lista del gruppo così tutti possono vedere i dettagli, aprirlo e consultare le informazioni.
              </p>
            </div>
            <div className="flex justify-center mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/illustrazione-2-nb.png"
                alt="Pasti in gruppo: persone attorno al tavolo"
                width={280}
                className="h-auto w-[280px] object-contain"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-brand">
              Recensioni
            </h2>
            <div className="mt-2 space-y-3 text-sm text-text-secondary">
              <p>
                Per ogni evento puoi lasciare una recensione con voti e commenti.
              </p>
              <p>
                Puoi scegliere tra: una recensione semplice, con solo il voto; oppure una recensione dettagliata, dove aggiungere anche note o commenti sull&apos;occasione.
              </p>
              <p>
                Le recensioni rimangono salvate nell&apos;evento, così in futuro puoi tornare a vedere com&apos;è andata quella serata e confrontarla con le altre.
              </p>
            </div>
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
