-- Policies per lo storage degli avatar
-- Il bucket deve essere configurato come pubblico nella dashboard Supabase
-- ma le policies RLS proteggono le operazioni di scrittura/cancellazione

-- Rimuovi policies esistenti se presenti
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Policy per permettere agli utenti autenticati di caricare il proprio avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'users' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy per permettere agli utenti autenticati di aggiornare il proprio avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'users' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy per permettere agli utenti autenticati di eliminare il proprio avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'users' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy per rendere gli avatar pubblicamente leggibili
-- (richiede che il bucket sia configurato come pubblico)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
