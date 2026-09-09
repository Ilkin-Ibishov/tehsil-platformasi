#!/usr/bin/env node
/**
 * sync-agent-context.mjs
 * 
 * One-way synchronization tool to keep .cursor/skills in sync with .agents/skills.
 * Source of truth: .agents/skills/
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const srcDir = path.join(repoRoot, ".agents", "skills");
const destDir = path.join(repoRoot, ".cursor", "skills");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const srcContent = fs.readFileSync(src);
    let needWrite = true;
    if (fs.existsSync(dest)) {
      const destContent = fs.readFileSync(dest);
      if (srcContent.equals(destContent)) {
        needWrite = false;
      }
    }
    if (needWrite) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, srcContent);
      console.log(`Synced: ${path.relative(repoRoot, dest)}`);
    }
  }
}

console.log("Synchronizing .agents/skills -> .cursor/skills...");
if (!fs.existsSync(srcDir)) {
  console.error("Source directory .agents/skills does not exist!");
  process.exit(1);
}

copyRecursive(srcDir, destDir);
console.log("Agent skills synchronization complete.");
