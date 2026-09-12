# Session Protocol for Antigravity & Cursor Executors

Constitution is `CLAUDE.md`. Routing is `AGENTS.md`.

## 1. Start of Any Implementation Turn
- Read `docs/HANDOFF.md` with limit ~80 lines.
- Newest block is at the top. Do not grep or ingest older blocks.

## 2. End of a Finished Task
- Follow `close-session` skill.
- **Stop Hook Guard**: Active hook (`scripts/hooks/antigravity-guard.mjs`) blocks turn termination if code files (`web/`, `supabase/`, `scripts/`, `prompts/`) were touched without updating `docs/HANDOFF.md`. Always update HANDOFF and LOG before ending turns.
- Prepend new HANDOFF block.
- Append 1-3 lines to `LOG.md`.
- Commit directly to `main` (English message: why, not what). Do not force-push.
- If user requests push: verify CI (`gh run list --limit 1`) and Vercel (`vercel ls`) via `push-verify` skill.

## 3. Working Guidelines
- Never paste living values (active model, $/solve, latency, migration number, full HANDOFF) into rules or skills. Point to the file and read it.
- Work on `main`. Feature branches that are not merged never reach Vercel.
- UI copy in `az` via `next-intl` (`web/messages/az.json`). Code and commits in English. Docs and HANDOFF in Azerbaijani.

## 4. Execution Pitfalls & Tooling Invariants
- **No Interactive CLI Wizards**: Never run interactive wizards (e.g. `npx @sentry/wizard`) in background or autonomous agent tasks. They crash with `ERR_TTY_INIT_FAILED (EBADF)`. Author configuration files deterministically.
- **PowerShell Variable Expansion Trap**: In Windows PowerShell commands, identifiers prefixed with `$` inside double quotes (e.g. `"$pageview"`, `"$exception"`, `"$ai_generation"`) expand to empty strings `""` at shell runtime, causing silent payload corruption (e.g., PostHog 400 `event submitted with an empty event name`). Always use single quotes, backtick escapes (``$pageview``), `String.fromCharCode(36)`, or dedicated script files.
- **PowerShell Command Chaining Trap**: In Windows PowerShell (5.1), the `&&` operator is not supported and causes parser error `The token '&&' is not a valid statement separator in this version.`. Chaining multiple commands in PowerShell must use `;` or execute commands as separate steps.
- **Secrets Shielding**: Never attempt to inspect or rewrite `.env.local` directly with read tools (denied by pre-tool safety hook). When configuring user-provided credentials, append via shell commands (e.g., PowerShell `Add-Content`).
- **Observability Preservation**: Never remove or bypass `trackAIGeneration()` when editing `web/lib/llm.ts` or cascade handlers.
