#!/usr/bin/env node
/**
 * guard.selftest.mjs
 *
 * Comprehensive selftest for Antigravity & Cursor guard hook:
 * Verifies PreInvocation ephemeral reminders, PreToolUse command & secret safety,
 * PostToolUse syntax/typecheck validation, and Stop session integrity.
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const guardScript = path.join(repoRoot, "scripts", "hooks", "antigravity-guard.mjs");

function runGuard(payload, args = []) {
  const argsStr = args.length > 0 ? " " + args.join(" ") : "";
  const cmd = `node "${guardScript}"${argsStr}`;
  const out = execSync(cmd, {
    cwd: repoRoot,
    input: JSON.stringify(payload),
    encoding: "utf8",
    stdio: "pipe",
  });
  return JSON.parse(out);
}

console.log("🛡️ Running Antigravity Guard Selftest Suite...\n");

let passed = 0;
let failed = 0;

function assert(condition, testName, extraInfo = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${extraInfo}`);
    failed++;
  }
}

// 1. PreToolUse: run_command protections
{
  const res = runGuard({
    toolCall: { name: "run_command", args: { CommandLine: "git push origin main --force" } },
  });
  assert(res.decision === "deny", "Blocks force-push to main branch with deny");
}

{
  const res = runGuard({
    toolCall: { name: "run_command", args: { CommandLine: "git push origin feature/test --force" } },
  });
  assert(res.decision === "ask", "Prompts for force-push to non-main branch with ask");
}

{
  const res = runGuard({
    toolCall: { name: "run_command", args: { CommandLine: "git reset --hard HEAD~1" } },
  });
  assert(res.decision === "ask", "Prompts on destructive git reset --hard with ask");
}

{
  const res = runGuard({
    toolCall: { name: "run_command", args: { CommandLine: "drop table users" } },
  });
  assert(res.decision === "ask", "Prompts on destructive SQL DROP TABLE with ask");
}

{
  const res = runGuard({
    toolCall: { name: "run_command", args: { CommandLine: "git status" } },
  });
  assert(res.decision === "allow", "Allows safe terminal commands");
}

// 2. PreToolUse: secret shielding & file access
{
  const res = runGuard({
    toolCall: { name: "view_file", args: { AbsolutePath: "/repo/.env" } },
  });
  assert(res.decision === "deny", "Shields .env file from view_file");
}

{
  const res = runGuard({
    toolCall: { name: "view_file", args: { AbsolutePath: "/repo/.env.local" } },
  });
  assert(res.decision === "deny", "Shields .env.local file from view_file");
}

{
  const res = runGuard({
    toolCall: { name: "view_file", args: { AbsolutePath: "/repo/service_account.json" } },
  });
  assert(res.decision === "deny", "Shields service account JSON from view_file");
}

{
  const res = runGuard({
    toolCall: { name: "view_file", args: { AbsolutePath: "/repo/.env.example" } },
  });
  assert(res.decision === "allow", "Allows reading .env.example");
}

{
  const res = runGuard({
    toolCall: { name: "write_to_file", args: { TargetFile: "/repo/.env" } },
  });
  assert(res.decision === "deny", "Shields .env from write_to_file");
}

{
  const res = runGuard({
    toolCall: { name: "read_file", args: { AbsolutePath: "/repo/.env" } },
  });
  assert(res.decision === "deny", "Shields .env from read_file");
}

{
  const res = runGuard({
    toolCall: { name: "view_file", args: { AbsolutePath: "/repo/id_rsa" } },
  });
  assert(res.decision === "deny", "Shields id_rsa private key from view_file");
}

{
  const res = runGuard({
    toolCall: { name: "view_file", args: { AbsolutePath: "/repo/server.key" } },
  });
  assert(res.decision === "deny", "Shields server.key from view_file");
}

// 3. PreToolUse on prompts/ and web/app/api/solve/
{
  const res = runGuard({
    toolCall: { name: "replace_file_content", args: { TargetFile: "prompts/math-v17.md" } },
  });
  assert(
    res.decision === "allow" &&
      res.reason &&
      res.reason.includes("ADR-017") &&
      res.reason.includes("verified"),
    "PreToolUse on prompts/ injects ADR-017 & 3-state verification reminder"
  );
}

{
  const res = runGuard({
    toolCall: { name: "replace_file_content", args: { TargetFile: "web/app/api/solve/route.ts" } },
  });
  assert(
    res.decision === "allow" &&
      res.reason &&
      res.reason.includes("ADR-017") &&
      res.reason.includes("verified"),
    "PreToolUse on web/app/api/solve/ injects ADR-017 reminder"
  );
}

// 4. PreInvocation: ephemeral reminders
{
  const res = runGuard(
    {
      hookEvent: "PreInvocation",
      prompt: "prompts/ daxilindəki şablonu yenilə",
    },
    ["--pre-invocation"]
  );
  assert(
    res.decision === "allow" &&
      res.reason &&
      res.reason.includes("ADR-017") &&
      res.reason.includes("verified"),
    "PreInvocation with prompts/ in prompt injects ADR-017 ephemeral reminder"
  );
}

{
  const res = runGuard(
    {
      hookEvent: "PreInvocation",
      prompt: "web/app/api/solve/ axınını tənzimlə",
    },
    ["--pre-invocation"]
  );
  assert(
    res.decision === "allow" &&
      res.reason &&
      res.reason.includes("ADR-017") &&
      res.reason.includes("verified"),
    "PreInvocation with web/app/api/solve/ injects ADR-017 reminder"
  );
}

{
  const res = runGuard(
    {
      hookEvent: "PreInvocation",
      prompt: "api/solve axınını yoxla",
    },
    ["--pre-invocation"]
  );
  assert(
    res.decision === "allow" &&
      res.reason &&
      res.reason.includes("ADR-017") &&
      res.reason.includes("verified"),
    "PreInvocation with api/solve (no trailing slash) injects ADR-017 reminder"
  );
}

{
  const res = runGuard(
    {
      hookEvent: "PreInvocation",
      prompt: "prompts siyahısını nəzərdən keçir",
    },
    ["--pre-invocation"]
  );
  assert(
    res.decision === "allow" &&
      res.reason &&
      res.reason.includes("ADR-017") &&
      res.reason.includes("verified"),
    "PreInvocation with prompts (no trailing slash) injects ADR-017 reminder"
  );
}

{
  const res = runGuard(
    {
      hookEvent: "PreInvocation",
      prompt: "README faylını redaktə et",
    },
    ["--pre-invocation"]
  );
  assert(
    res.decision === "allow" && !res.reason,
    "PreInvocation without solve/prompts allows without injection"
  );
}

// 5. PostToolUse: syntax validation, non-web skips, and .ts vs .tsx
{
  const res = runGuard(
    {
      hookEvent: "PostToolUse",
      toolCall: {
        name: "replace_file_content",
        args: {
          TargetFile: "docs/BACKLOG.md",
          ReplacementContent: "### AG-004: Hook Genişlənməsi\nStatus: Complete\n1. Addim",
        },
      },
    },
    ["--post"]
  );
  assert(res.decision === "allow", "PostToolUse skips non-web files even when ReplacementContent contains markdown");
}

{
  const res = runGuard(
    {
      hookEvent: "PostToolUse",
      toolCall: {
        name: "replace_file_content",
        args: {
          TargetFile: "web/lib/dummy.ts",
          ReplacementContent: "export const DUMMY: number = 42;",
        },
      },
    },
    ["--post"]
  );
  assert(
    res.decision === "allow",
    "PostToolUse passes clean .ts (non-jsx) file without TS6046 error"
  );
}

{
  const res = runGuard(
    {
      hookEvent: "PostToolUse",
      toolCall: {
        name: "replace_file_content",
        args: {
          TargetFile: "web/components/dummy.tsx",
          ReplacementContent: "export const Button = () => <button>Click</button>;",
        },
      },
    },
    ["--post"]
  );
  assert(
    res.decision === "allow",
    "PostToolUse passes clean .tsx (React JSX) file"
  );
}

{
  const res = runGuard(
    {
      hookEvent: "PostToolUse",
      toolCall: {
        name: "replace_file_content",
        args: {
          TargetFile: "web/lib/broken.ts",
          ReplacementContent: "export const x = ; function {",
        },
      },
    },
    ["--post"]
  );
  assert(
    res.decision === "warn" &&
      res.reason &&
      res.reason.includes("Sintaksis Xətası") &&
      res.reason.includes("web/lib/broken.ts"),
    "PostToolUse catches TypeScript syntax error in .ts file and issues warn"
  );
}

{
  const res = runGuard(
    {
      hookEvent: "PostToolUse",
      toolCall: {
        name: "write_to_file",
        args: {
          TargetFile: "web/messages/dummy.json",
          CodeContent: "{ bad_json: true, }",
        },
      },
    },
    ["--post"]
  );
  assert(
    res.decision === "warn" &&
      res.reason &&
      res.reason.includes("JSON Sintaksis Xətası"),
    "PostToolUse catches JSON syntax errors in web/ JSON files"
  );
}

// 6. Stop hook: verify session closure behavior
{
  const res = runGuard({
    hookEvent: "Stop",
    terminationReason: "completed",
  });
  // Since git status in test environment has uncommitted files, verify decision is allow or continue
  assert(
    res.decision === "allow" || res.decision === "continue",
    "Stop hook responds with valid protojson decision (allow or continue)"
  );
}

// 7. Observability and Non-Interactive CLI Protections
{
  const res = runGuard({
    toolCall: { name: "run_command", args: { CommandLine: "npx @sentry/wizard@latest -i nextjs" } },
  });
  assert(res.decision === "deny", "Blocks interactive @sentry/wizard command in run_command");
}

{
  const dummyToken = ["phc", "_test1234567890abcdef1234567890abcdef"].join("");
  const res = runGuard({
    toolCall: {
      name: "write_to_file",
      args: {
        TargetFile: "web/lib/analytics.ts",
        CodeContent: `const token = "${dummyToken}";`,
      },
    },
  });
  assert(res.decision === "deny", "Blocks hardcoded PostHog token in write_to_file");
}

{
  const res = runGuard(
    {
      hookEvent: "PreInvocation",
      prompt: "Şagird tester rejimində posthog qeydlərini təhlil et",
    },
    ["--pre-invocation"]
  );
  assert(
    res.decision === "allow" &&
      res.reason &&
      res.reason.includes("Observability") &&
      res.reason.includes("PostHog"),
    "PreInvocation with posthog/tester in prompt injects Observability reminder"
  );
}

console.log("\n------------------------------------------------------------");
if (failed === 0) {
  console.log(`🎉 All ${passed} guard hook test assertions PASSED!`);
  process.exit(0);
} else {
  console.error(`💥 ${failed} assertion(s) FAILED out of ${passed + failed}.`);
  process.exit(1);
}
