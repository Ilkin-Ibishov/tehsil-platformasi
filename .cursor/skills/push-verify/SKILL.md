---
name: push-verify
description: >-
  Post-push verification for Təhsil Platforması — confirm GitHub CI, Vercel deploy, and live Sentry/PostHog health after git push. Use when the user asks to push, after any push to main, or before claiming a session is complete following a push.
---

# Push Verify & Deployment Health

Run only **after** a successful `git push` (usually to `main`).

---

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

---

## 2. Vercel Deploy

```bash
vercel ls
```

- Latest deployment for `main` must be **Ready** (not Error / Canceled).
- On Error:
```bash
vercel inspect <deployment-url> --logs
```

---

## 3. Post-Deploy Observability Audit (Sentry & PostHog)

A deployment is not truly complete if it immediately throws unhandled runtime crashes to students:
1. **Sentry Release Check**:
   - Verify that the new deployment commit/release tag has not triggered fresh unresolved exceptions (`is:unresolved is:for_review`).
   - If Sentry records sudden spikes or fatal client crashes within 5 minutes of deploy, diagnose immediately via Sentry stack traces.
2. **PostHog Ingestion Check**:
   - Ensure the deployment does not break `/monitoring` proxy tunnel or `$pageview` telemetry ingestion.

---

## 4. Sign-off

Only after CI green, Vercel Ready, **and** no active Sentry release regressions:
- Tell the user push + deploy succeeded.
- If any stage is red, state what failed and the root cause. HANDOFF `Diqqət` must mention open deploy/CI failures.
