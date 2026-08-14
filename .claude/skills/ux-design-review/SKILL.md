---
name: ux-design-review
description: >
  Rigorous, evidence-based UX/UI audit of the Təhsil Platforması web app (Next.js,
  mobile-first, Azerbaijani math tutor for grade 5-11 students). Runs a real browser
  against a real seeded database, click-throughs actual flows, and measures DOM state
  (contrast ratios, touch-target sizes, viewport overflow, inputMode, disabled state)
  rather than eyeballing screenshots. Grounded in Nielsen's 10 usability heuristics and
  teen-EdTech-specific design research, both adapted to this app's own screens and
  vocabulary. Use this skill whenever the user asks to review, audit, test, critique, or
  find problems with the app's UI, UX, design, screens, or user flow — including vague
  asks like "test the app", "what's wrong with this screen", "does this feel right for
  kids", or "go explore the product" — even if they don't say "UX" explicitly. Also use
  it before/after any UI change to check for regressions, and proactively when a new
  screen or flow is added. Do NOT use this for backend/API correctness, security, or
  business-metric analysis — see the product-analyst skill for that.
---

# UX Design Review — Təhsil Platforması

## Why this skill exists

A previous session did a manual audit of this app and found 7 real, shipped bugs —
including one that silently defeated the product's entire value proposition (students
could skip every step without answering, so `error_code` — the data the whole business
model depends on, per `CLAUDE.md`'s "Qızıl qayda" — was never recorded). That audit
worked because it **measured** rather than **guessed**: DOM rectangles, computed styles,
actual click sequences, actual server logs. This skill exists to make that rigor
repeatable and to push it further — the first pass found the loudest problems; there
are quieter ones left (see `references/known-state.md` for what's already covered).

**Read `references/known-state.md` first.** It lists what's already fixed, what's
already an acknowledged/deferred product decision (don't re-report these as new bugs),
and what hasn't been looked at yet. An audit that re-discovers the same 7 things is
wasted effort; the value is in going to the parts nobody has checked yet.

## The three lenses, in order

1. **Usability heuristics** (`references/heuristics.md`) — Nielsen's 10, each with a
   concrete pass/fail test and an example already found in THIS app, so you calibrate
   against a known-good precedent instead of applying the heuristics abstractly.
2. **Audience fit** (`references/teen-edtech.md`) — this is not a toddler app and not a
   general consumer app. Users are 10-17 year olds doing real homework, alone, often
   under time pressure, on a phone, in Azerbaijani. Generic "kids app" advice (mascots,
   daycare-style rewards) is usually WRONG for this age group — read this before
   assuming gamification patterns apply.
3. **Project consistency** (`references/project-context.md`) — does the screen actually
   use `docs/DESIGN-TOKENS.json`, match the approved mockups in `design/*.dc.html`, and
   follow the telemetry contract in `docs/TELEMETRY.md`? Inconsistency here is itself a
   UX bug (users learn patterns; breaking them costs trust) even when nothing is
   "wrong" in isolation.

Apply all three to whatever you're reviewing — a single screen, a full flow, or the
whole app. Don't skip a lens because the task sounds narrow; a "review the crop screen"
ask still benefits from checking token consistency and audience fit, not just heuristics.

## How to actually test this (not guess about it)

**Read `references/testing-methodology.md` before touching the browser.** It documents
the exact working setup for THIS sandbox — a screenshot tool that doesn't work here, a
`.click()` call that silently no-ops on this app's React event handlers, a local
Postgres that needs 53 migrations replayed in a specific order with three manual patches
to reach a working state, and the exact commands that get you from zero to a seeded,
clickable app. Skipping this reference and improvising will cost significant time
rediscovering things already solved once. If the environment is already running (dev
server + local DB), the reference tells you how to check that before starting from
scratch.

**Camera-gated screens** (kamera capture, crop, transcription confirm, candidates) can't
be driven end-to-end in this sandbox — `getUserMedia` is blocked. For those, read the
component source directly (`web/components/kamera/`, `web/components/hell/
TranscriptConfirmView.tsx`) and reason about the code path instead of clicking through
it; say explicitly in your findings which screens were live-tested vs. code-reviewed —
never claim to have observed behavior you only inferred.

**Evidence, not impressions.** Every finding needs one of: a DOM measurement (rectangle,
computed style, contrast ratio), an exact repro (click sequence + before/after state), a
source line reference, or a quote from the actual rendered text. "Feels cluttered" is not
a finding; "43 buttons rendered in one screen, no grouping, 3.5 viewport-heights of
scroll before the fold" is. If you can't get evidence for something (e.g., a
camera-gated screen), say so and mark it as code-review-only, don't blur the line.

## Report structure

Findings ranked most-severe-first. For each:

```
### [severity] short title

**What**: one sentence, the defect itself.
**Where**: file:line or screen name + state.
**Evidence**: the measurement/repro/quote that proves it — not an opinion.
**Why it matters**: which heuristic/audience-fit/consistency lens it violates, and the
  concrete user consequence (not just "this violates heuristic #4").
**Fix**: a specific, scoped suggestion — not "improve the UX here".
```

Severity bands:
- 🔴 **Critical** — breaks the product's core value proposition, or a student can get
  stuck/blocked/lose data with no recovery path.
- 🟠 **Serious** — actively confusing or exclusionary for the actual audience (wrong
  reading level, jargon, unreachable content, real accessibility failure).
- 🟡 **Minor** — real but low-consequence: cosmetic inconsistency, a rough edge that
  doesn't block anyone.
- 💭 **Note** — not a bug, a design question or missing decision worth surfacing (e.g.
  "the `genc` tone variant exists in tokens but is never applied — intentional?").

End with a one-paragraph summary of what was and wasn't covered (which screens were
live-tested, which were code-reviewed only, which weren't touched at all) so the user
knows the boundary of the audit — never imply full coverage you didn't actually do.

## After finding something

If asked to also fix what you find, apply the same discipline used in the prior
session: verify each fix by re-running the exact repro that found the bug (not just
"looks right now"), run `tsc`/`eslint`/existing selftests, and update
`references/known-state.md` with what changed so the next audit doesn't waste time on it.
