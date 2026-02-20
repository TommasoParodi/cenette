# Cenette — Stato attuale dell'applicazione (contesto per ChatGPT)

Usa questo documento per capire lo stato del progetto e rispondere a domande su come procedere. La specifica di prodotto completa è in `docs/cenette.md`. Precedente snapshot: `stato-applicazione-2025-02-19.md`.

---

## Cos'è Cenette

Web app **privata** per gruppi di amici che vogliono tenere traccia di cene insieme o locali visitati: eventi (cene a casa / uscite), foto, recensioni personali, voti. Non è una piattaforma pubblica tipo TripAdvisor; i dati sono per gruppo. In una fase successiva è prevista un'AI che suggerisce "cosa facciamo stasera?" in base allo storico.

---

## Tech stack attuale

| Categoria   | Tecnologia |
|------------|------------|
| Framework  | **Next.js 16** (App Router) |
| UI         | **React 19**, **TypeScript** |
| Styling    | **Tailwind CSS v4** |
| Backend/Auth/DB | **Supabase** (Auth + database + Storage) |
| Auth       | Supabase Auth: **Google OAuth** + **email/password** (login e registrazione) |

- Supabase lato client: `@supabase/ssr` + `@supabase/supabase-js`.
- Variabili d'ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e altre eventuali in `.env.local`).

---

## Struttura progetto (punti salienti)

```
src/
├── app/
│   ├── page.tsx                 # Home: se non loggato → AuthForm; se loggato → redirect /dashboard
│   ├── layout.tsx               # Root layout (Geist font, metadata)
│   ├── globals.css               # Tailwind + tema light/dark
│   ├── loading.tsx              # Loading UI root (spinner)
│   ├── AuthForm.tsx              # Client: login/registrazione email+password + "Accedi con Google"
│   ├── auth/
│   │   ├── callback/route.ts     # GET: scambio code → sessione, redirect /dashboard
│   │   └── logout/route.ts       # POST: signOut, redirect /
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard: profilo, lista gruppi, form crea/entra
│   │   ├── LogoutButton.tsx      # Form POST → /auth/logout
│   │   ├── CreateGroupForm.tsx   # Form + server action: crea gruppo (solo nome)
│   │   └── JoinGroupForm.tsx     # Form + server action: entra con invite_code
│   ├── group/
│   │   └── [id]/
│   │       ├── page.tsx          # Pagina gruppo: nome, codice, lista eventi
│   │       └── new/
│   │           └── page.tsx       # "Aggiungi evento" → EntryForm mode="create"
│   └── entry/
│       └── [id]/
│           ├── page.tsx          # Dettaglio evento: titolo, tipo, vote_mode, data, descrizione, foto, partecipanti, recensioni (con foto)
│           ├── loading.tsx       # Loading UI per pagina evento (spinner)
│           ├── review/
│           │   └── page.tsx      # Nuova/modifica recensione + ReviewForm (voto + commento + foto opzionale)
│           ├── edit/
│           │   └── page.tsx      # Modifica evento (solo creatore) → EntryForm mode="edit"
│           └── ReviewForm.tsx    # Form recensione (1–10, DETAILED: costo/servizio/cibo/location, foto max 1)
├── components/
│   └── EntryForm.tsx             # Form unificato create/edit: titolo, tipo, vote_mode, data, descrizione, partecipanti, foto (max 3)
├── lib/
│   ├── compress-photos.ts        # compressPhotoFiles() per anteprima/riduzione dimensioni lato client
│   └── supabase/
│       ├── client.ts             # createClient() browser
│       ├── server.ts             # createSupabaseServerClient() (cookies)
│       └── middleware.ts         # updateSession (refresh token)
├── server-actions/
│   ├── groups.ts                 # createGroup (RPC rpc_create_group), joinGroup (RPC rpc_join_group)
│   └── entries.ts                # createEntry, updateEntry, deleteEntryPhoto, uploadEntryPhotos, createOrUpdateReview
└── middleware.ts                 # Applica updateSession a ogni request
```

- **docs/cenette.md**: specifica funzionale (gruppi, eventi, review, regole, AI futura).
- **docs/database-supabase.md**: schema DB, RLS, bucket Storage.

---

## Cosa è implementato ora

1. **Autenticazione**
   - **Google OAuth**: login tramite Supabase, redirect `/auth/callback` → `/dashboard`.
   - **Email/password**: nella home, `AuthForm` offre tab "Accedi" e "Registrati" (email + password, requisiti password in registrazione). Dopo login/registro redirect a `/dashboard` o messaggio "Controlla email per conferma".
   - Logout: form POST a `/auth/logout` → `signOut` e redirect `/`.

2. **Protezione route**
   - Home: se c'è utente → redirect `/dashboard`.
   - Dashboard e pagine gruppo/evento: se non c'è utente → redirect `/`.
   - `/group/[id]`: visibile solo se utente è in `group_members`.
   - `/entry/[id]`: visibile solo se utente è membro del gruppo dell'evento.
   - Middleware: refresh sessione Supabase su ogni richiesta.

3. **Profilo utente**
   - Dashboard legge `profiles` (id, display_name, avatar_url) per `user.id`; in UI: `profile?.display_name ?? user.email` e Logout.

4. **Gruppi**
   - Lista gruppi da `group_members` + `groups` (id, name, invite_code); link a `/group/[id]`.
   - Crea gruppo: form nome → `createGroup` → RPC `rpc_create_group`.
   - Entra con codice: form invite_code → `joinGroup` → RPC `rpc_join_group`.
   - Pagina gruppo: nome, codice invito, lista eventi (titolo, tipo, data) con link a `/entry/[id]`, pulsante "Aggiungi evento" → `/group/[id]/new`.

5. **Eventi (entries)**
   - **Form unificato**: `EntryForm` in `src/components/EntryForm.tsx` con `mode: "create" | "edit"`. Usato in `/group/[id]/new` (create) e `/entry/[id]/edit` (edit). Campi: titolo, tipo HOME/OUT, vote_mode SIMPLE/DETAILED, data, descrizione, **partecipanti** (solo per eventi; in create l’utente corrente è incluso), **foto** (max 3).
   - **Creazione**: `createEntry` in `entries.ts` — insert in `entries`, insert in `entry_participants`, upload foto in bucket `entry-photos` (path `entries/<entry_id>/<file>`) e insert in `entry_photos`. Redirect a `/group/[groupId]`.
   - **Modifica**: `/entry/[id]/edit` (solo creatore). Carica entry, partecipanti, foto esistenti (signed URL da `entry-photos`). `EntryForm` mode="edit" invoca `updateEntry` e può usare `uploadEntryPhotos` (aggiunta foto senza salvare il resto) e `deleteEntryPhoto` (rimozione singola foto). Aggiornamento `entry_participants` (replace); le recensioni di chi viene rimosso dai partecipanti sono gestite da trigger DB se presente.
   - **Lettura**: `/entry/[id]` mostra titolo, tipo, data, vote_mode, descrizione, creatore, gruppo, **foto evento** (da `entry_photos` + signed URL), **partecipanti** (nomi da profiles), sezione recensioni con voto complessivo e, se DETAILED, voti costo/servizio/cibo/location; pulsanti "Aggiungi recensione" / "Modifica" recensione, "Modifica evento" (solo creatore). **Solo i partecipanti** all’evento possono scrivere una recensione (se non ci sono partecipanti, tutti i membri del gruppo possono).

6. **Foto eventi**
   - Bucket **entry-photos** (privato), path `entries/<entry_id>/<file>`. Max 3 foto per evento; formati ammessi JPEG, PNG, WebP, GIF; max 5 MB per file. Upload in create/update e tramite `uploadEntryPhotos` in modifica; rimozione con `deleteEntryPhoto` (solo creatore). Libreria `lib/compress-photos.ts` usata dal form per compressione/anteprima lato client.

7. **Recensioni (reviews)**
   - **Form**: `/entry/[id]/review` con `ReviewForm`. Voto 1–10, commento; se evento DETAILED anche Costo, Servizio, Cibo, Location (1–10). **Foto recensione** (max 1): upload in bucket `review-photos`, path `reviews/<review_id>/<file>`, campo `reviews.photo_path`; opzione "Rimuovi foto" in modifica. Server action `createOrUpdateReview` in `entries.ts`: upsert su `reviews`, upload/rimozione foto.
   - **Lettura**: in pagina evento le recensioni mostrano voto, voti dettagliati se DETAILED, commento e **foto** (signed URL da `review-photos`). Link "Aggiungi recensione" o "Modifica" per la propria.

8. **UI**
   - Home: card con AuthForm (Accedi/Registrati + Accedi con Google).
   - Dashboard: titolo "Cenette", saluto, lista gruppi, card Crea gruppo / Entra con codice, Logout.
   - Pagine gruppo ed evento: breadcrumb (Dashboard → gruppo → evento), card, stile coerente. Loading: `app/loading.tsx` e `app/entry/[id]/loading.tsx` (spinner). Stile: Tailwind, font Geist.

**Note**
- DB: tabelle `groups`, `group_members`, `entries`, `entry_photos`, `entry_participants`, `reviews`, `profiles`; RLS e RPC in Supabase. Migrazioni in `supabase/migrations/`. Schema in `docs/database-supabase.md`.
- Regola recensioni: solo chi è in `entry_participants` (o nessuno, allora tutti i membri del gruppo) può recensire.

---

## Cosa non è ancora implementato (dalla spec)

- **UI**: filtri casa/fuori e ordinamento eventi in pagina gruppo; rating medio per evento in lista/dettaglio.
- **Profilo**: modifica display_name e avatar (bucket avatars e UI).
- **AI**: suggerimenti contestuali (fase successiva).

---

## Regole di dominio (da rispettare)

- Solo i membri del gruppo vedono i dati del gruppo.
- Solo il creatore dell'evento può modificare descrizione e foto dell'evento.
- Solo l'autore può modificare la propria recensione.
- Max 3 foto per evento, max 1 foto per review.
- Solo i partecipanti all’evento possono scrivere una recensione (se l’evento ha partecipanti); altrimenti tutti i membri del gruppo.

---

## Come usare questo file con ChatGPT

- Condividi questo file (e, se serve, `docs/cenette.md` e `docs/database-supabase.md`) quando chiedi di implementare una feature, fix o refactor.
- Puoi chiedere: "Dato lo stato in stato-applicazione-2025-02-20.md, come implemento [X]?" oppure "Quale passo fare dopo?".

---

*Ultimo aggiornamento contesto: 20 febbraio 2025.*
