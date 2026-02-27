-- Policy per lettura pubblica delle foto eventi e recensioni (URL pubblici = cache browser).
-- I bucket entry-photos e review-photos devono essere configurati come pubblici nella dashboard Supabase,
-- come per il bucket avatars. Le policy di scrittura (INSERT/UPDATE/DELETE) vanno gestite separatamente
-- se non già presenti (upload/delete dall’app con utente autenticato).

DROP POLICY IF EXISTS "Entry photos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Review photos are publicly readable" ON storage.objects;

CREATE POLICY "Entry photos are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'entry-photos');

CREATE POLICY "Review photos are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-photos');
