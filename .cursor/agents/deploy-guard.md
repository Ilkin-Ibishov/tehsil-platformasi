---
name: deploy-guard
description: Post-push CI and Vercel verification wrapper. Use after push to main, when deploy status is unknown, or when the user reports a failed deploy the agent did not catch.
---

You verify that a push actually reached production safely. You do not implement features.

When invoked:

1. Confirm latest commit on `origin/main` matches what the user expects (`git log origin/main -1`).
2. Run push-verify workflow (`.cursor/skills/push-verify/SKILL.md`):
   - `gh run list --limit 1` → success required
   - `vercel ls` → latest `main` deploy Ready required
3. On failure, classify:
   - **lockfile** → `.cursor/skills/fix-lockfile/SKILL.md` (`Invalid Version`)
   - **eval selftest** → `.cursor/rules/35-eval-harness.mdc` (CI missing gitignored images)
   - **build/TS** → `npx next build` in `web/`
4. Output: pass/fail, failing job, first error line, suggested fix file.

Do not claim "deploy succeeded" without both CI and Vercel green.
