---
name: close-session
description: Closes an implementation session for Təhsil Platforması — prepends a HANDOFF block, appends a short LOG.md line, and marks the ClickUp task complete. Use when the user says the work is done, asks to wrap up, commit, close a task, or write a handoff; also after a requested commit that finishes a ClickUp item.
---

# Close session

Do this only when the task is actually finished, not after a mid-session question.

## 1. HANDOFF (prepend, never edit old blocks)

`docs/HANDOFF.md` — newest block goes **immediately after** the format `---` (below the template, above the previous dated heading).

```
## YYYY-MM-DD (N) · Cursor → Cowork
Etdim:    <1–2 sentences, concrete file names>
Tapşırıq: <ClickUp id + one sentence, or "meta / no ClickUp">
Diqqət:   <what must not break, if any>
Blok:     <decision needed — omit this line if none>
```

- `N` = previous block number + 1 (read the first heading).
- From-field is `Cursor` (not Claude Code).
- Azerbaijani. Additive-only.

## 2. LOG.md

One bullet, three lines max, same date. No essay.

## 3. ClickUp

Follow `clickup-task` skill: comment what shipped, status `complete`. If ClickUp MCP errors, say so in HANDOFF `Diqqət` and still write the block.

## 4. Git

Commit when the task is finished. Do not wait to be asked. Message in English, why not what. Do not push unless asked. Do not force-push `main`.

If the user explicitly asks for push, treat push as NOT final:
- run `git push`
- then follow `.cursor/skills/push-verify/SKILL.md` (CI + Vercel)
- do not claim completion until both are green
