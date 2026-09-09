# Telemetry & Event Taxonomy

All analytics and telemetry events must adhere strictly to `docs/TELEMETRY.md`.

## Rules
- Event names follow the `domain.action` pattern (e.g. `solve.cascade`, `solve.response`, `step.check`).
- Never invent event names or alter payload key names on the fly.
- When new events are necessary, submit a PR to `docs/TELEMETRY.md` alongside code changes.
- Ensure `model`, `fallback_used`, `fallback_from`, and `cost_usd` are recorded where specified.
