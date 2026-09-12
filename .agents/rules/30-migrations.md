# Database Migrations & Permission Protocol

Before writing any SQL migration, read the TypeScript code that writes to or reads from the table.

## Mandatory Rules
- **Expand-Contract**: Additive first. Create new columns/tables with compatibility shims; deploy application code; drop old objects in a subsequent migration. Never rename or drop objects without a transition shim.
- **Row Level Security (RLS)**: Every new table MUST execute `alter table ... enable row level security;` with policies in the same migration.
- **Explicit `grant ... to app_runtime`**: Never rely on default PUBLIC privileges. Explicitly grant `SELECT, INSERT, UPDATE` on tables, `EXECUTE` on functions, and `USAGE, SELECT` on sequences to `app_runtime`.
- **Self-Healing Student Path**: Tables written during student sessions (`step_events`, `questions`, etc.) must not reject unknown codes. Unknown taxonomy entries are registered with `needs_review=true`.
- **Private Schema Answer Isolation (ADR-017)**: Correct answers and step data live in `private`. `app_runtime` has NO direct select on `private.*`.
- **Pre-Merge Application**: Migrations must be applied to Supabase before PRs/code reading them are merged to `main`.

## Attempt vs Attempt_Items Schema & FK Invariants
- **Session vs Problem Granularity**: `public.attempts` is the session-level table (`id`, `student_ref`, `kind`, `started_at`). `public.attempt_items` is the problem-level table (`id`, `attempt_id`, `question_id`, `solution_id`, `match_path`, `cost_usd`).
- **`kind` Lives in `attempts`**: `kind` (`corpus_soak`, `photo_solve`, `bank_practice`) DOES NOT EXIST in `attempt_items`. Analytical or filtering queries must always `LEFT JOIN public.attempts att ON att.id = ai.attempt_id`.
- **`step_events.attempt_id` References `attempts(id)`**: Step events link to the overall session attempt, NOT to `attempt_items.id`. Always join on `ai.attempt_id = se.attempt_id` (or `att.id = se.attempt_id`).
- **`question_id` (not `problem_id`)**: Questions in `attempt_items` are referenced via `question_id`.
- **Cascade Bank Match**: `attempt_items.match_path` contains `'bank'` for Layer 2 question bank matches with zero LLM cost.
- **Dynamic Error Code Titles**: Always query official Azerbaijani titles via `LEFT JOIN public.error_codes ec ON ec.code = se.error_code`.
