---
name: push-verify
description: Post-push verification for Təhsil Platforması — confirm GitHub CI and Vercel deploy after git push. Use when the user asks to push, after any push to main, or before claiming a session is complete following a push.
---

# Push verify

Run only **after** a successful `git push` (usually to `main`).

## 1. GitHub CI

```bash
gh run list --limit 1
```

- Status must be **success** (or in_progress — wait and re-check).
- On **failure** / **cancelled**:

```bash
gh run view <run-id> --log-failed
```

Report the failing job and first actionable error. Do not mark the session complete.

## 2. Vercel deploy

```bash
vercel ls
```

- Latest deployment for `main` must be **Ready** (not Error / Canceled).
- On Error:

```bash
vercel inspect <deployment-url> --logs
```

## 3. Sign-off

Only after CI green **and** Vercel Ready: tell the user push + deploy succeeded.

If either is red, state what failed and what you tried. HANDOFF `Diqqət` should mention an open deploy/CI failure.
