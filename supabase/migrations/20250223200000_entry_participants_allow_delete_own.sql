-- Consente a un utente di eliminare le proprie righe in entry_participants.
-- Necessario per leaveGroup: quando l'utente esce dal gruppo deve essere rimosso
-- dalla lista partecipanti di tutti gli eventi del gruppo.
DROP POLICY IF EXISTS "entry_participants_delete_own" ON public.entry_participants;
CREATE POLICY "entry_participants_delete_own"
ON public.entry_participants
FOR DELETE
USING (user_id = auth.uid());
