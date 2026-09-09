---
name: close-session
description: >-
  Closes an implementation session for Təhsil Platforması — prepends a HANDOFF block, appends a short LOG.md line, updates ClickUp task to complete, commits to main, and verifies CI and Vercel deployments upon push. Activate when finishing a task or session.
---

# Close Session

Do this only when the task is actually finished, not after a mid-session question.

## 1. HANDOFF (prepend, never edit old blocks)

Open `docs/HANDOFF.md` — newest block goes **immediately after** the format `---` (below the template, above the previous dated heading).

```markdown
## YYYY-MM-DD (N) · Antigravity → Cowork
Etdim:    <1–2 sentences, concrete file names>
Tapşırıq: <ClickUp id + one sentence, or "meta / no ClickUp">
Diqqət:   <what must not break, if any>
Blok:     <decision needed — omit this line if none>
```

- `N` = previous block number + 1 (read the first heading).
- From-field is `Antigravity` (or `Cursor`).
- Azerbaijani. Additive-only.

## 2. LOG.md

Add one bullet point, maximum 3 lines, with the same date. Concise summary of delivered work.

## 3. ClickUp

Run the `clickup-task` procedure via REST API:
```bash
node scripts/clickup.mjs comment <task_id> --md tmp/comment.md
node scripts/clickup.mjs status <task_id> complete
```

## 4. Git & Post-Push Verification

Commit when the task is finished:
- Message in English (why, not what).
- Work on `main`. Do not force-push.

If the user explicitly asks for push:
1. Run `git push`
2. Immediately verify CI and deploy status:
   ```bash
   gh run list --limit 1
   vercel ls
   ```
3. If CI or Vercel deploy fails, inspect logs (`gh run view --log-failed` or `vercel inspect <url> --logs`) and report the failure and root cause rather than falsely claiming completion.
