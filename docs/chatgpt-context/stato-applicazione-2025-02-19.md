# Cenette — Stato attuale dell'applicazione (contesto per ChatGPT)

Usa questo documento per capire lo stato del progetto e rispondere a domande su come procedere. La specifica di prodotto completa è in `docs/cenette.md`.

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
| Backend/Auth/DB | **Supabase** (Auth + database) |
| Auth       | Supabase Auth con **Google OAuth** |

- Supabase lato client: `@supabase/ssr` + `@supabase/supabase-js`.
- Variabili d'ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e altre eventuali in `.env.local`).

---

## Struttura progetto (punti salienti)

```
src/
├── app/
│   ├── page.tsx                 # Home: login o redirect a dashboard
│   ├── layout.tsx               # Root layout (Geist font, metadata)
│   ├── globals.css              # Tailwind + tema light/dark
│   ├── LoginButton.tsx          # Client component: "Accedi con Google"
│   ├── auth/
│   │   ├── callback/route.ts    # GET: scambio code → sessione, redirect /dashboard
│   │   └── logout/route.ts      # POST: signOut, redirect /
│   ├── dashboard/
│   │   ├── page.tsx             # Dashboard: profilo, lista gruppi, form crea/entra
│   │   ├── LogoutButton.tsx     # Form POST → /auth/logout
│   │   ├── CreateGroupForm.tsx  # Form + server action: crea gruppo (solo nome)
│   │   └── JoinGroupForm.tsx    # Form + server action: entra con invite_code
│   ├── group/
│   │   └── [id]/
│   │       ├── page.tsx         # Pagina gruppo: nome, codice, lista eventi
│   │       └── new/
│   │           ├── page.tsx     # Pagina "Aggiungi evento"
│   │           └── CreateEntryForm.tsx  # Form: titolo, tipo, vote_mode, data, descrizione
│   └── entry/
│       └── [id]/
│           ├── page.tsx         # Pagina evento: titolo, tipo, vote_mode, data, descrizione, recensioni
│           ├── review/
│           │   └── page.tsx     # Pagina recensione (nuova/modifica) + ReviewForm
│           ├── edit/
│           │   ├── page.tsx     # Pagina modifica evento (solo creatore)
│           │   └── EditEntryForm.tsx
│           └── ReviewForm.tsx   # Form recensione (voto 1-10 + se DETAILED: costo, servizio, cibo, location)
├── lib/
│   └── supabase/
│       ├── client.ts            # createClient() browser
│       ├── server.ts            # createSupabaseServerClient() (cookies)
│       └── middleware.ts        # updateSession (refresh token)
├── server-actions/
│   ├── groups.ts                # createGroup (RPC rpc_create_group), joinGroup (RPC rpc_join_group)
│   └── entries.ts               # createEntry, updateEntry, createOrUpdateReview
└── middleware.ts                # Applica updateSession a ogni request
```

- **docs/cenette.md**: specifica funzionale (gruppi, eventi, review, regole, AI futura).

---

## Cosa è implementato ora

1. **Autenticazione**
   - Login con Google tramite Supabase OAuth.
   - Redirect dopo login: `/auth/callback` → `/dashboard`.
   - Logout: form POST a `/auth/logout` che chiama `signOut` e reindirizza a `/`.

2. **Protezione route**
   - Home: se c'è utente → redirect a `/dashboard`.
   - Dashboard e pagine gruppo/evento: se non c'è utente → redirect a `/`.
   - Pagina gruppo `/group/[id]`: visibile solo se l'utente è membro (`group_members`).
   - Pagina evento `/entry/[id]`: visibile solo se l'utente è membro del gruppo dell'evento.
   - Middleware: refresh della sessione Supabase su ogni richiesta.

3. **Profilo utente**
   - In dashboard si legge la tabella **`profiles`** con `id`, `display_name`, `avatar_url` (filtrata per `user.id`).
   - In UI si mostra `profile?.display_name ?? user.email` e un pulsante Logout.

4. **Gruppi**
   - **Lista gruppi**: in dashboard si leggono i gruppi da `group_members` con join su `groups` (id, name, invite_code). Link a `/group/[id]`.
   - **Crea gruppo**: form (solo nome) → `createGroup` → RPC `rpc_create_group`. Dopo il successo revalidata `/dashboard`.
   - **Entra con codice**: form (invite_code) → `joinGroup` → RPC `rpc_join_group`. Errore gestito per codice non valido.
   - **Pagina gruppo**: nome, codice invito, lista eventi (titolo, tipo, data) con link a `/entry/[id]`, pulsante "Aggiungi evento" → `/group/[id]/new`. Nessuna modalità voto a livello gruppo (è per singolo evento).

5. **Eventi (entries)**
   - **Creazione**: `/group/[id]/new` con `CreateEntryForm` (titolo, tipo HOME/OUT, **vote_mode** SIMPLE/DETAILED, data, descrizione). Server action `createEntry` in `entries.ts`.
   - **Modifica**: `/entry/[id]/edit` (solo creatore) con `EditEntryForm` (stessi campi incluso vote_mode). Server action `updateEntry`.
   - **Lettura**: `/entry/[id]` legge `entries` (titolo, tipo, vote_mode, data, descrizione, creatore, gruppo) e `reviews` (rating_overall, comment, e se DETAILED: rating_cost, rating_service, rating_food, rating_location). In intestazione si mostra "Voto semplice" o "Voto dettagliato".
   - **UI**: titolo, tipo, data, descrizione, sezione recensioni con voto complessivo e (se evento DETAILED) voti costo/servizio/cibo/location; pulsanti "Aggiungi recensione" / "Modifica" recensione, "Modifica evento" (solo creatore).

6. **Recensioni (reviews)**
   - **Form**: `/entry/[id]/review` con `ReviewForm`. Se l'evento ha **vote_mode DETAILED** il form include oltre al voto complessivo (1–10) e commento anche: Costo, Servizio, Cibo, Location (tutti 1–10). Server action `createOrUpdateReview` in `entries.ts` salva in `reviews` (rating_overall, comment, e se DETAILED i quattro campi dettagliati).
   - **Lettura**: in pagina evento si mostrano le recensioni (voto /10, eventuali voti dettagliati se DETAILED, commento). Link "Aggiungi recensione" o "Modifica" per la propria.

7. **UI**
   - Home: sfondo zinc-50/black (dark mode), bottone "Accedi con Google".
   - Dashboard: titolo "Cenette", saluto, lista gruppi, due card (Crea gruppo / Entra con codice), Logout.
   - Pagine gruppo ed evento: breadcrumb (Dashboard → gruppo → evento), stile coerente con card e bordi.
   - Stile: Tailwind, font Geist.

**Note**
- DB: tabelle `groups`, `group_members`, `entries`, `reviews`; RLS e RPC in Supabase. **Migrazioni** in `supabase/migrations/`: `vote_mode` è su **entries** (non su groups); RPC `rpc_create_group(name)` senza vote_mode. Schema dettagliato in `docs/database-supabase.md`.
- Tabella `profiles`: creazione/aggiornamento (es. trigger su `auth.users`) va verificata o creata in Supabase.

---

## Cosa non è ancora implementato (dalla spec)

- **Eventi (entries):** upload foto (max 3); partecipanti cuochi (solo HOME). Creazione e modifica evento (con vote_mode) sono implementate.
- **Review:** foto recensione (max 1). Form aggiungi/modifica recensione con voto semplice o dettagliato (costo, servizio, cibo, location) è implementato e legato a `entries.vote_mode`.
- **UI:** filtri casa/fuori, ordinamento eventi, rating medio per evento, foto in pagina evento e in recensioni.
- **AI:** suggerimenti contestuali (fase successiva, non prioritaria ora).

---

## Regole di dominio (da rispettare)

- Solo i membri del gruppo vedono i dati del gruppo.
- Solo il creatore dell'evento può modificare descrizione e foto dell'evento.
- Solo l'autore può modificare la propria recensione.
- Max 3 foto per evento, max 1 foto per review.

---

## Come usare questo file con ChatGPT

- Condividi questo file (e, se serve, `docs/cenette.md`) quando chiedi di implementare una feature, fix o refactor.
- Puoi chiedere esplicitamente: "Dato lo stato in stato-applicazione.md, come implemento [X]?" oppure "Quale passo fare dopo?".
- Per il database: le tabelle e le RPC sono in Supabase; per estendere lo schema o le policy RLS fai riferimento a `docs/cenette.md` e a questo stato.

---

*Ultimo aggiornamento contesto: 19 febbraio 2025.*
