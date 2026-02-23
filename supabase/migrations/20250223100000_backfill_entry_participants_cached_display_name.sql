-- Backfill cached_display_name per le righe esistenti (partecipanti aggiunti prima del deploy).
-- Così gli ex-membri continuano a essere mostrati con il nome anche dopo aver lasciato il gruppo.
UPDATE public.entry_participants ep
SET cached_display_name = COALESCE(p.display_name, 'Utente')
FROM public.profiles p
WHERE p.id = ep.user_id
  AND (ep.cached_display_name IS NULL OR ep.cached_display_name = '');
