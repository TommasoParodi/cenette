-- Consente ai membri del gruppo di aggiungere partecipanti agli eventi del gruppo.
-- Necessario per leaveGroup: quando si trasferisce un evento all'owner,
-- dobbiamo poterlo aggiungere come partecipante anche se non lo era prima.
DROP POLICY IF EXISTS "entry_participants_insert_group_members" ON public.entry_participants;
CREATE POLICY "entry_participants_insert_group_members"
ON public.entry_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.entries e
    JOIN public.group_members gm ON gm.group_id = e.group_id
    WHERE e.id = entry_participants.entry_id
      AND gm.user_id = auth.uid()
  )
);
