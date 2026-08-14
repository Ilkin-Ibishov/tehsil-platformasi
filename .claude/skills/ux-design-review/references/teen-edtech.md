# Audience fit — this is a teen homework tool, not a toddler app

The actual audience is Azerbaijani students in grades 5-11 (roughly ages 10-17),
photographing real printed exam-prep material and working through it **alone**, often
under real time/grade pressure. Most generic "UX for kids" research online (bright
primary colors, mascots, star/badge rewards, 2-5 minute activity caps) is written for
daycare and early-elementary apps (ages 2-7) and does not transfer cleanly to this
audience — a 16-year-old preparing for a real exam will read a cutesy reward pop-up as
condescending, not motivating. Apply judgment about which research actually fits a
teenager doing serious schoolwork versus which fits a toddler learning shapes, and say
which one you're drawing on when you cite it.

## What does transfer from the research

- **One clear task per screen, minimal choice at each step.** This holds at every age —
  it's really a restatement of heuristic #8 (aesthetic and minimalist design), not
  something specific to kids. Still worth checking explicitly: does a screen ask the
  student to hold more than one decision in mind at once?
- **Short, plain-language instructions over long paragraphs.** Azerbaijani school
  register, not academic/bureaucratic register. Check `check.ask` text, `hint` text,
  and refusal/error copy for sentence length and vocabulary — a 12-year-old in grade 6
  and a 17-year-old in grade 11 share this app, so aim for the younger end of that
  range when it doesn't cost precision.
- **Real-time feedback and visible progress** (HEART's "engagement" pillar, see the
  product-analyst skill) — this app already does per-step checking rather than
  end-of-quiz grading, which is the right instinct for this age group; don't recommend
  batching feedback.
- **Streak/return mechanics tied to genuine value, not manufactured urgency.** The
  product's own gate metric (`docs/PHASE-1.md`: "20 şagirddən ≥8-i 7 gündə ≥3 dəfə
  qayıdır") is a retention signal, not a vanity streak counter — if you're evaluating
  anything retention-related, check whether it's designed to *earn* the return (real
  progress, real error-map value visible to the student) rather than nag/guilt-trip
  patterns (aggressive push notifications, loss-framed streak-break warnings). The
  latter erodes trust with this age group faster than with younger children, who are
  less likely to notice or resent the manipulation.

## What does NOT transfer — be skeptical of these if you're tempted to recommend them

- **Mascots, cartoon characters, "Well done!" pop-ups with confetti.** Reads as
  babyish to the grade 9-11 end of the audience. If gamification is warranted anywhere,
  it should look like Duolingo's restrained streak/XP treatment, not a daycare app's
  sticker chart — and even that should be evaluated against whether it fits this
  product's own tone (`DESIGN-TOKENS.json`'s `tone.yetkin` — "mature" — is the
  currently-applied variant for the whole app, see `project-context.md`).
- **Touch targets sized for undeveloped fine motor control.** 44px minimum (this app's
  own `layout.minTapTarget` token) is the right bar for a teenager, same as an adult —
  don't recommend oversizing targets further; that wastes screen space the student
  doesn't need back.
- **Heavy sensory customization controls (mute all sound, reduce all animation as a
  first-class settings screen).** Worth having `prefers-reduced-motion` support (this
  app already respects it per `DESIGN-TOKENS.json`'s `motion._note`), but a dedicated
  settings UI for this is over-engineering for the actual audience and out of Phase 1's
  scope regardless (`PHASE-1.md` excludes anything beyond the core solve flow).
- **Capping session/activity length to 2-5 minutes.** This app's own latency (16.8s per
  solve, multi-step problems) and its actual use case (real homework, not a quick game)
  make this irrelevant — don't flag a longer flow as a problem just because "kids apps
  should be short."

## Where this audience genuinely needs different treatment than an adult product

- **Reading level and vocabulary**, covered above — check it, don't assume it's fine.
- **Error tolerance and shame-avoidance.** A wrong answer should never read as a
  judgment of the student — check tone, not just correctness, of wrong-answer copy. This
  overlaps heavily with heuristic #9; the distinguishing question here is *tone*, not
  *content*: "COEFFICIENT_READ" fails #9 (not plain language), but "Səhv! Səhv! Yenidən
  cəhd et!" would pass #9 (plain language, precise) while still failing this — harsh
  tone toward a mistake, for an audience still building math confidence, is its own
  finding even when the words are technically clear.
- **Trust and data handling around captured photos.** These are photos of a minor's
  homework, taken and processed by a third-party (Gemini) vision API. Check whether the
  UI communicates anything about what happens to the photo (per `InviteGate`'s existing
  copy: "Şəkil telefonda qalır, yalnız tənliyin mətni serverə gedir" — verify this claim
  is still literally true in the current code path, since claims like this are exactly
  the kind of thing that silently drifts out of sync with implementation). Note:
  `docs/INVARIANTS.md` (Cowork-owned) already flags `ocr_captures` photo retention
  policy as an open item (INV-09) — don't re-report it as a new finding, but do check
  whether any UI copy makes a promise the current retention behavior doesn't keep.
- **Parental/guardian visibility.** Out of Phase 1 scope per `PHASE-1.md` (explicitly
  excludes "Valideyn hesabatı"), so don't flag its absence as a bug — but if you're
  reviewing anything that touches the invite/access-code flow, note that the paying
  customer (per `CLAUDE.md`: "abunəni ödəyən valideyndir") is a different person from
  the user in front of the screen, and any friction in that flow affects a stakeholder
  who never sees the rest of the app.
