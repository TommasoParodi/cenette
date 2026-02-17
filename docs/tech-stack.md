# Cenette — Technical Architecture

## Filosofia
Full-stack leggero in un solo progetto.
Backend complesso delegato a Supabase.
Next.js gestisce UI e logica server.

---

## Stack

### Frontend + Server
Next.js (App Router)
- React UI
- Server Components
- Route Handlers (API)
- rendering server-side
- PWA in futuro

### Database / Auth / Storage
Supabase
- Postgres database
- Row Level Security
- Google OAuth
- File storage immagini

### AI
LangChain + OpenRouter
- chiamate server side
- suggerimenti contestuali

### Hosting
Vercel
- deploy automatico da GitHub
- HTTPS
- CDN

---

## Architettura

Browser
↓
Next.js (server + client)
↓
Supabase (DB + Auth + Storage)
↓
OpenRouter (AI)

---

## Responsabilità

Next.js:
- pagine
- permessi applicativi
- logica business
- API AI
- join con codice

Supabase:
- autenticazione utenti
- persistenza dati
- sicurezza dati (RLS)
- immagini

---

## Sicurezza

Client può usare solo:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

Server usa:
SUPABASE_SERVICE_ROLE_KEY
OPENROUTER_API_KEY

Le chiavi server non arrivano mai al browser.

---

## Struttura progetto

src/app → routing
src/components → UI
src/lib → logica condivisa
src/app/api → endpoint server
docs → documentazione
supabase → schema SQL e policies

---

## Modello dati sintetico

users (auth)
groups
group_members
entries
entry_cooks
entry_photos
reviews
tags

---

## Permessi
Gestiti principalmente via Supabase RLS.

Principio:
utente può accedere solo ai dati dei gruppi di cui è membro.

---

## Deploy

GitHub push
→ Vercel build
→ app online

Zero server manuali.

---

## Scalabilità
Architettura adatta a:
10–200 utenti senza modifiche

Se cresce:
- caching
- edge functions
- eventuale backend separato

non necessari per MVP
