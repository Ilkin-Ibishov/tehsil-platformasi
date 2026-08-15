---
name: write-migration
description: Writes or reviews Supabase SQL migrations for this app using expand-contract, explicit app_runtime grants, RLS in the same file, and self-healing student-path inserts. Use when adding, editing, or reviewing files under supabase/migrations/, or when a code change needs a new table, function, grant, or constraint.
---

# Write a migration

## Before SQL

1. Read the TypeScript that **writes** the table (`persist.ts`, route handlers, RPCs).
2. Confirm the object is on a live code path (lesson: `resolve_translation` exists and is unused).
3. Next filename: `NNNN_snake_name.sql` after the highest existing `NNNN`.

## Checklist (same file)

- [ ] Additive, or expand-contract (new object + shim now, drop later in a **follow-up** migration after code is on `main`)
- [ ] New table has `enable row level security` + policy
- [ ] Explicit `grant` to `app_runtime` (table CRUD, function EXECUTE, sequence USAGE)
- [ ] Student-path: no hard FK/CHECK that 500s unknown `topic_code` / `error_code`
- [ ] After any REVOKE, re-check the full `app_runtime` grant matrix — advisors will not catch a missing EXECUTE

## After SQL

Code that **reads** the new columns must not merge to `main` before this migration is applied. `main` push deploys.

Do not put a `TODO` in code and keep going. If you need a Cowork decision, HANDOFF `Blok:` and stop.
