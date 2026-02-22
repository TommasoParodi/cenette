# Colonna `created_by` e RLS per i gruppi

Per far funzionare "solo il creatore può eliminare il gruppo" e "Esci dal gruppo" per gli altri membri, in Supabase serve:

**Nota:** Con RLS attivo, UPDATE e DELETE su `groups` hanno effetto solo se esistono policy che li consentono. Senza policy per UPDATE/DELETE, il nome non si aggiorna e i gruppi non si cancellano (il DB può rispondere 204 ma 0 righe modificate). Vedi anche *RLS: regola importante* in [database-supabase.md](database-supabase.md).

## 1. Colonna `created_by` sulla tabella `groups`

La FK deve puntare a `auth.users(id)` (non a `profiles.id`) così la creazione gruppi funziona anche per utenti autenticati e si evita l’errore `groups_created_by_fkey` quando il profilo manca. Per la cancellazione utente e la sincronizzazione profilo/Auth vedi [supabase-profile-delete-cascade-auth.md](supabase-profile-delete-cascade-auth.md).

Se la colonna non esiste ancora:

```sql
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
```

Se esiste già con FK verso `profiles.id`, sostituirla con la migrazione descritta in supabase-profile-delete-cascade-auth.md (drop constraint, ADD verso auth.users ON DELETE SET NULL).

## 2. Impostare `created_by` quando si crea un gruppo

Nella funzione `rpc_create_group` (o equivalente), quando inserisci il gruppo imposta anche `created_by = auth.uid()`.

Esempio (da adattare alla tua `rpc_create_group`):

```sql
-- Esempio: nella tua rpc_create_group, quando fai INSERT in groups, aggiungi:
INSERT INTO public.groups (name, invite_code, created_by)
VALUES (p_name, ... , auth.uid());
```

## 3. RLS: solo il creatore può eliminare il gruppo

```sql
-- Rimuovi eventuali policy generiche di DELETE su groups, poi:

CREATE POLICY "Solo il creatore può eliminare il gruppo"
ON public.groups
FOR DELETE
TO authenticated
USING (created_by = auth.uid());
```

## 4. Quando il gruppo viene eliminato, tutti escono

Se `group_members` ha una foreign key verso `groups` con `ON DELETE CASCADE`, eliminando il gruppo le righe in `group_members` vengono eliminate automaticamente. Verifica in Supabase (Table Editor → group_members → Foreign Keys) che la FK su `group_id` abbia `ON DELETE CASCADE`. Se non c’è:

```sql
-- Esempio (adatta il nome del constraint se diverso):
ALTER TABLE public.group_members
DROP CONSTRAINT IF EXISTS group_members_group_id_fkey,
ADD CONSTRAINT group_members_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
```

## 5. Policy per UPDATE (modifica nome) e SELECT

I membri devono poter leggere e aggiornare il gruppo (almeno il nome); il creatore deve poter eliminare. Esempio:

```sql
-- Membri possono aggiornare (es. nome)
CREATE POLICY "Membri possono aggiornare gruppo"
ON public.groups FOR UPDATE TO authenticated
USING (id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
WITH CHECK (id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

-- Membri possono leggere
CREATE POLICY "Membri possono leggere gruppo"
ON public.groups FOR SELECT TO authenticated
USING (id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
```

Dopo aver applicato questi passaggi, l’app potrà:
- mostrare "Elimina gruppo" solo al creatore;
- mostrare "Esci dal gruppo" agli altri membri;
- far sì che, quando il creatore elimina il gruppo, tutti i partecipanti ne escano (grazie al CASCADE).
