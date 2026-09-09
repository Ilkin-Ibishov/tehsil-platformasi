# Database Migrations & Permission Protocol

Before writing any SQL migration, read the TypeScript code that writes to or reads from the table.

## Mandatory Rules
- **Expand-Contract**: Additive first. Create new columns/tables with compatibility shims; deploy application code; drop old objects in a subsequent migration. Never rename or drop objects without a transition shim.
- **Row Level Security (RLS)**: Every new table MUST execute `alter table ... enable row level security;` with policies in the same migration.
- **Explicit `grant ... to app_runtime`**: Never rely on default PUBLIC privileges. Explicitly grant `SELECT, INSERT, UPDATE` on tables, `EXECUTE` on functions, and `USAGE, SELECT` on sequences to `app_runtime`.
- **Self-Healing Student Path**: Tables written during student sessions (`step_events`, `questions`, etc.) must not reject unknown codes. Unknown taxonomy entries are registered with `needs_review=true`.
- **Private Schema Answer Isolation (ADR-017)**: Correct answers and step data live in `private`. `app_runtime` has NO direct select on `private.*`.
- **Pre-Merge Application**: Migrations must be applied to Supabase before PRs/code reading them are merged to `main`.
