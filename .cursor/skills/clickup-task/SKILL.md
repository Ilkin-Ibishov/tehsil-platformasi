---
name: clickup-task
description: ClickUp task lifecycle for this repo via MCP server user-clickup_extended_local. Use when starting work on a task, moving status, adding a progress comment, creating a task on a Phase list, searching the backlog, or closing a task after a commit or HANDOFF.
---

# ClickUp

MCP server: `user-clickup_extended_local`. List IDs live in `CLAUDE.md` (ClickUp section). Do not copy them here.

If a tool returns auth/token errors, stop and tell the user to refresh `CLICKUP_API_TOKEN` in user MCP settings. Do not write tokens into the repo.

## Statuslar (2026-08-15, list details ilə ölçüldü)

Space-də yalnız iki status var: `to do` və `complete`. **`in progress` yoxdur** — o string 400 qaytarır.

## Start

1. Find the task (`clickup_get_task` / `clickup_search_tasks` with workspace id from `CLAUDE.md`).
2. Do **not** change status (leave `to do`).
3. Comment: what you will change.

Phase 1 list is the default for executor work. Eval / backlog / blockers lists as named in `CLAUDE.md`.

## Finish

1. Comment: files + one-line result (markdown).
2. Status `complete`.
3. Then HANDOFF (`close-session`).

## Create

Only when the user asks, or HANDOFF says a task must be copied onto a list (rate-limit workaround). Keep the description short; the source of truth is still HANDOFF + code.
