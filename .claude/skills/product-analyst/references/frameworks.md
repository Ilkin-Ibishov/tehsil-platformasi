# Frameworks — and which ones actually fit this product's stage

Don't reach for every framework you know. This product is pre-launch, single-market
(Azerbaijan), single-subject (math), single-persona (the student; the parent is the
payer but Phase 1 explicitly excludes the parent-facing surface). Frameworks built for
scaled multi-sided growth analysis will produce noise here. Use judgment about fit
before applying one.

## HEART + GSM (Google, Rodden/Hutchinson/Fu 2010) — the primary lens

Five categories: **H**appiness, **E**ngagement, **A**doption, **R**etention, **T**ask
success. The companion **Goals → Signals → Metrics** model is what makes HEART
actionable instead of a checklist: for each category, state the *goal* in this
product's own terms, the *signal* (an observable event), and the *metric* (how it's
computed from that signal) — don't skip straight to a metric without naming the signal,
that's how you end up measuring something convenient instead of something meaningful.

Mapped to this app (verify against the live `docs/TELEMETRY.md` — this list may drift):

| HEART | Goal (this product's terms) | Signal (telemetry event) | Metric |
|---|---|---|---|
| Happiness | Student doesn't feel judged/stuck after a wrong answer | `solution.reported_wrong`, absence of `step.abandoned` spikes on a given `error_code` | reported-wrong rate; abandon rate by error_code |
| Engagement | Student works through steps rather than skipping to the answer | `step.answer_submitted` count per solve vs. `steps_total`; `step.token_tapped` | mean steps genuinely attempted / steps_total (this is the metric the now-fixed "Növbəti addım" bug would have silently zeroed out — see `ux-design-review`'s `known-state.md`) |
| Adoption | A new invite code converts to a first real solve | `invite_redeemed` → first `attempt_items.delivered=true` | time-to-first-solve; % of redeemed invites that ever solve |
| Retention | **This is the literal Phase 1 gate metric** | `attempts`/`attempt_items` by `device_id` over a 7-day window | ≥3 delivered solves in 7 days, % of cohort — `PHASE-1.md`'s own bar is ≥8/20 (40%) |
| Task success | The step-check/error-map actually reflects what the student did wrong | `step.error_recorded` vs. `distractor` match rate, `render.unformatted_latex`/`render.latex_missing` (quality-of-render signals) | % of wrong answers with a specific (non-generic) diagnosis shown |

If you're evaluating a NEW feature, do this table exercise for it specifically — most
features should slot into exactly one or two HEART rows; a feature that doesn't map to
any of them is either mis-scoped for this product or the mapping itself is the finding
worth surfacing.

## RICE and ICE — backlog prioritization

Use **RICE** (Reach × Impact × Confidence ÷ Effort) when you have at least rough
numbers for Reach (how many of the 15-20 pilot students would this touch) — at this
product's actual scale, Reach is often just "all of them" or "the subset who hit X",
which collapses RICE toward ICE anyway. Use **ICE** (Impact × Confidence × Ease, each
1-10, no separate reach term) when reach is uniform or genuinely unknowable pre-launch —
which, honestly, is most of this product's current backlog. Don't force RICE's extra
precision onto a 15-20-user pilot where the reach number would just be a guess dressed
as data; that's the same fabrication problem the SKILL.md warns about, one level down.

When scoring Confidence, ground it in what's actually known: a decision backed by a
measured finding (e.g. this session's fix to the "students can skip every step"
bug — directly threatens the Engagement/Task-success rows above) deserves high
confidence; a decision based on "seems like it would help" deserves low confidence
regardless of how good the idea sounds. Say which one you're scoring.

## Jobs-to-be-Done — for reframing feature requests, not for routine analysis

Useful specifically when a ClickUp backlog item is phrased as a solution ("add a badge
system") rather than a need — ask what job the student is hiring the app to do (this
product's own JTBD is stated directly in `CLAUDE.md`: students don't want an answer,
they want to know *where* they got stuck) and check whether the requested feature
actually serves that job or drifts toward a different one (e.g., a badge system serves
"feel rewarded", which is a different, and for this audience per
`ux-design-review/references/teen-edtech.md` a riskier, job than "understand my
mistake"). Don't run a full JTBD interview-style exercise for every question — this is
a lightweight reframing tool, reach for it when a request feels solution-first.

## What NOT to reach for at this stage

- **AARRR / pirate metrics** (Acquisition, Activation, Retention, Referral, Revenue) —
  built for products with a live acquisition channel and referral loop. This product's
  users arrive via a hand-issued invite code (`ADR-012`), not a funnel with meaningful
  Acquisition/Referral stages yet. Retention (the "R") is the one piece that's real and
  already covered above via HEART; don't manufacture Acquisition/Referral analysis from
  a 15-20-person hand-picked pilot, there's no signal there.
- **North Star Metric frameworks that assume a mature, single composite metric** — this
  product already has an explicit two-part gate (volume: 100+ solves; retention: ≥8/20
  return ≥3x/7days) stated in its own planning doc. Don't invent a different composite
  "North Star" on top of it; use the gate as given and, if you think it's the wrong
  gate, say so explicitly as a 💭 rather than silently substituting your own.
- **Full competitive-analysis frameworks** (feature matrices, Porter's five forces) —
  the differentiation claim is already stated in one sentence in `CLAUDE.md`
  ("rəqiblər cavab verir, biz harada ilişdiyini deyirik," naming Photomath/Gauth by
  name). The useful analytical question is narrower and more actionable: does the
  *shipped product* actually deliver on that one sentence, end to end — not a broad
  market-positioning exercise this pilot doesn't need yet.
