---
name: fix-lockfile
description: Fix npm Invalid Version CI failures in web/package-lock.json — rolldown stubs, regenerate, verify npm ci. Use when CI or Vercel fails on npm ci with Invalid Version, or after vitest/rolldown dependency changes.
---

# Fix lockfile

Symptom: CI/Vercel `npm ci` fails with `npm error Invalid Version:` in `web/`.

## Diagnose

```bash
cd web && npm ci
```

Search lockfile for nodes missing `"version"`:

```bash
rg -n '"rolldown"' web/package-lock.json
```

## Fix

1. Delete corrupt stub entries **or** regenerate:

```bash
cd web
rm -rf node_modules
rm package-lock.json   # only if regenerate is safer than surgical edit
npm install
```

2. Verify:

```bash
npm ci
npx next build   # optional but catches TS issues before push
```

3. Commit `web/package-lock.json` (and `package.json` if changed).

4. Push → `.cursor/skills/push-verify/SKILL.md`.

## Prevent

- Never hand-add package-lock nodes without `version`.
- After adding vitest/rolldown-related devDeps, always run `npm install` and commit the full lockfile diff.

See: `.cursor/rules/65-ci-lockfile.mdc`, incident in HANDOFF 191.
