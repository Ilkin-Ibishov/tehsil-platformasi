---
name: clickup-task
description: >-
  ClickUp task lifecycle management via the fast REST CLI (scripts/clickup.mjs) avoiding MCP rate limits. Use when starting work on a task, posting progress comments, searching the backlog, or completing tasks.
---

# ClickUp Task Management

Do NOT use the ClickUp MCP server (50 calls/24h limit). Use `scripts/clickup.mjs` REST API (100 req/min).

Token `CLICKUP_TOKEN` lives in `.env`.

## Key Space Details

- Workspace ID: `90182536078`
- Space ID: `901810230629`
- Available Statuses: `to do` and `complete` (There is NO `in progress` status; sending `in progress` returns HTTP 400).

## List IDs

| List | List ID |
|---|---|
| Faza 0 · Eval | `901820224519` |
| Faza 1 · Şaquli dilim | `901820224521` |
| Backlog | `901820224524` |
| Bloklar və qərarlar | `901820224530` |

## Common Commands

1. **List tasks in a list:**
   ```bash
   node scripts/clickup.mjs ls 901820224521
   ```

2. **Add a progress comment:**
   ```bash
   node scripts/clickup.mjs comment <task_id> --md tmp/comment.md
   ```

3. **Complete a task:**
   ```bash
   node scripts/clickup.mjs status <task_id> complete
   ```

4. **Create a task:**
   ```bash
   node scripts/clickup.mjs create 901820224521 "<task_name>" --md tmp/task_desc.md --priority high
   ```
