-- Estende get_my_groups_members per restituire user_id e campi avatar (per mostrare avatar in dashboard).
-- Assicura che profiles.avatar_updated_at esista (se non hai ancora applicato la migrazione avatar).
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz;

-- DROP necessario perché non si può cambiare il tipo di ritorno di una funzione esistente.
DROP FUNCTION IF EXISTS public.get_my_groups_members();

CREATE OR REPLACE FUNCTION public.get_my_groups_members()
RETURNS TABLE(group_id uuid, user_id uuid, display_name text, avatar_url text, avatar_updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.group_id, gm.user_id, p.display_name, p.avatar_url, p.avatar_updated_at
  FROM public.group_members gm
  JOIN public.profiles p ON p.id = gm.user_id
  WHERE gm.group_id IN (
    SELECT g2.group_id FROM public.group_members g2 WHERE g2.user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_my_groups_members() TO authenticated;
