#!/usr/bin/env node
// ClickUp CLI — MCP-siz, birbaşa REST API.
//
// NİYƏ: `mcp__ClickUp__*` alətləri ClickUp MCP server-indən keçir və orada AYRI limit var —
// Free planda 24 saatlıq ROLLING pəncərədə cəmi 50 çağırış (Unlimited+ = 300), sıfırlana
// bilmir. Public REST API isə dəqiqədə 100 sorğudur (Free daxil, token başına). Yəni eyni iş
// üçün ~1000x fərq. Bu skript MCP-ni tamamilə kənara qoyur.
//   MCP limitləri:  https://help.clickup.com/hc/en-us/articles/33335772678423-What-is-ClickUp-MCP
//   REST limitləri: https://developer.clickup.com/docs/rate-limits
//
// TOKEN: `CLICKUP_TOKEN` env dəyişəni (ClickUp → Settings → Apps → API Token, `pk_...`).
// `.env` fayllarını gitignore tutur — token repoya DÜŞMƏMƏLİDİR.
//
// İSTİFADƏ:
//   node scripts/clickup.mjs ls <list_id> [--all]
//   node scripts/clickup.mjs get <task_id>
//   node scripts/clickup.mjs create <list_id> "<ad>" [--md <fayl>] [--priority urgent|high|normal|low] [--parent <task_id>]
//   node scripts/clickup.mjs comment <task_id> "<mətn>"   |   --md <fayl>
//   node scripts/clickup.mjs status <task_id> "<status>"
//   node scripts/clickup.mjs lists <folder_id>
//
// Siyahılar (CLAUDE.md): Faza 0 901820224519 · Faza 1 901820224521 · Backlog 901820224524
//                        Bloklar 901820224530 · Folder 901815897469

import fs from "node:fs";

const API = "https://api.clickup.com/api/v2";
const TOKEN = process.env.CLICKUP_TOKEN;
if (!TOKEN) {
  console.error("CLICKUP_TOKEN təyin edilməyib. ClickUp → Settings → Apps → API Token.");
  process.exit(2);
}

function argOf(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
function bodyText() {
  const f = argOf("md");
  if (f) return fs.readFileSync(f, "utf8");
  return null;
}

// 429-da X-RateLimit-Reset-ə görə gözlə. REST limiti dəqiqəlikdir — gözləmə saniyələrlə ölçülür,
// MCP-nin 4 saatlıq pəncərəsi ilə qarışdırılmamalıdır.
async function call(method, path, body, attempt = 0) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: TOKEN, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429 && attempt < 3) {
    const reset = Number(res.headers.get("x-ratelimit-reset")) || 0;
    const waitMs = Math.max(1000, Math.min(90_000, reset * 1000 - Date.now()));
    console.error(`429 — ${Math.round(waitMs / 1000)} san gözlənilir (cəhd ${attempt + 1}/3)`);
    await new Promise((r) => setTimeout(r, waitMs));
    return call(method, path, body, attempt + 1);
  }
  const text = await res.text();
  if (!res.ok) {
    console.error(`${res.status} ${method} ${path}\n${text}`);
    process.exit(1);
  }
  return text ? JSON.parse(text) : {};
}

const [, , cmd, a, b] = process.argv;

switch (cmd) {
  case "ls": {
    const all = process.argv.includes("--all");
    const r = await call("GET", `/list/${a}/task?subtasks=true&include_closed=${all}`);
    for (const t of r.tasks ?? []) {
      console.log(`${t.id}\t${t.status?.status ?? "-"}\t${t.name}`);
    }
    console.log(`\n${(r.tasks ?? []).length} task`);
    break;
  }
  case "get": {
    const t = await call("GET", `/task/${a}?include_markdown_description=true`);
    console.log(`${t.id}  [${t.status?.status}]  ${t.name}\n${t.url}\n`);
    console.log(t.markdown_description ?? t.description ?? "");
    break;
  }
  case "create": {
    const md = bodyText();
    const payload = { name: b };
    if (md) payload.markdown_description = md;
    const pr = argOf("priority");
    if (pr) payload.priority = { urgent: 1, high: 2, normal: 3, low: 4 }[pr];
    const parent = argOf("parent");
    if (parent) payload.parent = parent;
    const t = await call("POST", `/list/${a}/task`, payload);
    console.log(`${t.id}\t${t.url}`);
    break;
  }
  case "comment": {
    const md = bodyText() ?? b;
    const r = await call("POST", `/task/${a}/comment`, { comment_text: md, notify_all: false });
    console.log(`comment ${r.id}`);
    break;
  }
  case "status": {
    const t = await call("PUT", `/task/${a}`, { status: b });
    console.log(`${t.id}\t${t.status?.status}`);
    break;
  }
  case "lists": {
    const r = await call("GET", `/folder/${a}/list`);
    for (const l of r.lists ?? []) console.log(`${l.id}\t${l.name}`);
    break;
  }
  default:
    console.error(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 26).join("\n"));
    process.exit(2);
}
