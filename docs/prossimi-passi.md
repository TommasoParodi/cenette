# Cenette — Prossimi passi (dopo il database Supabase)

Database e RLS sono stati creati su Supabase come da `docs/architecture.md` e `docs/database-supabase.md`. Di seguito l’ordine consigliato per procedere.

---

## 1. Gruppi (priorità immediata)

- **Server actions** (in `src/server-actions/` o inline nelle route):
  - `createGroup(name, vote_mode)` → chiama RPC `rpc_create_group`
  - `joinGroup(invite_code)` → chiama RPC `rpc_join_group`
- **Dashboard**:
  - Elenco gruppi dell’utente (query su `group_members` + `groups`)
  - Form “Crea gruppo” (nome + modalità voto SIMPLE/DETAILED)
  - Form “Entra con codice invito”
- **Route gruppo**: `(protected)/group/[id]/page.tsx` (per ora solo placeholder o lista eventi vuota)

---

## 2. Eventi (entries)

- **Server actions**:
  - `createEntry(group_id, type, title, description, happened_at)` → insert in `entries`
  - (Futuro: update/delete solo per creatore)
- **Pagina gruppo** (`group/[id]`):
  - Lista eventi con filtri HOME/OUT e ordinamento
  - Pulsante “Nuovo evento”
  - Link a ogni evento
- **Pagina evento**: `(protected)/entry/[id]/page.tsx`
  - Dettaglio entry (titolo, data, descrizione, creatore)
  - Sezione foto (max 3) e, per HOME, “chi ha cucinato” (entry_cooks)
  - Lista recensioni

---

## 3. Foto eventi

- In Supabase: bucket **entry-photos** (privato), path `entries/<entry_id>/<file>`.
- RLS su `storage.objects` come da doc.
- Server action o Route Handler per upload: riceve file, verifica gruppo/creatore, salva in Storage e inserisce riga in `entry_photos` (rispettando max 3 con trigger DB).

---

## 4. Recensioni (reviews)

- **Server actions**:
  - `createReview(entry_id, rating_overall, comment, …)` → insert in `reviews`
  - `updateReview(review_id, …)` per autore
- In **pagina evento**: form “Scrivi la tua recensione” (se non esiste già), visualizzazione recensioni con voto/commento/foto.
- Bucket **review-photos**, path `reviews/<review_id>/<file>`, max 1 foto per review.

---

## 5. Refactor route (opzionale ma consigliato)

- Route group `(public)`: `login`, `landing` (o home).
- Route group `(protected)`: `dashboard`, `group/[id]`, `entry/[id]`.
- Layout `(protected)` che verifica auth e reindirizza a `/` se non loggato, così non si ripete la logica in ogni pagina.

---

## 6. Storage e profilo (fase successiva)

- Bucket **avatars**, path `users/<user_id>/avatar.jpg`.
- RLS come da `database-supabase.md`.
- UI modifica profilo (display_name, avatar).

---

## Ordine consigliato

1. Implementare **gruppi** (server actions + dashboard + pagina gruppo base).
2. Implementare **eventi** (creazione, lista nel gruppo, pagina dettaglio).
3. Aggiungere **foto eventi** e **recensioni** con relativi bucket.
4. Refactor route groups e layout protetto.
5. Profilo e avatar.

---

## Verifiche Supabase

Prima di codare, in Supabase controllare che esistano:

- Tabelle: `profiles`, `groups`, `group_members`, `entries`, `entry_photos`, `entry_cooks`, `reviews`.
- RPC: `rpc_create_group(name, vote_mode)`, `rpc_join_group(invite_code)`.
- Trigger: `handle_new_user` su `auth.users`, eventuale `set_updated_at` su `entries`/`reviews`.
- Bucket (quando servono): `entry-photos`, `review-photos`, `avatars` (tutti privati).

Se qualcosa manca, riferirsi a `docs/database-supabase.md` e allo schema SQL usato per la creazione del progetto.
