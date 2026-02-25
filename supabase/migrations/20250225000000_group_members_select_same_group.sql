-- RPC per la dashboard: restituisce tutti i membri dei gruppi dell'utente corrente (group_id, display_name).
-- SECURITY DEFINER = bypassa RLS, così in dashboard si vedono sempre le iniziali di tutti i partecipanti.
CREATE OR REPLACE FUNCTION public.get_my_groups_members()
RETURNS TABLE(group_id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.group_id, p.display_name
  FROM public.group_members gm
  JOIN public.profiles p ON p.id = gm.user_id
  WHERE gm.group_id IN (
    SELECT g2.group_id FROM public.group_members g2 WHERE g2.user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_my_groups_members() TO authenticated;

-- Policy SELECT su group_members: propria riga + tutte le righe dei gruppi di cui sei membro.
CREATE OR REPLACE FUNCTION public.current_user_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM public.group_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "group_members_select_same_group" ON public.group_members;
DROP POLICY IF EXISTS "group_members_select_own" ON public.group_members;
CREATE POLICY "group_members_select_own"
ON public.group_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "group_members_select_same_group"
ON public.group_members
FOR SELECT
USING (group_id IN (SELECT public.current_user_group_ids()));
