# Query per esportare l’intera struttura del DB da Supabase

Esegui queste query nel **SQL Editor** di Supabase (Dashboard → SQL Editor → New query). Copia il risultato di ciascuna (Export o Ctrl+C dalla griglia) e conservalo o condividilo per avere l’intera struttura del database.

---

## 1. Struttura tabelle (DDL)

Definizione di tutte le tabelle nello schema `public` (colonne e tipi).

```sql
SELECT
  'CREATE TABLE ' || c.relname || E' (\n' ||
  string_agg(
    '  ' || a.attname || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod) ||
    CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END,
    E',\n'
    ORDER BY a.attnum
  ) || E'\n);\n'
AS ddl
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attnum > 0
  AND NOT a.attisdropped
GROUP BY c.relname
ORDER BY c.relname;
```

---

## 2. Policy RLS (tutte le tabelle)

Nome, comando (SELECT/INSERT/UPDATE/DELETE) e espressioni USING / WITH CHECK per ogni policy sullo schema `public`.

```sql
SELECT
  tablename AS table_name,
  policyname AS policy_name,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 3. Foreign key e regole di delete

Constraint, tabella/colonna, tabella/colonna referenziata e `delete_rule` (CASCADE, SET NULL, ecc.) per tutte le FK nello schema `public`.

```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
```

---

## 4. Tipi ENUM (custom)

Elenco dei tipi enum definiti nello schema `public` (es. `entry_type`, `group_vote_mode`).

```sql
SELECT
  t.typname AS enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
```

---

## 5. Funzioni (definizione)

Corpo delle funzioni nello schema `public` (utile per `is_group_member`, `rpc_create_group`, ecc.).

```sql
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
```

---

## 6. Primary key e unique

Constraint di primary key e unique sullo schema `public`.

```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name;
```

---

## Come usare questo file

1. Apri Supabase → **SQL Editor**.
2. Per ogni sezione sopra: copia la query, incollala in una nuova query, esegui (Run).
3. Esporta il risultato (Download CSV / Copy) o copialo dalla griglia.
4. Conserva i risultati (es. in file `.json` o `.csv`) o incollali in un documento per condividerli e avere l’intera struttura del DB (tabelle, RLS, FK, enum, funzioni, chiavi).
