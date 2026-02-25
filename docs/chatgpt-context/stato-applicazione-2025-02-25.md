# Cenette — Stato attuale dell'applicazione (contesto per ChatGPT)

Usa questo documento per capire lo stato del progetto e rispondere a domande su come procedere. La specifica di prodotto completa è in `docs/cenette.md`. Precedente snapshot: `stato-applicazione-2025-02-20.md`.

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
| PWA        | **Serwist** (@serwist/next, serwist) — Service Worker, precache, fallback offline → `/offline` |

- Supabase lato client: `@supabase/ssr` + `@supabase/supabase-js`.
- Variabili d'ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e altre eventuali in `.env.local`).
- Versione app: `1.0.1` (package.json).

---

## Struttura progetto (punti salienti)

```
src/
├── app/
│   ├── page.tsx                 # Home: se non loggato → AuthForm; se loggato → redirect /dashboard
│   ├── layout.tsx               # Root layout (Geist font, metadata)
│   ├── globals.css              # Tailwind + tema light/dark
│   ├── loading.tsx              # Loading UI root (spinner)
│   ├── AuthForm.tsx             # Client: login/registrazione email+password + "Accedi con Google"
│   ├── sw.ts                    # Service Worker Serwist (precache, runtime cache, fallback /offline)
│   ├── auth/
│   │   ├── callback/route.ts     # GET: scambio code → sessione, redirect /dashboard
│   │   └── logout/route.ts      # POST: signOut, redirect /
│   ├── dashboard/
│   │   ├── page.tsx             # Dashboard: Topbar (logo + link profilo), lista gruppi (iniziali membri da RPC), CTA "Nuovo gruppo"
│   │   ├── loading.tsx          # Loading dashboard
│   │   ├── LogoutButton.tsx     # (se usato altrove)
│   │   ├── CreateGroupForm.tsx  # Form crea gruppo (usato in NewGroupSection)
│   │   ├── JoinGroupForm.tsx    # Form entra con invite_code (usato in NewGroupSection)
│   │   ├── NewGroupSection.tsx  # Card Crea gruppo + Entra con codice (usata in /dashboard/new)
│   │   ├── new/
│   │   │   ├── page.tsx         # Pagina "Nuovo gruppo" (Topbar + NewGroupSection)
│   │   │   └── loading.tsx
│   │   └── come-funziona/
│   │       └── page.tsx         # "Come funziona" (gruppi, eventi, recensioni) — Topbar con back
│   ├── profile/
│   │   ├── page.tsx             # Profilo: avatar, nome, form display_name, logout, versione app
│   │   ├── DisplayNameForm.tsx  # Form modifica display_name
│   │   ├── AvatarUpload.tsx    # Upload avatar (bucket avatars)
│   │   ├── RemoveAvatarButton.tsx
│   │   └── ProfileLogoutButton.tsx
│   ├── offline/
│   │   └── page.tsx             # Pagina "Sei offline" (client) + pulsante Riprova
│   ├── group/
│   │   ├── CopyableInviteCode.tsx
│   │   └── [id]/
│   │       ├── page.tsx         # Pagina gruppo: nome, codice, filtri (tutti/home/out), ordinamento (data/voto), lista eventi
│   │       ├── loading.tsx
│   │       ├── EventFilterTabs.tsx   # Tab filtri tipo evento
│   │       ├── EventSortTabs.tsx     # Tab ordinamento (date_asc/desc, vote_asc/desc)
│   │       ├── FilterAndListWrapper.tsx  # Wrapper filtri + sort + lista eventi (transition)
│   │       ├── GroupTopbarMenu.tsx   # Menu (modifica, esci, elimina gruppo)
│   │       ├── new/
│   │       │   └── page.tsx     # "Aggiungi evento" → EntryForm mode="create"
│   │       └── edit/
│   │           ├── page.tsx     # Modifica gruppo (nome) — solo membri
│   │           ├── EditGroupForm.tsx
│   │           └── EditGroupSection.tsx
│   └── entry/
│       └── [id]/
│           ├── page.tsx         # Dettaglio evento: titolo, tipo, vote_mode, data, descrizione, foto, partecipanti (cached_display_name), recensioni
│           ├── loading.tsx
│           ├── EntryImageCarousel.tsx
│           ├── EntryTopbarMenu.tsx
│           ├── EntryPageActions.tsx
│           ├── EntryReviewMenu.tsx
│           ├── ReviewComment.tsx
│           ├── ReviewPhotoLightbox.tsx
│           ├── review/
│           │   ├── page.tsx     # Nuova/modifica recensione
│           │   └── loading.tsx
│           ├── edit/
│           │   └── page.tsx     # Modifica evento (solo creatore) → EntryForm mode="edit"
│           └── ReviewForm.tsx
├── components/
│   ├── EntryForm.tsx            # Form unificato create/edit evento
│   ├── EntryFormPageLayout.tsx
│   ├── FormCard.tsx
│   ├── Topbar.tsx               # Barra superiore (titolo, showBack, right slot)
│   ├── CenetteLogo.tsx
│   ├── LoadingSpinner.tsx
│   ├── PageLoadingOverlay.tsx
│   ├── ConfirmDialog.tsx
│   ├── HelpIcon.tsx
│   ├── AdminIcon.tsx            # Icona "admin" per creatore gruppo
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── InputField.tsx
│   │   └── inputBaseStyles.ts
├── lib/
│   ├── compress-photos.ts       # compressPhotoFiles() per foto eventi/review
│   ├── avatar.ts                # getAvatarPublicUrl(), getUserAvatarUrl() — cache busting avatar
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts        # updateSession (refresh token)
├── server-actions/
│   ├── groups.ts                # createGroup, joinGroup, updateGroup, deleteGroup, leaveGroup
│   ├── entries.ts               # createEntry, updateEntry, deleteEntryPhoto, uploadEntryPhotos, createOrUpdateReview
│   └── profile.ts               # updateProfileDisplayName, uploadAvatar, removeAvatar
└── middleware.ts                # Applica updateSession a ogni request
```

- **docs/cenette.md**: specifica funzionale.
- **docs/database-supabase.md**: schema DB, RLS, bucket Storage.
- **docs/supabase-profiles-select-group-members.md**: policy SELECT su `profiles` per membri dello stesso gruppo.

---

## Cosa è implementato ora

1. **Autenticazione**
   - **Google OAuth**: login tramite Supabase, redirect `/auth/callback` → `/dashboard`.
   - **Email/password**: nella home, `AuthForm` offre tab "Accedi" e "Registrati". Dopo login/registro redirect a `/dashboard` o messaggio "Controlla email per conferma".
   - Logout: form POST a `/auth/logout` → `signOut` e redirect `/`.

2. **Protezione route**
   - Home: se c'è utente → redirect `/dashboard`.
   - Dashboard, profile, come-funziona, gruppo, evento: se non c'è utente → redirect `/`.
   - `/group/[id]`: visibile solo se utente è in `group_members`.
   - `/entry/[id]`: visibile solo se utente è membro del gruppo dell'evento.
   - Middleware: refresh sessione Supabase su ogni richiesta.

3. **Profilo utente**
   - **Dashboard**: legge `profiles` (id, display_name, avatar_url, avatar_updated_at); Topbar con CenetteLogo e link a `/profile` (avatar o iniziali); lista gruppi con iniziali membri da RPC `get_my_groups_members`; indicatore admin (AdminIcon) per gruppi creati dall'utente; CTA "Nuovo gruppo" → `/dashboard/new`; stato vuoto con link "Scopri come funziona" → `/dashboard/come-funziona`.
   - **Pagina Profilo** (`/profile`): Topbar "Profilo" con back a dashboard e HelpIcon → come-funziona; **Avatar**: upload (AvatarUpload → bucket `avatars`, path `users/<user_id>/avatar.jpg`), rimozione (RemoveAvatarButton); **Nome visualizzato**: form DisplayNameForm → `updateProfileDisplayName`; logout (ProfileLogoutButton); versione app da package.json. Cache busting avatar: `avatar_updated_at` in profiles e cookie `avatar_refresh`; `lib/avatar.ts` con `getAvatarPublicUrl(avatarPath, updatedAt)`.

4. **Gruppi**
   - Lista gruppi da `group_members` + `groups` (id, name, invite_code, created_by); iniziali membri da RPC `get_my_groups_members()` (SECURITY DEFINER, bypassa RLS). Link a `/group/[id]`.
   - **Crea gruppo**: `/dashboard/new` con NewGroupSection (CreateGroupForm + JoinGroupForm); `createGroup` → RPC `rpc_create_group`; `joinGroup` → RPC `rpc_join_group`.
   - **Pagina gruppo**: nome, CopyableInviteCode, GroupTopbarMenu (modifica, esci, elimina); **Filtri** (tutti / home / out) e **ordinamento** (date_asc, date_desc, vote_asc, vote_desc) via searchParams `?filter=&sort=`; FilterAndListWrapper + EventFilterTabs + EventSortTabs; lista eventi con prima foto, rating medio, partecipanti (iniziali). Pulsante "Aggiungi evento" → `/group/[id]/new`.
   - **Modifica gruppo**: `/group/[id]/edit` (solo membri); EditGroupForm (nome) → `updateGroup`.
   - **Uscita gruppo**: `leaveGroup` (il creatore non può uscire; se aveva creato eventi, ownership passa al primo altro membro).
   - **Eliminazione gruppo**: `deleteGroup` (solo creatore); prima rimozione foto da Storage (review-photos, entry-photos) poi delete gruppo (CASCADE su DB).
   - **RLS group_members**: policy `group_members_select_own` (proprie righe) e `group_members_select_same_group` (tutte le righe dei gruppi di cui sei membro, tramite funzione `current_user_group_ids()`). Migrazione `20250225000000_group_members_select_same_group.sql` definisce anche `get_my_groups_members()` e `current_user_group_ids()`.

5. **Eventi (entries)**
   - **Form unificato**: `EntryForm` con `mode: "create" | "edit"`. Campi: titolo, tipo HOME/OUT, vote_mode SIMPLE/DETAILED, data, descrizione, partecipanti (in create l’utente corrente incluso), foto max 3.
   - **Creazione**: `createEntry` — insert in `entries`, insert in `entry_participants` con `cached_display_name`, upload foto in bucket `entry-photos`, insert in `entry_photos`. Redirect a `/group/[groupId]`.
   - **Modifica**: `/entry/[id]/edit` (solo creatore). `updateEntry` aggiorna partecipanti per diff (non si cancellano più le recensioni); upload/delete foto con `uploadEntryPhotos` e `deleteEntryPhoto`.
   - **Lettura**: `/entry/[id]` mostra titolo, tipo, data, vote_mode, descrizione, creatore, gruppo, foto evento, **partecipanti** (nome da `entry_participants.cached_display_name` o da profiles per utenti stesso gruppo; così gli ex membri restano mostrati con il nome in cache). Recensioni con voto, dettagli DETAILED, commento, foto; pulsanti Aggiungi/Modifica recensione, Modifica evento (solo creatore).

6. **Partecipanti e “ex membro”**
   - Tabella `entry_participants` ha colonna **cached_display_name**. In creazione/modifica evento si aggiorna il nome in cache da `profiles.display_name`. In UI (gruppo, dettaglio evento, recensioni) si usa `cached_display_name` quando disponibile, altrimenti il nome dal profilo (se nello stesso gruppo). Utenti usciti dal gruppo restano visibili come nome salvato in cache (bug "utente (?)" risolto).

7. **Foto eventi**
   - Bucket **entry-photos** (privato), path `entries/<entry_id>/<file>`. Max 3 foto; JPEG, PNG, WebP, GIF; max 5 MB. Upload in create/update e con `uploadEntryPhotos`; rimozione con `deleteEntryPhoto`. `lib/compress-photos.ts` per compressione/anteprima lato client.

8. **Recensioni (reviews)**
   - Form in `/entry/[id]/review` con ReviewForm: voto 1–10, commento; se DETAILED anche Costo, Servizio, Cibo, Location. Foto recensione max 1 (bucket `review-photos`, path `reviews/<review_id>/<file>`). Server action `createOrUpdateReview`: upsert su `reviews`, upload/rimozione foto. In pagina evento: recensioni con voto, commento, foto (signed URL). Solo partecipanti all’evento possono recensire (o tutti i membri del gruppo se l’evento non ha partecipanti).

9. **Come funziona**
   - `/dashboard/come-funziona`: pagina con Topbar (back a dashboard), sezioni Gruppi, Eventi, Recensioni. Accessibile da dashboard (stato vuoto) e da profilo (HelpIcon).

10. **PWA e offline**
    - **Serwist**: Service Worker in `app/sw.ts` (precache da `__SW_MANIFEST`, runtime caching con `defaultCache`). Fallback per `request.destination === "document"` → `/offline`.
    - **Pagina offline** (`/offline`): client component con messaggio "Sei offline" e pulsante "Riprova" (reload).

11. **UI**
    - Topbar riutilizzabile (titolo, showBack, backHref, right). Dashboard con logo e avatar profilo; gruppi in card con conteggio eventi e iniziali membri. Pagine gruppo/evento con breadcrumb implicito (Topbar back). Loading: spinner in `app/loading.tsx`, `app/entry/[id]/loading.tsx`, FilterAndListWrapper in transizione. Stile: Tailwind, font Geist.

**Note DB**
- Tabelle: `groups`, `group_members`, `entries`, `entry_photos`, `entry_participants` (con `cached_display_name`), `reviews`, `profiles` (con `avatar_url`, `avatar_updated_at`). Bucket: `avatars`, `entry-photos`, `review-photos`.
- Migrazioni: `supabase/migrations/` (avatar_updated_at, avatar_storage_policies, cached_display_name e backfill, entry_participants policy insert/delete, group_members_select_same_group + get_my_groups_members + current_user_group_ids).
- Policy **profiles**: oltre alla SELECT sul proprio profilo, è documentata (e opzionalmente applicata) la policy `profiles_select_group_members` per leggere i profili degli utenti che condividono almeno un gruppo — v. `docs/supabase-profiles-select-group-members.md`. La dashboard usa comunque la RPC `get_my_groups_members` per le iniziali.

---

## Cosa non è ancora implementato (dalla spec / TODO)

- **Chatbot**: integrazione AI (LangChain, OpenRouter).
- **Navigazione e Back button**: sistemare navigazione e pulsante indietro.
- **Icona**: cambiare l’icona dell’app (in TODO).
- **Cache immagini**: mettere in cache le immagini (almeno avatar).
- **Rating medio in lista**: in gruppo è presente; eventuali altri punti da spec.

---

## Regole di dominio (da rispettare)

- Solo i membri del gruppo vedono i dati del gruppo.
- Solo il creatore dell'evento può modificare descrizione, partecipanti e foto dell'evento.
- Solo l'autore può modificare la propria recensione.
- Max 3 foto per evento, max 1 foto per review.
- Solo i partecipanti all’evento possono scrivere una recensione (se l’evento ha partecipanti); altrimenti tutti i membri del gruppo.
- Solo il creatore del gruppo può eliminarlo; il creatore non può uscire dal gruppo (deve eliminarlo).
- Modifica gruppo (nome): qualsiasi membro (in pratica spesso solo creatore in UI).

---

## Come usare questo file con ChatGPT

- Condividi questo file (e, se serve, `docs/cenette.md` e `docs/database-supabase.md`) quando chiedi di implementare una feature, fix o refactor.
- Puoi chiedere: "Dato lo stato in stato-applicazione-2025-02-25.md, come implemento [X]?" oppure "Quale passo fare dopo?".

---

*Ultimo aggiornamento contesto: 25 febbraio 2025.*
