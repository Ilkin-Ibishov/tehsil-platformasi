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
