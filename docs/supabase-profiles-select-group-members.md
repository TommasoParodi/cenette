# Lettura profili dei membri del gruppo

## Problema

Nella pagina di un gruppo (`/group/[id]`) vengono mostrate le iniziali dei partecipanti agli eventi. I nomi vengono letti dalla tabella `profiles` (campo `display_name`).

Con l’RLS attuale su `profiles`:
- **SELECT**: solo il proprio profilo

Quindi un utente che entra in un gruppo **non** può leggere i profili degli altri membri: la query che chiede `id, display_name` per gli altri utenti non restituisce righe e in UI compaiono le iniziali "?".

## Soluzione

Aggiungere una **seconda policy** di SELECT su `profiles` che consenta di leggere il profilo (almeno `id`, `display_name`) degli utenti con cui condividi **almeno un gruppo**.

In questo modo:
- Ogni utente continua a poter leggere solo il proprio profilo per UPDATE e per tutti i campi.
- In più, ogni utente può **leggere** (solo SELECT) i profili degli altri membri dei gruppi a cui appartiene, così da mostrare nome/iniziali in lista eventi, partecipanti, dashboard, ecc.

## SQL da eseguire in Supabase

Apri **Supabase Dashboard → SQL Editor → New query**, incolla lo script qui sotto ed esegui.

```sql
-- Permette di leggere i profili (es. display_name) degli utenti con cui condividi almeno un gruppo.
-- Utile per mostrare iniziali/nomi in: pagina gruppo, lista eventi, partecipanti, dashboard.
CREATE POLICY "profiles_select_group_members"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR
  id IN (
    SELECT gm2.user_id
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
  )
);
```

Se Supabase ti segnala che esiste già una policy di SELECT su `profiles` che usa `id = auth.uid()` (solo proprio profilo), **non rimuoverla**: questa nuova policy si **aggiunge** alle esistenti. Con RLS, per la SELECT basta che **almeno una** policy permetta l’accesso alla riga.

## Verifica

Dopo aver applicato lo script:

1. Entra in un gruppo in cui ci sono altri membri.
2. Apri la pagina del gruppo: nelle card degli eventi dovrebbero comparire le iniziali degli altri partecipanti invece di "?".
3. Nella pagina di un singolo evento (`/entry/[id]`) dovrebbero comparire i nomi/iniziali dei partecipanti e degli autori delle recensioni.

## Riepilogo policy `profiles` (dopo la modifica)

- **SELECT**: proprio profilo **oppure** profilo di un utente che condivide almeno un gruppo con te (per mostrare nomi/iniziali in gruppo/eventi).
- **UPDATE**: solo il proprio profilo (invariato).
