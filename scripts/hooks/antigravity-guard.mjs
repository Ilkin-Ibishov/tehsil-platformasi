#!/usr/bin/env node
/**
 * antigravity-guard.mjs
 *
 * Antigravity & Cursor Lifecycle Guard:
 * - PreInvocation: ephemeral ADR-017 zero-leakage & 3-state verification injection
 * - PreToolUse: commands safety (no force push to main, ask on reset/drop), secrets shielding
 * - PostToolUse: instant syntax & TypeScript typecheck warnings on web/ modifications
 * - Stop: enforces docs/HANDOFF.md updates when code files have changed
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

let tsModule = null;
function getTs() {
  if (tsModule) return tsModule;
  try {
    tsModule = require(path.join(repoRoot, "web", "node_modules", "typescript"));
  } catch {
    try {
      tsModule = require("typescript");
    } catch {}
  }
  return tsModule;
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function respond(decision, reason) {
  const payload = { decision };
  if (reason) {
    payload.reason = reason;
  }
  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

function normalizePath(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

function basename(filePath) {
  const norm = normalizePath(filePath);
  const idx = norm.lastIndexOf("/");
  return idx >= 0 ? norm.slice(idx + 1) : norm;
}

function isSecretFile(filePath) {
  const base = basename(filePath).toLowerCase();
  const isExample = base === ".env.example";
  const isEnv = /^\.env(\.|$)/i.test(base);
  const isSecret =
    /^credentials\.json$/i.test(base) ||
    /service[-_]?account.*\.json$/i.test(base) ||
    /(\.pem|\.key|id_rsa|id_ed25519)$/i.test(base);
  return (isEnv && !isExample) || isSecret;
}

function isSolveOrPromptPath(filePath) {
  const norm = normalizePath(filePath).toLowerCase();
  return (
    norm.includes("prompts/") ||
    norm.includes("prompts\\") ||
    norm.startsWith("prompts") ||
    norm.includes("web/app/api/solve") ||
    norm.includes("app/api/solve") ||
    /\bprompts\b/.test(norm) ||
    /\bapi\/solve\b/.test(norm)
  );
}

function isWebCodeFile(filePath) {
  const norm = normalizePath(filePath);
  const isWeb = norm.startsWith("web/") || norm.includes("/web/");
  const isCode = /\.(tsx?|jsx?|mts|mjs|json)$/i.test(norm);
  return isWeb && isCode;
}

const ADR017_REMINDER = `[ADR-017 & Solve Cascade Invariants Reminder]
- Qızıl Qayda (Zero Leakage - ADR-017): Addım izahatı (explanation, formula, hint) qətiyyən son cavabı sızdırmamalıdır.
- 3-Hallı Təsdiq (Verification Contract): verification.verified yalnız 3 qiymət ala bilər: true, false (həlli gizlət), və ya null (göstər + unverified). method='none' olduqda verified: true göndərilməsi qadağandır.
- STEP-SCHEMA İntizamı: error_codes donmuş 11-kodlu enumdur. Naməlum kodlar DB-də needs_review=true ilə qeydə alınır.`;

function getCandidateFiles(payload) {
  const files = [];
  const args = payload.toolCall?.args || {};
  for (const key of ["TargetFile", "AbsolutePath", "target_file", "filePath", "path", "file", "targetFile"]) {
    if (args[key]) files.push(String(args[key]));
    if (payload[key]) files.push(String(payload[key]));
  }
  if (Array.isArray(payload.files)) {
    for (const f of payload.files) files.push(String(f));
  }
  return files;
}

function getCandidateStrings(payload) {
  const list = [
    payload.prompt,
    payload.userMessage,
    payload.input,
    payload.message,
    payload.query,
    ...getCandidateFiles(payload),
  ];
  return list.filter(Boolean).map(String);
}

function touchesSolveOrPrompts(payload) {
  const candidateStrings = getCandidateStrings(payload);
  if (candidateStrings.length > 0) {
    for (const str of candidateStrings) {
      if (isSolveOrPromptPath(str)) {
        return true;
      }
    }
    return false;
  }

  // If no candidate strings or files provided in payload, fallback to checking uncommitted git changes
  try {
    const statusOutput = execSync("git status --porcelain", { cwd: repoRoot, encoding: "utf8" });
    const lines = statusOutput.split("\n").filter(Boolean);
    for (const line of lines) {
      const file = normalizePath(line.slice(3).trim());
      if (isSolveOrPromptPath(file)) {
        return true;
      }
    }
  } catch {}

  return false;
}

function checkFileSyntax(filePath, codeSnippet = null) {
  const norm = normalizePath(filePath);
  const ext = path.extname(norm).toLowerCase();

  // If the file exists on disk, read the full real file (post-tool use state)
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(repoRoot, filePath);
  let content = null;
  if (fs.existsSync(absPath)) {
    try {
      content = fs.readFileSync(absPath, "utf8");
    } catch {}
  }
  // If file doesn't exist on disk (e.g. simulated test payload), use codeSnippet
  if (content === null && codeSnippet !== null) {
    content = codeSnippet;
  }
  if (content === null) return null;

  // JSON syntax check
  if (ext === ".json") {
    try {
      JSON.parse(content);
    } catch (err) {
      return `[JSON Sintaksis Xətası] ${filePath}: ${err.message}`;
    }
    return null;
  }

  // TS / JS syntax check
  if (/\.(tsx?|jsx?|mts|mjs)$/i.test(norm)) {
    const ts = getTs();
    if (!ts) return null;

    const isJsx = ext === ".tsx" || ext === ".jsx";
    const compilerOptions = {
      target: ts.ScriptTarget.ES2020,
    };
    if (isJsx) {
      compilerOptions.jsx = ts.JsxEmit.ReactJSX;
    }

    const transpileRes = ts.transpileModule(content, {
      reportDiagnostics: true,
      fileName: filePath,
      compilerOptions,
    });
    if (transpileRes.diagnostics && transpileRes.diagnostics.length > 0) {
      const errors = transpileRes.diagnostics.map((d) => {
        const msg = typeof d.messageText === "string" ? d.messageText : d.messageText.messageText;
        const line = d.file ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 1;
        return `Line ${line}: TS${d.code} - ${msg}`;
      });
      return `[Sintaksis Xətası / Syntax Error] ${filePath}:\n${errors.join("\n")}`;
    }
  }

  return null;
}

function checkWebTypeErrors() {
  try {
    execSync("npx tsc --noEmit", {
      cwd: path.join(repoRoot, "web"),
      stdio: "pipe",
      encoding: "utf8",
      timeout: 20000,
    });
    return null;
  } catch (err) {
    const output = (err.stdout || "") + (err.stderr || "");
    const trimmed = output.trim();
    if (trimmed && /error TS\d+:/.test(trimmed)) {
      return `[Tip Xətası / TypeScript Error in web/]\n${trimmed}\n\nZəhmət olmasa növbəti addıma keçməzdən əvvəl bu tip xətasını aradan qaldırın.`;
    }
    return null;
  }
}

async function main() {
  const payload = await readStdin();

  const isPreInvocation =
    process.argv.includes("--pre-invocation") ||
    payload.hookEvent === "PreInvocation" ||
    payload.event === "PreInvocation" ||
    payload.phase === "pre-invocation" ||
    payload.phase === "pre_invocation";

  const isPostTool =
    process.argv.includes("--post") ||
    payload.hookEvent === "PostToolUse" ||
    payload.event === "PostToolUse" ||
    payload.phase === "post" ||
    payload.phase === "post_tool_use" ||
    payload.toolResult !== undefined ||
    payload.result !== undefined;

  // 1. PreInvocation: ephemeral ADR-017 and 3-state verification injection
  if (isPreInvocation) {
    if (touchesSolveOrPrompts(payload)) {
      respond("allow", ADR017_REMINDER);
      return;
    }
    respond("allow");
    return;
  }

  // 2. PostToolUse: check syntax and types if web files were touched
  if (isPostTool) {
    const candidateFiles = getCandidateFiles(payload);
    const codeSnippet =
      payload.toolCall?.args?.ReplacementContent ||
      payload.toolCall?.args?.CodeContent ||
      payload.code ||
      null;

    // If explicit candidate files were provided and NONE of them are web code files, allow immediately
    if (candidateFiles.length > 0 && !candidateFiles.some(isWebCodeFile)) {
      respond("allow");
      return;
    }

    let webFiles = candidateFiles.filter(isWebCodeFile);

    // If no candidate files provided in payload, check git status for web files
    if (webFiles.length === 0 && candidateFiles.length === 0) {
      try {
        const statusOutput = execSync("git status --porcelain", { cwd: repoRoot, encoding: "utf8" });
        const lines = statusOutput.split("\n").filter(Boolean);
        for (const line of lines) {
          const file = normalizePath(line.slice(3).trim());
          if (isWebCodeFile(file)) {
            webFiles.push(file);
          }
        }
      } catch {}
    }

    if (webFiles.length === 0 && !codeSnippet) {
      respond("allow");
      return;
    }

    const targetFile =
      payload.toolCall?.args?.TargetFile ||
      payload.toolCall?.args?.AbsolutePath ||
      payload.toolCall?.args?.target_file ||
      payload.toolCall?.args?.filePath ||
      null;

    // A. Check syntax
    for (const f of webFiles) {
      const snippet = targetFile && normalizePath(f) === normalizePath(targetFile) ? codeSnippet : null;
      const syntaxErr = checkFileSyntax(f, snippet);
      if (syntaxErr) {
        respond("warn", syntaxErr);
        return;
      }
    }
    if (webFiles.length === 0 && codeSnippet) {
      const syntaxErr = checkFileSyntax("web/in-memory-check.ts", codeSnippet);
      if (syntaxErr) {
        respond("warn", syntaxErr);
        return;
      }
    }

    // B. Check TypeScript type errors (only if non-json web code files were touched)
    const hasTsFiles = webFiles.some((f) => /\.(tsx?|jsx?|mts|mjs)$/i.test(f)) || (webFiles.length === 0 && codeSnippet);
    if (hasTsFiles) {
      const typeErr = checkWebTypeErrors();
      if (typeErr) {
        respond("warn", typeErr);
        return;
      }
    }

    respond("allow");
    return;
  }

  // 3. PreToolUse: run_command
  if (payload.toolCall && payload.toolCall.name === "run_command") {
    const args = payload.toolCall.args || {};
    const command = String(args.CommandLine || args.command || "");

    const isForcePush = /\bgit\b[\s\S]*\bpush\b[\s\S]*(--force-with-lease|--force|-f\b)/.test(command);
    const mentionsMain = /(^|[\s:])main(\s|$|:)/.test(command);

    if (isForcePush && mentionsMain) {
      respond("deny", "Force-push to main is strictly prohibited by project safety hook.");
      return;
    }

    if (isForcePush) {
      respond("ask", "Force-push on a non-main branch requires explicit user confirmation.");
      return;
    }

    if (/\bgit\b[\s\S]*\breset\b[\s\S]*--hard\b/.test(command)) {
      respond("ask", "git reset --hard is destructive. Please confirm execution.");
      return;
    }

    if (/drop\s+(table|schema|database)\b/i.test(command)) {
      respond("ask", "Destructive SQL command detected. Please confirm execution.");
      return;
    }

    respond("allow");
    return;
  }

  // 4. PreToolUse: view_file, read_file, replace_file_content, write_to_file, edit_file
  if (
    payload.toolCall &&
    (payload.toolCall.name === "view_file" ||
     payload.toolCall.name === "read_file" ||
     payload.toolCall.name === "replace_file_content" ||
     payload.toolCall.name === "write_to_file" ||
     payload.toolCall.name === "edit_file")
  ) {
    const args = payload.toolCall.args || {};
    const targetFile = String(args.AbsolutePath || args.TargetFile || args.filePath || args.path || "");

    if (isSecretFile(targetFile)) {
      respond("deny", "Refusing to read/write secrets file into agent context.");
      return;
    }

    if (isSolveOrPromptPath(targetFile)) {
      respond("allow", ADR017_REMINDER);
      return;
    }

    respond("allow");
    return;
  }

  // 5. Stop: verify session closure if code was modified
  if (payload.terminationReason || payload.hookEvent === "Stop" || payload.event === "Stop") {
    try {
      const statusOutput = execSync("git status --porcelain", { cwd: repoRoot, encoding: "utf8" });
      const changedLines = statusOutput.split("\n").filter(Boolean);

      const codeChanged = changedLines.some((line) => {
        const file = normalizePath(line.slice(3).trim());
        return (
          file.startsWith("web/") ||
          file.startsWith("supabase/") ||
          file.startsWith("scripts/") ||
          file.startsWith("prompts/")
        );
      });

      const handoffUpdated = changedLines.some((line) => {
        const file = normalizePath(line.slice(3).trim());
        return file === "docs/HANDOFF.md";
      });

      if (codeChanged && !handoffUpdated) {
        respond(
          "continue",
          "Diqqət: Kod faylları dəyişdirilib, lakin docs/HANDOFF.md yenilənməyib. Zəhmət olmasa close-session qaydasına uyğun olaraq HANDOFF jurnalına yeni blok əlavə edin."
        );
        return;
      }
    } catch {
      // If git check fails, do not block stop
    }

    respond("allow");
    return;
  }

  // Default: allow
  respond("allow");
}

main().catch(() => {
  respond("allow");
});
