# How to actually drive this app in this sandbox

Everything here was learned the hard way in a real audit session — each step exists
because the naive approach failed first. Follow it in order; don't improvise a shortcut
without reading why the naive version doesn't work.

## 0. Check what's already running before setting anything up

```bash
docker ps --format "{{.Names}} {{.Ports}}" | grep postgres
```

If `th-postgres-staging` is listed (port `5433→5432`), the seeded local database from
the last audit may still be alive — check row counts before reseeding from scratch:

```bash
docker exec th-postgres-staging psql -U postgres -d tehsil -c "select count(*) from questions;"
```

217+ rows means it's already seeded and you can skip straight to step 3 (starting the
dev server). If the container doesn't exist or the count is wrong, do steps 1-2.

## 1. Build a working local Postgres (only if step 0 came up empty)

The repo's `web/.env.example` default (`postgres://postgres:postgres@localhost:5432/
tehsil`) implies a local Docker Postgres exists for dev, but there is no committed setup
script — build it manually. Migrations are Supabase-authored and drift from a clean
Postgres in a few specific, already-diagnosed ways; don't waste time rediscovering them:

```bash
docker run -d --name th-postgres-staging -p 5433:5432 -e POSTGRES_PASSWORD=postgres postgres:16
docker exec th-postgres-staging psql -U postgres -c "CREATE DATABASE tehsil;"
docker exec th-postgres-staging psql -U postgres -d tehsil -c "create extension if not exists pgcrypto;"
docker exec th-postgres-staging psql -U postgres -d tehsil -c "
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END \$\$;"
```

Then replay every file in `supabase/migrations/*.sql` **in filename order**, with three
known patches applied inline (don't skip these, the plain replay fails without them):

1. `0018_create_private_answer_schema.sql` needs a psql variable the plain loop won't
   supply: run it with `-v app_runtime_pw="local_dev_only"` specifically. Every
   migration downstream of this one references the `private` schema it creates — if
   this one silently fails (missing variable → syntax error), everything after it fails
   with a confusing unrelated "schema private does not exist" error. If you see that
   error, this is almost always the real cause.
2. `0036_seed_generated_question_bank_v1.sql` references a `questions.source_template`
   column and a hardcoded `subjects.id` UUID (`39842f68-c929-4b2c-9cb2-a55f0dec2eec` for
   `math`) that exist on production but were never captured in a migration file — this
   is real, already-known schema drift, not something to "fix" in the migration itself.
   Before running it: `alter table questions add column if not exists source_template
   text;` and `update subjects set id='39842f68-c929-4b2c-9cb2-a55f0dec2eec' where
   code='math';`.
3. Two migrations named `app.store_generated_steps`/similar functions get created twice
   under different numbering (an artifact of two concurrent sessions once using
   overlapping migration numbers — see `docs/INVARIANTS.md` INV-10). If a `function ...
   already exists` error appears mid-replay, `drop function if exists <name>(<exact
   arg types from the error>);` and re-run that one file; this is a one-off DB-state
   fixup, not a code change.

```bash
for f in $(ls supabase/migrations/*.sql | sort); do
  base=$(basename "$f")
  if [ "$base" = "0018_create_private_answer_schema.sql" ]; then
    docker exec -i th-postgres-staging psql -U postgres -d tehsil -v ON_ERROR_STOP=1 -v app_runtime_pw="local_dev_only" < "$f"
  else
    docker exec -i th-postgres-staging psql -U postgres -d tehsil -v ON_ERROR_STOP=1 < "$f"
  fi
done
```

Run it once, note which files fail, apply the matching patch above, re-run just those
files. Expect ~53 files, 0 failures after the three patches.

Seed data lands as `review_status='draft'` (steps present, but not bank-visible) — the
bank UI and the fingerprint-matched cache path both filter on `review_status in
('auto_verified','verified')`. Promote it:

```bash
docker exec th-postgres-staging psql -U postgres -d tehsil -c "update questions set review_status='auto_verified' where source='generated' and deleted_at is null;"
docker exec th-postgres-staging psql -U postgres -d tehsil -c "update question_translations qt set verified=true, verification_method='template_authored' from questions q where q.id=qt.question_id and q.source='generated';"
```

## 2. `web/.env.local`

```
DATABASE_URL=postgres://app_runtime:local_dev_only@localhost:5433/tehsil
INVITE_CODES=test-01,test-02
GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=<real key if testing the actual LLM path, otherwise leave blank>
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
GEMINI_PRICE_INPUT_PER_1M=1.50
GEMINI_PRICE_OUTPUT_PER_1M=7.50
CASCADE_ENABLED=1
NEXT_PUBLIC_CASCADE_ENABLED=1
NEXT_PUBLIC_APP_VERSION=dev-audit
```

Set both `CASCADE_ENABLED` flags to `1` to reach the transcription-confirm/candidates
flow (still gated off in production pending `ADR-014`'s measurement gate) — leave them
unset if you specifically want to test the production-default monolith path instead.

If you edit `web/messages/az.json` (i18n strings) after the dev server is already
running, **restart the server** — new/changed keys don't show up via hot-reload, you'll
see the literal key path (`bank.questionCount`) rendered instead of the translated
string, which looks like a bug but is just a stale message-loader cache.

## 3. Start the dev server via the preview tool, not raw Bash

There's no `.claude/launch.json` in this repo by default — create one (or verify the
existing one still matches; environments get reset between sessions):

```json
{
  "version": "0.0.1",
  "configurations": [
    {"name": "web-dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev", "--prefix", "web"], "port": 3000, "autoPort": true}
  ]
}
```

Then use the preview/browser tool's start command (not `npm run dev` in a raw Bash
call) — it manages the process lifecycle and gives you log access and a controllable
browser tab. Port 3000 is often already taken by another worktree's server;
`autoPort: true` handles that, note the port it actually assigns.

## 4. The browser quirks — read before clicking anything

**Screenshots don't composite in this sandbox** (`computer{action:"screenshot"}` times
out with "Browser pane is not displayed"). Don't burn time retrying it. Use instead:
- `read_page` (accessibility tree) — best single source for structure/content/ARIA state
- `get_page_text` — quick full-page text dump
- `javascript_tool` — for anything `read_page` can't answer: computed styles, exact
  pixel rectangles, contrast math, `disabled`/`inputMode` attribute checks, network log
  inspection via `read_network_requests`

**`element.click()` silently no-ops on this app's React handlers.** This app (React 19)
needs a full pointer event sequence dispatched with real coordinates, not a bare
`.click()` call — a bare click updates nothing and gives no error, so a naive script
looks like it worked while doing nothing. Use this every time:

```js
function fireClick(el) {
  const r = el.getBoundingClientRect();
  const opts = {bubbles: true, cancelable: true, view: window, clientX: r.left + 10, clientY: r.top + 10};
  ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(t => el.dispatchEvent(new MouseEvent(t, opts)));
}
```

**Every `javascript_exec` call after a hard navigation loses all prior state** —
top-level `const`/`function` declarations from a previous call don't survive a
`navigate()` (new page load, fresh JS context) but DO survive client-side route changes
(clicking a Next.js `<Link>`/`router.push`). Wrap every script in an IIFE and
redefine `fireClick` at the top of each call after a hard navigation; don't assume a
helper you defined three calls ago still exists — check whether the last action was a
full navigation or an in-app route change.

**Set a mobile viewport before evaluating anything layout-related** — this is a
`max-width: 480px` mobile-first app; a desktop-width viewport hides real overflow and
touch-target problems. `resize_window({preset: "mobile"})` → 375×812. Re-check
`document.documentElement.scrollHeight` vs `window.innerHeight` after any layout change
— if they're exactly equal, there is zero margin below the fold, a real signal even
before you check what's actually at that boundary.

**Camera-gated screens (`getUserMedia`) cannot be driven here** — the sandbox blocks
camera access outright and the app correctly shows its "permission denied" state. Don't
try to work around this; read the component source for those screens instead (see
`project-context.md`'s screen inventory) and say explicitly that the finding is
code-review-only, not observed.

## 5. Verifying a fix, not just a symptom disappearing

When checking whether something is actually fixed (not just "looks different now"):
retrace the *exact* repro that found the bug, including edge cases discovered along the
way. Example from the last audit: fixing "raw error code shown to student" required
checking not just that a translated label appeared, but that the self-healing taxonomy
trigger (`docs/INVARIANTS.md` INV-02) hadn't produced a placeholder label identical to
the raw code for an un-curated error code — the first version of the fix passed a
shallow check ("a label is shown") while still failing the real requirement ("the label
means something to a student"). Query the database directly to confirm data-dependent
claims:

```bash
docker exec th-postgres-staging psql -U postgres -d tehsil -c "select code, title_az, needs_review from public.error_codes order by needs_review, code;"
```

## Cleanup discipline

Any row you insert directly via `docker exec ... psql` for a smoke test (a fake
`attempts`/`attempt_items` row, a test `image_hash_cache` entry) is real state in a
database other tooling reads — delete it when done, and verify the delete with a
follow-up `select count(*)`. Don't leave synthetic rows for "the next person" to trip
over, including your own next invocation of this skill.
