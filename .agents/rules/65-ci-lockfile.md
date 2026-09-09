# CI Lockfile & Version Integrity

CI and Vercel builds run `npm ci` inside `web/`.

## Critical Prevention
- Never hand-edit `web/package-lock.json` to insert stub nodes without `"version"`. Doing so triggers `npm error Invalid Version:`.
- After modifying dependencies or vitest/rolldown packages in `web/`, always execute `npm install` and commit the resulting `package-lock.json`.
- If lockfile corruption occurs, use the `fix-lockfile` skill.
