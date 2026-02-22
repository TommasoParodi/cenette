# Cancellazione profilo e sincronizzazione con Auth

Quando elimini un utente dalla tabella `profiles`, l’utente in `auth.users` deve essere eliminato a sua volta. Altrimenti:
- l’utente può ancora accedere (è ancora in Auth);
- non ha profilo (riga in `profiles` cancellata);
- operazioni che usano `created_by = auth.uid()` con FK verso `profiles` falliscono (es. creazione gruppo: `groups_created_by_fkey`).

Questo documento descrive come:
1. **Far sì che, eliminando un profilo, venga eliminato anche l’utente in Auth** (trigger).
2. **Far funzionare la creazione gruppi** anche in presenza di FK su “chi ha creato”: usare `auth.users` per `groups.created_by` e gestire la cancellazione con `ON DELETE SET NULL`.

---

## 1. FK `groups.created_by` su `auth.users` (e fix errore creazione gruppo)

Se `groups.created_by` punta a `profiles.id`, un utente senza profilo (ma ancora in Auth) non può creare gruppi perché `auth.uid()` non è presente in `profiles`. Conviene far puntare `created_by` a `auth.users(id)` e gestire la cancellazione con `ON DELETE SET NULL`.

Esegui nel **SQL Editor** di Supabase (in ordine):

```sql
-- 1. Rimuovi la FK esistente (nome tipico; verifica in Table Editor → groups → Foreign Keys)
ALTER TABLE public.groups
DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- 2. Rendi nullable created_by (per quando in futuro l’utente creatore viene eliminato)
ALTER TABLE public.groups
ALTER COLUMN created_by DROP NOT NULL;

-- 3. Aggiungi la nuova FK verso auth.users con ON DELETE SET NULL
ALTER TABLE public.groups
ADD CONSTRAINT groups_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

Dopo questi passaggi, la creazione di un gruppo con `created_by = auth.uid()` non va in conflitto con l’assenza del profilo (l’id è comunque in `auth.users`). Se in seguito eliminerai l’utente da Auth, i gruppi da lui creati avranno `created_by = NULL` invece di violare la FK.

---

## 2. Trigger: eliminazione profilo → eliminazione utente in Auth

Per mantenere tutto allineato: **se qualcuno elimina una riga da `profiles`, eliminiamo anche la riga corrispondente in `auth.users`** (così non resta accesso senza profilo).

Esegui nel **SQL Editor**:

```sql
-- Funzione che elimina l’utente in Auth quando viene eliminato il profilo
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- Trigger: dopo DELETE su profiles, esegue la funzione
DROP TRIGGER IF EXISTS on_profiles_delete_delete_auth_user ON public.profiles;
CREATE TRIGGER on_profiles_delete_delete_auth_user
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();
```

**Nota:** La funzione usa `SECURITY DEFINER` per poter scrivere su `auth.users`. Se il progetto usa un ruolo diverso da `postgres` per le migrazioni, potrebbe essere necessario concedere a quel ruolo i permessi su `auth.users` (in ambiente Supabase gestito di solito non serve).

Comportamento risultante:
- Elimini una riga da `profiles` → il trigger elimina la riga corrispondente in `auth.users` → l’utente non può più accedere.
- Non avrai più utenti “solo in Auth” senza profilo (a meno che non si cancelli manualmente solo da Auth).

**Attenzione:** La `DELETE` su `profiles` può fallire se altre tabelle hanno FK verso `profiles.id` (es. `group_members.user_id`, `entries.created_by`, ecc.) senza `ON DELETE CASCADE`. In quel caso va prima gestita la presenza dell’utente in gruppi/eventi (es. farlo uscire dai gruppi) o vanno configurate le FK con CASCADE dove ha senso.

---

## 3. Situazione attuale: utente già senza profilo

Se hai già cancellato il profilo ma l’utente è ancora in `auth.users`:
- **Opzione A:** Elimina l’utente da **Authentication → Users** nella Dashboard Supabase (così non può più accedere e non tenterà di creare gruppi con quell’id).
- **Opzione B:** Dopo aver applicato la sezione 1, quell’utente potrà di nuovo creare gruppi (perché `created_by` punta a `auth.users`). In ogni caso, applicando la sezione 2, in futuro ogni eliminazione da `profiles` rimuoverà anche l’utente da Auth.

---

## Riepilogo

| Cosa | Azione |
|------|--------|
| Errore `groups_created_by_fkey` in creazione gruppo | FK `groups.created_by` su `auth.users(id)` con `ON DELETE SET NULL` (sezione 1). |
| Eliminare profilo deve eliminare anche l’accesso | Trigger `on_profiles_delete_delete_auth_user` (sezione 2). |
| Utente già senza profilo | Eliminarlo da Auth in Dashboard oppure, dopo la sezione 1, potrà di nuovo creare gruppi. |

Eseguire prima la **sezione 1**, poi la **sezione 2**.
