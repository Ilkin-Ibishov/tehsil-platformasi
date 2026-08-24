---
name: write-migration
description: >-
  Writes or reviews Supabase SQL migrations for Təhsil Platforması enforcing expand-contract patterns, explicit app_runtime grants, row-level security (RLS), and self-healing inserts. Use when adding, editing, or validating database schema and migrations.
---

# Write a Migration

## Pre-requisites

1. Read the TypeScript code that writes/reads the affected table (`web/lib/cascade/persist.ts`, API handlers, RPCs).
2. Confirm the object is on a live code path.
3. Determine the next migration file name: `NNNN_snake_case_name.sql` (after the highest existing migration).

## Migration Checklist (in the same SQL file)

- [ ] **Expand-Contract**: Additive first (create new column/table, preserve a compatibility shim). Never rename/drop objects in the same migration that adds them.
- [ ] **Row Level Security (RLS)**: Every new table MUST execute `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and include its policies.
- [ ] **Explicit `app_runtime` Grants**:
  - `GRANT SELECT, INSERT, UPDATE ON public.my_table TO app_runtime;`
  - `GRANT EXECUTE ON FUNCTION public.my_func TO app_runtime;`
  - `GRANT USAGE, SELECT ON SEQUENCE public.my_seq TO app_runtime;`
- [ ] **Answer Isolation**: Correct answers and steps live in `private` schema. `app_runtime` has NO direct select on `private.*`.
- [ ] **Self-Healing Student Path**: Do not place hard FK/CHECK constraints that 500 when LLM produces an unknown `topic_code` or `error_code`. Register with `needs_review=true`.

## Post-Migration Rule

Code that reads the new schema changes must not be merged to `main` before the migration has been successfully applied to the database.
