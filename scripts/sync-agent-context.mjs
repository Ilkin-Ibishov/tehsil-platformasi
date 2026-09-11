#!/usr/bin/env node
/**
 * sync-agent-context.mjs
 *
 * One-way sync: `.agents` is the source of truth for shared skills and
 * declarative subagents. Cursor keeps `.mdc` frontmatter and Cursor-only
 * files (`run-eval`, `product` agent, always-apply session/push rules).
 *
 * Usage:
 *   node scripts/sync-agent-context.mjs          # copy skills + agents, ensure rule mirrors exist
 *   node scripts/sync-agent-context.mjs --check  # fail if Cursor copies drifted
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const checkOnly = process.argv.includes("--check");

let drift = 0;

function logDrift(msg) {
  drift += 1;
  console.error(`DRIFT: ${msg}`);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  const srcContent = fs.readFileSync(src);
  if (fs.existsSync(dest) && srcContent.equals(fs.readFileSync(dest))) {
    return;
  }
  if (checkOnly) {
    logDrift(`${path.relative(repoRoot, dest)} != ${path.relative(repoRoot, src)}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, srcContent);
  console.log(`Synced: ${path.relative(repoRoot, dest)}`);
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function assertCopiesExist(srcDir, destDir, label) {
  for (const src of listFiles(srcDir)) {
    const rel = path.relative(srcDir, src);
    const dest = path.join(destDir, rel);
    if (!fs.existsSync(dest)) {
      logDrift(`missing ${label}: ${path.relative(repoRoot, dest)}`);
    }
  }
}

function stripMd(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const RULE_ANCHORS = {
  "00-session.md": ["stop hook guard", "err_tty_init_failed", "trackaigeneration"],
  "10-web-ui.md": ["math keyboard invariant", "empathetic copy invariant", "44px"],
  "20-solve-cascade.md": ["verification.verified", "pickfallbackmodel", "adr-017"],
  "30-migrations.md": ["expand-contract", "app_runtime", "private"],
  "40-telemetry.md": ["trackaigeneration", "tunnelroute", "/monitoring", "posthog"],
  "65-ci-lockfile.md": ["npm ci", "invalid version", "fix-lockfile"],
};

function ensureCursorRules() {
  const srcDir = path.join(repoRoot, ".agents", "rules");
  const destDir = path.join(repoRoot, ".cursor", "rules");
  if (!fs.existsSync(srcDir)) return;

  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith(".md")) continue;
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file.replace(/\.md$/, ".mdc"));
    const srcBody = fs.readFileSync(srcPath, "utf8");

    if (!fs.existsSync(destPath)) {
      if (checkOnly) {
        logDrift(`missing Cursor rule mirror: ${path.relative(repoRoot, destPath)}`);
        continue;
      }
      const name = file.replace(/\.md$/, "");
      const contents = `---\ndescription: Synced from .agents/rules/${file}\nalwaysApply: false\n---\n\n${srcBody.trim()}\n`;
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destPath, contents);
      console.log(`Created: ${path.relative(repoRoot, destPath)}`);
      continue;
    }

    const destText = stripMd(fs.readFileSync(destPath, "utf8"));
    const anchors = RULE_ANCHORS[file] ?? [];
    for (const needle of anchors) {
      if (!destText.includes(needle)) {
        logDrift(`.cursor/rules/${file.replace(/\.md$/, ".mdc")} missing invariant from .agents/rules/${file}: "${needle}"`);
      }
    }
  }
}

const srcSkills = path.join(repoRoot, ".agents", "skills");
const destSkills = path.join(repoRoot, ".cursor", "skills");
const srcAgents = path.join(repoRoot, ".agents", "agents");
const destAgents = path.join(repoRoot, ".cursor", "agents");

if (!checkOnly) {
  console.log("Synchronizing .agents/skills -> .cursor/skills...");
}
copyRecursive(srcSkills, destSkills);
assertCopiesExist(srcSkills, destSkills, "skill");

if (!checkOnly) {
  console.log("Synchronizing .agents/agents -> .cursor/agents...");
}
copyRecursive(srcAgents, destAgents);
assertCopiesExist(srcAgents, destAgents, "agent");

ensureCursorRules();

if (checkOnly) {
  if (drift > 0) {
    console.error(`Agent context check failed (${drift} drift(s)). Run: node scripts/sync-agent-context.mjs`);
    process.exit(1);
  }
  console.log("Agent context check passed (.agents → .cursor).");
  process.exit(0);
}

if (drift > 0) {
  console.error(`Synchronization wrote files but ${drift} rule invariant(s) still missing. Update the matching .cursor/rules/*.mdc.`);
  process.exit(1);
}

console.log("Agent context synchronization complete.");
