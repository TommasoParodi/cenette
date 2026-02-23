# Setup Cache Avatar - Guida Passo-Passo

## Cosa è stato fatto

Ho implementato un sistema di cache efficace per gli avatar degli utenti. Gli avatar ora usano URL pubblici con cache busting tramite timestamp, permettendo al browser di cachare le immagini finché non vengono modificate.

## Cosa devi fare

### 1. Applicare le Migrazioni Database

Devi applicare due nuove migrazioni al database:

#### Opzione A: Locale con Supabase CLI

```bash
# Se usi Supabase CLI in locale
supabase db reset
```

#### Opzione B: Produzione via Dashboard

1. Vai su **Supabase Dashboard** → **SQL Editor**
2. Apri e esegui in ordine:
   - `supabase/migrations/20250223100000_add_avatar_updated_at.sql`
   - `supabase/migrations/20250223110000_avatar_storage_policies.sql`

### 2. Configurare il Bucket Avatars come Pubblico

**IMPORTANTE**: Questo è necessario per far funzionare gli URL pubblici.

1. Vai su **Supabase Dashboard**
2. Menu laterale → **Storage**
3. Seleziona il bucket `avatars`
4. Clicca su **Configuration** (o icona ingranaggio)
5. Abilita l'opzione **Public bucket**
6. Salva le modifiche

![Screenshot configurazione bucket pubblico](https://supabase.com/docs/img/storage-make-bucket-public.png)

**Nota sulla sicurezza**: Anche se il bucket è pubblico, le RLS policies proteggono le operazioni:
- Solo tu puoi caricare/modificare/eliminare il tuo avatar
- Tutti possono leggere gli avatar (necessario per mostrarli)

### 3. Testare il Funzionamento

1. Avvia l'app in locale:
   ```bash
   npm run dev
   ```

2. Accedi all'app e vai al profilo

3. Carica un avatar

4. Verifica in **DevTools → Network**:
   - Cerca richieste alle immagini avatar
   - L'URL dovrebbe essere tipo:
     ```
     https://xxx.supabase.co/storage/v1/object/public/avatars/users/xxx/avatar.jpg?t=1708704000000
     ```
   - Prima richiesta: `Status 200` (download)
   - Richieste successive (ricarica pagina): `Status 304 Not Modified` o caricamento da cache

5. Modifica l'avatar:
   - Carica una nuova immagine
   - Verifica che l'avatar si aggiorni immediatamente
   - Il parametro `?t=...` dovrebbe avere un valore diverso

### 4. Deploy in Produzione

Una volta verificato che funziona in locale:

1. Esegui le migrazioni nel database di produzione (vedi punto 1)
2. Configura il bucket come pubblico in produzione (vedi punto 2)
3. Fai il deploy del codice:
   ```bash
   git add .
   git commit -m "feat: implement avatar caching with timestamp-based cache busting"
   git push
   ```

## Cosa Cambia per gli Utenti

### Prima
- Avatar ricaricato ogni volta (spreco banda)
- URL firmati temporanei che scadono dopo 1 ora
- Possibili errori se l'URL scade mentre l'utente naviga

### Dopo
- Avatar cachato efficacemente dal browser
- URL pubblici stabili con cache busting automatico
- Aggiornamento immediato quando l'utente cambia avatar
- Prestazioni migliori e UX più fluida

## File Modificati

- ✅ `src/lib/avatar.ts` - Nuova utility per generare URL pubblici
- ✅ `src/app/profile/page.tsx` - Usa URL pubblici
- ✅ `src/app/dashboard/page.tsx` - Usa URL pubblici  
- ✅ `src/app/profile/AvatarUpload.tsx` - Aggiunto `priority` flag
- ✅ `next.config.ts` - Configurato `remotePatterns` per Supabase
- ✅ `supabase/migrations/20250223100000_add_avatar_updated_at.sql` - Aggiunto timestamp
- ✅ `supabase/migrations/20250223110000_avatar_storage_policies.sql` - RLS policies

## Troubleshooting

### Gli avatar non si caricano

- Verifica che il bucket `avatars` sia configurato come **pubblico**
- Controlla nella console del browser se ci sono errori CORS
- Verifica che le migrazioni siano state applicate correttamente

### Gli avatar non si aggiornano quando li cambio

- Controlla che il trigger `update_avatar_timestamp()` sia attivo
- Verifica che il campo `avatar_updated_at` venga aggiornato nel database
- Cancella la cache del browser (`Ctrl+Shift+R` o `Cmd+Shift+R`)

### Errori "Not allowed to access bucket"

- Verifica che le RLS policies siano state create correttamente
- Controlla che l'utente sia autenticato

## Domande?

Consulta la documentazione completa in `docs/avatar-caching-setup.md`
