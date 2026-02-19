# Cenette — Application Architecture

## Overview

Cenette is a private social web app built with:

- Next.js (App Router)
- Supabase (Auth, Postgres, RLS, Storage)
- Tailwind CSS
- Server-side business logic
- Database-level security (RLS-first model)

Security is enforced at database level.
Frontend must never assume permissions.

---

# High-Level Architecture

Browser
↓
Next.js (Server Components + Server Actions)
↓
Supabase (Postgres + RLS + Storage)
↓
( Future ) AI Layer

---

# Design Principles

1. Security at DB level (RLS)
2. Thin frontend
3. Server-side mutations
4. Atomic business logic (RPC when needed)
5. Path-based storage permissions
6. No hidden business rules in UI

---

# Authentication Model

- Supabase Auth (Google OAuth)
- Session stored via cookies
- Middleware refreshes session
- `auth.uid()` used inside RLS

Frontend must:
- Use server-side Supabase client for mutations
- Avoid exposing service role key

---

# Supabase Client Usage

## Server Client (Preferred)

All writes must happen server-side.

Use:
- Server Actions
- Route Handlers
- RPC calls

Never:
- Perform privileged logic in client components

---

## Client Client (Limited Use)

Allowed:
- Simple SELECT queries
- Real-time subscriptions (future)

Not allowed:
- Complex mutations
- Business logic
- Multi-step inserts

---

# Data Access Pattern

## Simple CRUD

Use:
supabase.from("table").select/insert/update/delete

RLS decides permission.

---

## Multi-Step Logic

Use RPC functions.

Example:
- Create group (insert group + membership)
- Join group (lookup by invite_code + membership insert)

Never split atomic logic into multiple frontend calls.

---

# Storage Architecture

Buckets:
- entry-photos
- review-photos
- avatars

All buckets are private.

Path conventions:

Entry photo:
entries/<entry_id>/<file>

Review photo:
reviews/<review_id>/<file>

Avatar:
users/<user_id>/<file>

Storage access is controlled via RLS on storage.objects.
Agents must not change path structure.

---

# Folder Structure (Next.js)

src/
├── app/
│   ├── (public)/
│   ├── (protected)/
│   ├── api/
├── components/
├── lib/
│   ├── supabase/
│   ├── db/
│   ├── auth/
├── server-actions/
docs/

---

# Route Organization

Use route groups:

(public)
- login
- landing

(protected)
- dashboard
- group/[id]
- entry/[id]

Protected routes must:
- Require authenticated user
- Redirect if not logged in

---

# Business Logic Location

## Server Actions

Use for:
- createGroup
- joinGroup
- createEntry
- createReview
- upload metadata updates

Must:
- Use server Supabase client
- Throw errors clearly

---

## RPC Functions

Use for:
- Atomic multi-table operations
- Operations requiring elevated read (e.g. invite_code lookup)

Must:
- Be minimal
- Return clear data
- Not embed UI logic

---

# Error Handling Philosophy

- RLS errors are expected and valid
- Do not suppress database permission errors
- Surface clean messages in UI
- Log unexpected errors server-side

---

# Updating Data

All updates must:
- Respect creator rules
- Respect membership rules
- Never bypass RLS

Never:
- Use service_role key in user-facing requests

---

# Future Owner Role

Currently:
- All members equal

Future extension:
- Add role column to group_members
- Update RLS
- Do not change API surface unnecessarily

---

# Profile Evolution

Profiles currently:
- Created automatically via trigger

Future:
- Custom profile editing
- Avatar uploads
- Bio / username

Trigger should not overwrite manual edits.

---

# AI Layer (Future)

AI will:
- Read entries + reviews
- Generate suggestions

It will:
- Never bypass RLS
- Only use data user is allowed to access

---

# What Agents Must Not Modify

- RLS policies
- Helper SQL functions
- Storage path conventions
- RPC signatures

Any change here requires manual architectural review.

---

# Scalability Strategy

Current scale target:
10–200 users

If needed:
- Add indexes
- Add caching
- Add edge functions
- Split backend layer

No schema redesign required.

---

# Philosophy Summary

Cenette is:

- Private-first
- RLS-driven
- Server-centric
- Predictable
- Secure by default

Frontend is a UI layer.
Database is the authority.
