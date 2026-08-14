# Product ground truth — read the actual docs, this is a map, not a substitute

## The gate — `docs/PHASE-1.md`

> **Qapı:** 15–20 şagird · 100+ real həll · 20 şagirddən **≥8-i 7 gündə ≥3 dəfə qayıdır**

Two independent conditions, both must hold: a volume floor (100+ delivered solves) and
a retention rate (40% of a 20-student cohort returning 3+ times within 7 days). Note
what counts as a "real solve": `attempt_items.delivered = true` — per `ADR-020`'s and
this session's own decision, bank-practice solves count toward this (they're real
solving, per the bank-UI ClickUp task's own justification) but are explicitly excluded
from the *daily LLM-cost limit* (a different, cost-control-only counter). If you're
computing gate progress from the database, filter on `delivered=true` regardless of
`kind`; if you're computing daily cost exposure, filter on `kind='photo_solve'` only —
conflating these two is an easy, real mistake (see `web/lib/cascade/guards.ts`'s
`checkDailyLimit` for the actual query the app itself uses).

`PHASE-1.md` also states the explicit non-goal: **"Faza 1-in çıxışı gözəl app deyil —
etibarlı data."** Any analysis that treats visual polish as the success criterion for
this phase is answering the wrong question — that's `ux-design-review`'s job, applied
to a later phase's priorities, not this phase's actual bar.

## The differentiation claim — `CLAUDE.md`

> Fərq: rəqiblər (Photomath, Gauth) **cavab** verir. Biz **harada ilişdiyini** deyirik.

And the product's own stated non-negotiable:

> Məhsulun bütün dəyəri `error_code` taksonomiyasına bağlıdır. Əgər bir dəyişiklik
> səhvin adlandırılmasını zəiflədirsə — o dəyişiklik səhvdir, nə qədər "təmiz kod" olsa
> da.

This is the single most important sentence to check any feature or fix against. The
"Növbəti addım" bug this session (a student could clear a problem with zero correct
answers) is the sharpest possible violation of this — not a UI inconvenience, a direct
hole in the thing the business is actually selling. When evaluating a proposed feature,
ask first whether it strengthens or dilutes the error-map's fidelity; UX smoothness is
a secondary concern relative to this one.

## Unit economics — the stated business risk

> Xərc — $0.0167/həll, abunə 200 həlldən sonra zərərdə.

Marginal cost per LLM-solved problem, and the break-even point stated directly by the
product owner. **This number is stale as of 2026-08-14 (`ADR-022`)** — it was computed at
$1.50/$7.50 per-1M-token pricing; Google's actual current price (verified directly against
their pricing page) is $0.75/$3.75 through 2026-12-31, so real current marginal cost is
roughly half (~$0.0084/solve), doubling back on 2027-01-01. **More importantly, the active
model is no longer fixed in code** — `ADR-023` moved model selection to
`public.app_config.active_model` (DB, changeable without a redeploy). Don't quote
"gemini-3.6-flash" as the current model without checking that table first; don't quote
$0.0167 as current cost without checking `attempt_items.cost_usd` for the actual active
model's real usage. Two mitigations already exist in the codebase — check their actual
effectiveness rather than assuming they work:
- **Bank cache** (`questions`/`question_translations`, `web/lib/cascade/bank.ts`) — a
  solve that matches an existing bank question costs $0 in LLM calls. `ADR-020`
  measured this session that only ~54% of the 224-question bank was actually
  *reachable* by the matching logic before a fix (a real, quantified cache-hit-rate
  problem, not a hypothetical one) — if asked about cost trajectory, this kind of
  "the cache exists but is it actually hit" question is exactly the right skepticism to
  apply to any caching claim in this codebase.
- **Image hash cache** (`private.image_hash_cache`, exact sha256 + perceptual hash
  fallback, `web/lib/phash.ts`) — catches repeat/near-duplicate photos of the *same*
  problem, a different case from the bank cache (which catches the *same problem
  content* regardless of photo). Both existing, neither a substitute for the other.

Latency is the second stated risk (16.8s measured average) — this is more
`ux-design-review`'s territory (it's about perceived wait, addressed via `LoadingView`'s
staged copy and the transcription-confirm screen) but worth naming here because it's
also a *cost* lever: the cascade architecture (`ADR-020`) exists specifically to avoid
paying for a full-solve LLM call when a cheap bank/cache hit would do, and to use a
smaller model for the OCR-only first pass. It's built but not live (`CASCADE_ENABLED`
off pending `ADR-014`'s measurement gate) — if asked about cost readiness, this is the
biggest lever that exists but isn't turned on yet, and the reason it isn't (an explicit,
pre-committed measurement gate, not neglect) is itself worth stating.

## Where things are tracked

- **ClickUp** — task status source of truth (`CLAUDE.md`'s file-ownership table). Space
  `901810230629`, folder `901815897469`. Lists: Faza 0·Eval (`901820224519`), Faza
  1·Şaquli dilim (`901820224521`), Backlog (`901820224524`), Bloklar və qərarlar
  (`901820224530`). Use the ClickUp MCP tools to check current status/priority rather
  than assuming the backlog snapshot from any one session's HANDOFF entry is current.
- **`docs/HANDOFF.md`** — append-only session log, newest first. The fastest way to
  check "has anyone already looked at this" before doing net-new analysis.
- **`docs/decisions/ADR-*.md`** — architecture decisions with stated reasoning,
  including several with explicit measurement gates not yet passed (`ADR-001`'s
  accuracy gate, `ADR-014`'s cascade-split gate, `ADR-020`'s downstream of both). A
  gate that hasn't been passed is a real, current constraint on what can be claimed
  about the product's readiness — don't describe a gated capability as shipped.
- **`docs/TELEMETRY.md`** — immutable event taxonomy (Cowork-owned). This is the
  vocabulary for the HEART/GSM table in `frameworks.md`; if a metric you want doesn't
  map to an existing event, that gap is itself a finding (see `SKILL.md`'s
  instrumentation-gap guidance), not something to route around by inventing a metric
  the app doesn't actually collect.
