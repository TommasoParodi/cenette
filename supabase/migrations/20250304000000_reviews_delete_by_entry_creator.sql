-- Consente al creatore dell'evento di eliminare TUTTE le recensioni dell'evento,
-- necessario quando cambia la modalità di voto (Semplice/Dettagliato).
-- La policy esistente permette solo di eliminare la propria recensione (user_id = auth.uid()).
-- Questa policy aggiuntiva permette al creatore dell'entry di eliminare qualsiasi recensione
-- del proprio evento (le policy DELETE si combinano con OR).
CREATE POLICY "reviews_delete_by_entry_creator"
ON public.reviews
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.entries e
    WHERE e.id = reviews.entry_id
    AND e.created_by = auth.uid()
  )
);
