# Nielsen's 10 usability heuristics, adapted to this app

Source: Jakob Nielsen / Nielsen Norman Group, "10 Usability Heuristics for User
Interface Design" (nngroup.com/articles/ten-usability-heuristics). These are the
industry-standard heuristic set — don't invent a different list. Each one below has a
concrete test to run against this app, plus a real example already found here so you
calibrate severity against a known precedent instead of guessing.

## 1. Visibility of system status

> The design should always keep users informed about what is going on, through
> appropriate feedback within a reasonable amount of time.

**Test:** for every async action (LLM solve, step check, bank load, transcription),
is there a visible state change within ~300ms of the tap, and does the loading state
say something more specific than a generic spinner where the wait is long (>2s)?

**Precedent in this app:** `LoadingView.tsx` already does this well — it has staged
copy that changes with elapsed time ("şəkil göndərilir" → "şəkil oxunur" → "addımlar
qurulur") specifically because a bare spinner during the measured 16.8s solve latency
was flagged as a problem in `ADR-001`. Use this as the bar: a new async screen with a
static "Yüklənir…" and nothing else is a regression from this precedent, not a neutral
baseline.

## 2. Match between the system and the real world

> The design should speak the users' language. Use words, phrases, and concepts
> familiar to the user, rather than internal jargon.

**Test:** is any internal identifier (enum value, DB code, taxonomy key) ever rendered
as user-facing text? Search rendered output for `ALL_CAPS_WITH_UNDERSCORES` or
`dot.separated.codes` patterns — those are almost never meant for students.

**Precedent (already fixed, calibrate severity against this one):** the bank topic list
used to show `ARITH.PERCENT_INCREASE` as the primary label; a wrong-answer screen showed
`PERCENT_TO_FRACTION` as if it were feedback. Both were rated 🟠 Serious, not 🔴 Critical,
because they didn't block the task — but they actively taught the wrong lesson (a
taxonomy code is not something a 10-year-old can act on). If you find a similar case,
check `public.topic_codes.title_az` / `public.error_codes.title_az` first — the
human-readable label may already exist in the DB and just isn't being read yet (see
`/api/steps/check/route.ts` and `/api/bank/questions/route.ts` for the pattern, and
note the `needs_review` gate — a title equal to its own code is not a real translation).

## 3. User control and freedom

> Users often perform actions by mistake. They need a clearly marked "emergency exit"
> to leave the unwanted action without having to go through an extended process.

**Test:** from every screen, is there a way back that doesn't require finishing the
current task? Specifically check: can the student retake/recrop without a new photo
(ADR-007's own invariant), abandon a step they don't understand, and reject a bad
transcription — and does each of those paths actually reset the right state (not just
visually, but in whatever gets persisted)?

**Known tension to watch for:** this heuristic can conflict with #5 (error prevention).
The "Növbəti addım" bug (see `known-state.md`) was exactly this collision handled
wrong — the escape hatch (skip a step you're stuck on) and the primary action (advance
after answering) were the *same* button with *no* distinguishing condition, so freedom
for the stuck student became a loophole for everyone. When you find an "escape hatch",
check whether it's a separate, explicitly-labeled control (good) or silently piggybacks
on the main action (suspect — verify it can't be used to skip the intended task).

## 4. Consistency and standards

> Users should not have to wonder whether different words, situations, or actions mean
> the same thing. Follow platform and industry conventions.

**Test:** does the screen use `docs/DESIGN-TOKENS.json` values (via the CSS custom
properties, `var(--acc)` etc.) or hardcoded colors/radii/spacing? A hardcoded value is
itself a finding even if it happens to look fine today — `ADR-002` exists because this
already happened once (same token at 3 different values across 9 design files). Also
check terminology: does "Cavabı göstər" always mean the same action across screens? Does
a green accent always mean "positive/confirm" and never "different but also styled
green for no reason"?

**Platform convention check (mobile-specific):** does a numeric-only answer field use
`inputMode="decimal"`/`"numeric"`, or does it fall back to the OS default full keyboard?
Does the layout respect `env(safe-area-inset-bottom)` near the viewport edge, or can
content sit flush against where a notch/home-indicator would be on a real device?

## 5. Error prevention

> Good error messages are important, but the best designs carefully prevent problems
> from occurring in the first place.

**Test:** for any destructive or one-way action (submitting a final answer, abandoning
a step, rejecting a transcription), is there a design choice that prevents the *wrong*
version of that action rather than just handling it gracefully after the fact? This is
a stronger bar than #9 below — #9 is about handling the error well, this is about the
error not being possible.

**Precedent:** the daily-limit exemption for bank practice (`kind='photo_solve'` filter
in the limit query) is error prevention applied to a *product* decision, not just UI —
it prevents the student from unknowingly burning their paid-LLM-call budget on free
practice. When reviewing a flow, ask whether a costly or irreversible action can happen
by accident, not just whether it's confirmed after the fact.

## 6. Recognition rather than recall

> Minimize the user's memory load by making elements, actions, and options visible.
> The user should not have to remember information from one part of the interface to
> another.

**Test:** does the transcription confirm screen keep the original photo/canonical text
visible while the student edits it, or does it ask them to remember what they
photographed? Does the step screen show the *current* problem's canonical text
somewhere reachable, or only at the very top of a long scroll? Does the bank's question
list give enough of the problem (`preview`, truncated at 90 chars per the schema) to
recognize which one to pick, or just an opaque ID?

## 7. Flexibility and efficiency of use

> Shortcuts — hidden from novice users — may speed up the interaction for the expert
> user so that the design can cater to both inexperienced and experienced users.

**Test:** for a student who's done this before (bank practice, repeat topic), is there
friction that a first-time user wouldn't mind but a repeat user would (e.g., re-reading
a long instructional block every time, no way to jump past a step they've already
mastered in a different problem)? Lower priority than the others for this app's current
stage — Phase 1's own gate cares about first-time completion more than power-user speed
— but worth noting as a 💭 if found, not silently dropped.

## 8. Aesthetic and minimalist design

> Interfaces should not contain information that is irrelevant or rarely needed. Every
> extra unit of information competes with relevant units of information.

**Test:** on any list/browse screen, count what's actually necessary for the decision
the student is making. A raw taxonomy code, a redundant label, or (the precedent below)
an undifferentiated wall of near-identical items are all violations of this heuristic,
not just "could be nicer".

**Precedent (already fixed):** the bank's per-topic question list had 46-55 items
rendered as "x²+Nx+M=0 tənliyinin kiçik kökünü tapın" with no ordering, count, or
grouping — every extra undifferentiated row diluted the ones that actually mattered for
the student's decision. Fixed with natural sort + count + pagination. If you find
another list like this, the fix pattern (sort by a meaningful key, show count, chunk
long lists) is the same one to reach for.

## 9. Help users recognize, diagnose, and recover from errors

> Error messages should be expressed in plain language (no error codes), precisely
> indicate the problem, and constructively suggest a solution.

**This is the heuristic most worth checking carefully in this app specifically** — the
product's entire differentiation claim (per `CLAUDE.md`: "rəqiblər cavab verir, biz
harada ilişdiyini deyirik") lives inside error-handling UX. A generic "wrong answer, try
again" with no diagnosis is a failure of the core product, not a cosmetic issue.

**Test:** when a student answers wrong, do they see (a) a specific, plain-language
explanation of *what kind* of mistake it was, not a code, and (b) something actionable,
not just "try again"? Check whether `distractor.message` (the specific, pre-authored
diagnostic for a recognized wrong-answer pattern, see `private.step_answers.distractors`)
is actually being shown, or whether the UI silently falls back to a generic step hint
even when a specific diagnosis was available — that gap was found and fixed once
already (see `known-state.md`); check it hasn't regressed and check whether it's
propagated everywhere `error_code` appears, not just the one screen already fixed.

## 10. Help and documentation

> It's best if the system doesn't need any additional explanation. However, it may be
> necessary to provide documentation to help users understand how to complete their
> tasks.

**Test:** for a first-time user with zero context (no onboarding exists yet per
`PHASE-1.md`'s explicit scope — "Onboarding, qeydiyyat" is out of scope for this phase),
is each screen self-explanatory from its own copy alone? The invite gate, the crop
screen's instruction line, the step screen's `check.ask` — do they carry enough context
that a student who opened the app cold understands what to do? Low priority to add
full documentation (explicitly deferred by `PHASE-1.md`), but flag any screen where the
*absence* of onboarding makes the screen itself actively confusing, not just minimal.
