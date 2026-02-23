-- Aggiunge cached_display_name a entry_participants per mostrare il nome
-- dei partecipanti anche quando hanno lasciato il gruppo (RLS non restituisce più il profilo).
ALTER TABLE public.entry_participants
ADD COLUMN IF NOT EXISTS cached_display_name TEXT;
