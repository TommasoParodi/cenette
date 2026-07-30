# Pubblicare Cenette su Vercel

Il progetto è collegato a GitHub: per pubblicare una nuova versione basta inviare le modifiche sul branch di produzione (normalmente `main`). Vercel eseguirà build e deploy automaticamente.

## Prima pubblicazione o collegamento del progetto

1. Vai su [Vercel](https://vercel.com/dashboard) e accedi con lo stesso account collegato a GitHub.
2. Se Cenette non è già presente, seleziona **Add New → Project** e importa il repository GitHub `cenette`.
3. Lascia le impostazioni rilevate automaticamente:
   - Framework: **Next.js**
   - Build command: `npm run build`
   - Output directory: predefinita
4. In **Environment Variables**, inserisci le variabili indicate sotto, selezionando almeno l'ambiente **Production**.
5. Seleziona **Deploy**.

## Variabili d'ambiente

In Vercel apri il progetto, quindi **Settings → Environment Variables**.

| Variabile | Dove trovarla | Ambienti |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Production, Preview se usato |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Production, Preview se usato |
| `CRON_SECRET` | Genera una stringa casuale lunga (almeno 16 caratteri) | Production |

`CRON_SECRET` protegge `/api/keep-alive`: non va inserito nel repository e non va prefissato con `NEXT_PUBLIC_`.

Le variabili server aggiuntive, se introdotte in futuro, vanno configurate nello stesso pannello senza il prefisso `NEXT_PUBLIC_`.

## Keep-alive Supabase

Il file `vercel.json` esegue una richiesta `GET /api/keep-alive` ogni giorno alle `08:00 UTC`.

Quando `CRON_SECRET` è impostato, Vercel invia automaticamente l'header di autorizzazione richiesto dalla route. Il cron viene eseguito soltanto nei deploy **Production**, non nei Preview.

Dopo un deploy Production, controlla **Settings → Cron Jobs**: deve comparire `/api/keep-alive`. Da lì, **View Logs** apre i log delle esecuzioni.

## Pubblicare un aggiornamento

Da PowerShell nella cartella del progetto:

```powershell
git status
git add README.md src/app/api/keep-alive/route.ts vercel.json docs/DEPLOY-VERCEL.md
git commit -m "Add Supabase keep-alive cron"
git push origin main
```

Se hai modifiche diverse, sostituisci l'elenco dopo `git add` con i file che vuoi pubblicare. Al push su `main`, apri il progetto su Vercel: nella scheda **Deployments** vedrai build e URL di produzione. Un deploy con stato **Ready** è online.

## Verifica dopo il deploy

1. Apri l'URL di produzione e prova login e pagine principali.
2. In **Deployments**, apri i log dell'ultimo deploy e verifica che la build sia conclusa.
3. In **Settings → Cron Jobs**, verifica il job `/api/keep-alive` e usa **View Logs** dopo la prima esecuzione.

Per chiamare manualmente l'endpoint durante un controllo locale:

```powershell
curl.exe -i -H "Authorization: Bearer IL_TUO_CRON_SECRET" http://localhost:3000/api/keep-alive
```

Non usare questa chiamata senza header: la route risponde correttamente con `401 Unauthorized`.

## Limiti del piano Hobby

Sul piano Hobby il cron può essere eseguito al massimo una volta al giorno; inoltre l'orario non è preciso al minuto e l'esecuzione può avvenire durante l'ora configurata. Il cron impostato in questo progetto rispetta il limite.
