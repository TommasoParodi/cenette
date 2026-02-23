# Configurazione Cache Avatar

## Problema Risolto

Gli avatar degli utenti venivano caricati tramite URL firmati che cambiavano ad ogni rendering, impedendo al browser di cachare correttamente le immagini. Questo causava:
- Ricaricamento dell'avatar ogni volta
- Spreco di banda
- Esperienza utente non ottimale

## Soluzione Implementata

### 1. Cache Busting con Timestamp

Abbiamo aggiunto un campo `avatar_updated_at` alla tabella `profiles` che viene aggiornato automaticamente quando l'avatar cambia tramite un trigger SQL.

Gli URL degli avatar ora includono un timestamp come query parameter:
```
https://xxx.supabase.co/storage/v1/object/public/avatars/users/xxx/avatar.jpg?t=1708704000000
```

L'URL rimane stabile finché l'avatar non viene modificato, permettendo cache efficace.

### 2. URL Pubblici invece di Firmati

Gli avatar ora usano URL pubblici invece di URL firmati temporanei. Questo richiede che il bucket `avatars` sia configurato come pubblico in Supabase.

## Configurazione Supabase

### Rendere il Bucket Avatars Pubblico

1. Vai su **Supabase Dashboard** → **Storage**
2. Seleziona il bucket `avatars`
3. Clicca su **Configuration** o **Settings**
4. Abilita **Public bucket** (o "Make public")
5. Salva le modifiche

### RLS Policies

Anche se il bucket è pubblico, le RLS policies proteggono comunque le operazioni di scrittura/cancellazione:

```sql
-- Gli utenti possono caricare solo il proprio avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'users' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Gli utenti possono eliminare solo il proprio avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'users' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

## Migrazione Database

La migrazione `20250223100000_add_avatar_updated_at.sql` aggiunge:
- Campo `avatar_updated_at` alla tabella `profiles`
- Trigger che aggiorna automaticamente il timestamp quando `avatar_url` cambia
- Inizializzazione del timestamp per gli avatar esistenti

Per applicare la migrazione:

```bash
# In locale con Supabase CLI
supabase db reset

# In produzione
# Copia e incolla il contenuto della migrazione nell'editor SQL di Supabase
```

## Codice

### Helper Function

Il file `src/lib/avatar.ts` contiene la funzione `getAvatarPublicUrl()` che genera URL pubblici con cache busting:

```typescript
const avatarUrl = getAvatarPublicUrl(
  profile.avatar_url,
  profile.avatar_updated_at
);
```

### Next.js Image Configuration

Il file `next.config.ts` è stato aggiornato per permettere il caricamento di immagini da Supabase:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "*.supabase.co",
      pathname: "/storage/v1/object/**",
    },
  ],
}
```

## Vantaggi

1. **Cache Efficace**: Il browser caca l'immagine fino a quando non viene modificata
2. **Prestazioni**: Riduzione del traffico di rete e tempo di caricamento
3. **Affidabilità**: URL pubblici più stabili degli URL firmati temporanei
4. **Semplicità**: Meno chiamate a Supabase per generare URL firmati

## Testing

Per verificare che funzioni:

1. Carica un avatar nel profilo
2. Naviga tra dashboard e profilo più volte
3. Controlla in DevTools → Network:
   - La prima volta: `Status 200` con download dell'immagine
   - Le volte successive: `Status 304 Not Modified` o caricamento da cache
4. Modifica l'avatar
5. L'immagine dovrebbe aggiornarsi immediatamente perché il timestamp è cambiato
