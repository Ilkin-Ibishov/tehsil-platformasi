#!/usr/bin/env node
import { execSync } from "node:child_process";
import path from "node:path";

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

function basename(filePath) {
  const norm = String(filePath || "").replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/");
  return idx >= 0 ? norm.slice(idx + 1) : norm;
}

async function main() {
  const payload = await readStdin();

  // 1. PreToolUse: run_command
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

  // 2. PreToolUse: view_file
  if (payload.toolCall && payload.toolCall.name === "view_file") {
    const args = payload.toolCall.args || {};
    const targetFile = String(args.AbsolutePath || args.filePath || args.path || "");
    const base = basename(targetFile).toLowerCase();

    const isExample = base === ".env.example";
    const isEnv = /^\.env(\.|$)/i.test(base);
    const isSecret = /^credentials\.json$/i.test(base) || /service[-_]?account.*\.json$/i.test(base);

    if ((isEnv && !isExample) || isSecret) {
      respond("deny", "Refusing to read secrets file into agent context.");
      return;
    }

    respond("allow");
    return;
  }

  // 3. Stop: verify session closure if code was modified
  if (payload.terminationReason) {
    try {
      const statusOutput = execSync("git status --porcelain", { encoding: "utf8" });
      const changedLines = statusOutput.split("\n").filter(Boolean);
      
      const codeChanged = changedLines.some((line) => {
        const file = line.slice(3).trim().replace(/\\/g, "/");
        return (
          file.startsWith("web/") ||
          file.startsWith("supabase/") ||
          file.startsWith("scripts/") ||
          file.startsWith("prompts/")
        );
      });

      const handoffUpdated = changedLines.some((line) => {
        const file = line.slice(3).trim().replace(/\\/g, "/");
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
