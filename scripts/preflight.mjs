#!/usr/bin/env node
/**
 * preflight.mjs
 * 
 * Rapid local pre-flight suite for Təhsil Platforması (< 15 seconds).
 * Runs TypeScript typecheck, selftests, and hook assertions before push.
 */

import { execSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const webDir = path.join(repoRoot, "web");

console.log("🚀 Running Təhsil Platforması Pre-Flight Checks...\n");
const startTime = performance.now();
let passed = 0;
let failed = 0;

function runStep(name, command, cwd = repoRoot) {
  process.stdout.write(`⏳ ${name}... `);
  const stepStart = performance.now();
  try {
    execSync(command, { cwd, stdio: "pipe", encoding: "utf8" });
    const stepDuration = ((performance.now() - stepStart) / 1000).toFixed(2);
    console.log(`✅ PASS (${stepDuration}s)`);
    passed++;
    return true;
  } catch (err) {
    const stepDuration = ((performance.now() - stepStart) / 1000).toFixed(2);
    console.log(`❌ FAIL (${stepDuration}s)`);
    if (err.stdout) console.error(err.stdout.trim());
    if (err.stderr) console.error(err.stderr.trim());
    failed++;
    return false;
  }
}

// 1. Web TypeScript Typecheck
runStep("Web TypeScript Check (npx tsc --noEmit)", "npx tsc --noEmit", webDir);

// 2. Selftests
runStep("Invite URL Selftest (url.selftest.mts)", "npx tsx web/lib/invite/url.selftest.mts");
runStep("Answer Matcher Selftest (answer.selftest.mts)", "npx tsx web/lib/verify/answer.selftest.mts");
runStep("DIM Template Engine Selftest (template.selftest.mts)", "npx tsx web/lib/cascade/template.selftest.mts");
runStep("Answer Leakage Guard Selftest (leak.selftest.mts)", "npx tsx web/lib/verify/leak.selftest.mts");

// 3. Antigravity Guard Hook Test
runStep("Antigravity Guard Hook Assertions", 'node -e "const { execSync } = require(\'child_process\'); const res = execSync(\'node scripts/hooks/antigravity-guard.mjs\', { input: JSON.stringify({ toolCall: { name: \'run_command\', args: { CommandLine: \'git push origin main --force\' } } }), encoding: \'utf8\' }); if (!res.includes(\'deny\')) process.exit(1);"');

// 4. Python Eval Harness Selftest (if python exists)
try {
  execSync("python --version", { stdio: "pipe" });
  runStep("Python Eval Harness Selftest (eval.py --selftest)", "python scripts/eval.py --selftest");
} catch {
  console.log("ℹ️  Python not found in PATH — skipping eval.py --selftest");
}

const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
console.log("\n------------------------------------------------------------");
if (failed === 0) {
  console.log(`🎉 ALL ${passed} PRE-FLIGHT CHECKS PASSED in ${totalDuration}s! Ready for push.`);
  process.exit(0);
} else {
  console.error(`💥 ${failed} CHECK(S) FAILED out of ${passed + failed} in ${totalDuration}s. Fix issues before push.`);
  process.exit(1);
}
