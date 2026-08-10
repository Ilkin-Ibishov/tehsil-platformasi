#!/usr/bin/env node
/**
 * scripts/metrics/snapshot.mjs
 *
 * Layihənin inkişaf dinamikasını ölçür və JSON snapshot yazır.
 * Asılılıq yoxdur — yalnız node built-in + git.
 *
 *   node scripts/metrics/snapshot.mjs        # snapshot yaz + xülasə çap et
 *   node scripts/metrics/snapshot.mjs --dry  # yalnız çap et, yazma
 *
 * Çıxış:
 *   docs/metrics/latest.json     — son vəziyyət
 *   docs/metrics/history.jsonl   — append-only zaman seriyası
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry');
const OUT_DIR = 'docs/metrics';

const sh = (c) => execSync(c, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const today = new Date().toISOString().slice(0, 10);
const round = (n, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)) : null);
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────
// 1. TƏRKİB — sətir sayı kateqoriyalar üzrə
// Bu bölmə "sənəd kodu üstələyir" problemini tutur.
// ─────────────────────────────────────────────────────────────

const TEXT_EXT = /\.(md|ts|tsx|js|jsx|mjs|mts|py|sql|json|jsonl|css|html|yml|yaml|sh|bat)$/i;

function categorize(p) {
  const f = p.replace(/\\/g, '/');
  if (/\.(test|spec)\.(ts|tsx|js)$/.test(f)) return 'test';
  if (f.startsWith('supabase/migrations/')) return 'migration';
  if (f.startsWith('scripts/metrics/')) return 'metrics';
  if (f.startsWith('evals/') || (f.startsWith('scripts/') && f.endsWith('.py'))) return 'eval';
  if (f.startsWith('design/')) return 'design';
  if (f.startsWith('prompts/')) return 'prompt';
  if (f.startsWith('.kiro/')) return 'spec';
  if (f.startsWith('docs/decisions/')) return 'adr';
  if (f.startsWith('docs/HANDOFF')) return 'handoff';
  if (f.endsWith('.md')) return 'docs';
  if (f.startsWith('web/') && /\.(ts|tsx)$/.test(f)) return 'app';
  if (/\.(ts|tsx|js|jsx|mjs|mts)$/.test(f)) return 'tooling';
  return 'config';
}

function composition() {
  const files = sh('git ls-files -z').split('\0').filter(Boolean);
  const out = {};
  for (const f of files) {
    if (!TEXT_EXT.test(f)) continue;
    let lines = 0;
    try { lines = readFileSync(f, 'utf8').split('\n').length; } catch { continue; }
    const c = categorize(f);
    out[c] ??= { files: 0, lines: 0 };
    out[c].files++;
    out[c].lines += lines;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 2. SÜRƏT və FOKUS
// "focus" = son N gündə istehsalata çatan kod toxunan commit faizi.
// Bu, "3 gün sənəd yazdım, sıfır kod" halını ERKƏN tutan metrikadır.
// ─────────────────────────────────────────────────────────────

function commits(sinceDays) {
  const since = daysAgo(sinceDays);
  const raw = sh(`git log --since=${since} --date=short --numstat --pretty=format:"@@@%H|%ad|%s"`);
  const list = [];
  let cur = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('@@@')) {
      const [hash, date, ...rest] = line.slice(3).split('|');
      cur = { hash, date, subject: rest.join('|'), added: 0, deleted: 0, files: [] };
      list.push(cur);
    } else if (cur && line.trim()) {
      const [a, d, ...pathParts] = line.split('\t');
      const p = pathParts.join('\t');
      if (!p) continue;
      cur.added += Number(a) || 0;
      cur.deleted += Number(d) || 0;
      cur.files.push(p);
    }
  }
  return list;
}

const SHIPPABLE = (f) =>
  f.startsWith('web/') || f.startsWith('supabase/') || f.startsWith('prompts/');

function velocity(list, windowDays) {
  const byDay = {};
  const types = {};
  let added = 0, deleted = 0, shippableCommits = 0;

  for (const c of list) {
    byDay[c.date] = (byDay[c.date] || 0) + 1;
    added += c.added;
    deleted += c.deleted;
    const t = (c.subject.match(/^(\w+)(\(|:)/) || [, 'other'])[1];
    types[t] = (types[t] || 0) + 1;
    if (c.files.some(SHIPPABLE)) shippableCommits++;
  }

  const activeDays = Object.keys(byDay).length;
  return {
    window_days: windowDays,
    commits: list.length,
    active_days: activeDays,
    commits_per_active_day: round(list.length / (activeDays || 1)),
    lines_added: added,
    lines_deleted: deleted,
    churn_ratio: round(deleted / (added || 1)),
    commit_types: types,
    shippable_commits: shippableCommits,
    focus_pct: round((shippableCommits / (list.length || 1)) * 100, 1),
    by_day: byDay,
  };
}

// ─────────────────────────────────────────────────────────────
// 3. QƏRAR SAĞLAMLIĞI — ADR, HANDOFF, açıq bloklar
// ─────────────────────────────────────────────────────────────

function decisions() {
  const files = sh('git ls-files -z docs/decisions').split('\0').filter(Boolean);
  let accepted = 0, proposed = 0;
  const numbers = new Set();
  const dupes = [];
  for (const f of files) {
    const n = (f.match(/ADR-(\d+)/) || [])[1];
    if (n) { if (numbers.has(n)) dupes.push(n); numbers.add(n); }
    const txt = readFileSync(f, 'utf8');
    if (/Status:\*{0,2}\s*Q[əe]bul/i.test(txt)) accepted++;
    else if (/Status:\*{0,2}\s*T[əe]klif/i.test(txt)) proposed++;
  }

  let handoff = { entries: 0, lines: 0, open_blocks: 0, latest: null };
  const hp = 'docs/HANDOFF.md';
  if (existsSync(hp)) {
    const txt = readFileSync(hp, 'utf8');
    const heads = [...txt.matchAll(/^##\s+\d{4}-\d{2}-\d{2}\s*\((\d+)\)/gm)];
    const blocks = [...txt.matchAll(/^\*\*Blok:\*\*\s*(.*)$/gm)];
    handoff = {
      entries: heads.length,
      lines: txt.split('\n').length,
      open_blocks: blocks.filter((b) => !/yoxdur/i.test(b[1])).length,
      latest: heads.length ? Number(heads[0][1]) : null,
    };
  }

  return { adr_total: files.length, adr_accepted: accepted, adr_proposed: proposed,
           adr_duplicate_numbers: dupes, handoff };
}

// ─────────────────────────────────────────────────────────────
// 4. TƏHVİL — miqrasiya, endpoint, ekran
// ─────────────────────────────────────────────────────────────

function delivery() {
  const count = (glob) => sh(`git ls-files -z ${glob}`).split('\0').filter(Boolean).length;
  return {
    migrations_written: count('supabase/migrations'),
    api_routes: count('web/app/api'),
    components: count('web/components'),
    design_mockups: count('design'),
    test_files: sh('git ls-files -z').split('\0')
      .filter((f) => /\.(test|spec)\.(ts|tsx)$/.test(f)).length,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. MƏHSUL QAPISI — əl ilə doldurulur (docs/metrics/gate.json)
// Kod metriki nə qədər yaxşı olsa da, YEGANƏ vacib rəqəm budur.
// ─────────────────────────────────────────────────────────────

function gate() {
  const p = `${OUT_DIR}/gate.json`;
  const def = {
    _comment: 'Faza 1 qapısı. Əl ilə yenilə. Bu rəqəmlər 0 olduğu müddətdə qalan hər şey fərziyyədir.',
    target: { students: 20, solves: 100, returning_students: 8 },
    actual: { students: 0, solves: 0, returning_students: 0 },
    cost_per_solve_usd: 0.0167,
    latency_p50_sec: 16.8,
    updated: null,
  };
  if (!existsSync(p)) {
    if (!DRY) { mkdirSync(OUT_DIR, { recursive: true }); writeFileSync(p, JSON.stringify(def, null, 2)); }
    return def;
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

// ─────────────────────────────────────────────────────────────
// 6. TÖRƏMƏ NİSBƏTLƏR — əsl siqnal buradadır
// ─────────────────────────────────────────────────────────────

function derive(comp, v7, v30, g) {
  const L = (k) => comp[k]?.lines || 0;
  const writing = L('docs') + L('spec') + L('adr') + L('handoff');
  const code = L('app') + L('migration') + L('tooling');
  const gateProgress =
    (g.actual.students / g.target.students +
     g.actual.solves / g.target.solves +
     g.actual.returning_students / g.target.returning_students) / 3;

  return {
    doc_to_code_ratio: round(writing / (code || 1)),
    test_to_app_ratio: round(L('test') / (L('app') || 1)),
    handoff_share_of_docs_pct: round((L('handoff') / (writing || 1)) * 100, 1),
    focus_7d_pct: v7.focus_pct,
    focus_30d_pct: v30.focus_pct,
    gate_progress_pct: round(gateProgress * 100, 1),
    monthly_solves_to_breakeven: g.cost_per_solve_usd
      ? Math.floor(2.94 / g.cost_per_solve_usd) : null,
  };
}

// ─────────────────────────────────────────────────────────────
// 7. XƏBƏRDARLIQLAR — hədd aşılanda səssiz qalmır
// ─────────────────────────────────────────────────────────────

const THRESHOLDS = {
  doc_to_code_ratio: 1.5,   // sənəd koddan 1.5x çoxdursa
  focus_7d_pct: 40,         // son həftədə commit-lərin <40%-i kod toxunubsa
  test_to_app_ratio: 0.2,   // test/app < 0.2
  handoff_lines: 2500,      // HANDOFF rotasiya vaxtıdır
  churn_ratio: 0.6,         // silinən/əlavə olunan yüksəkdirsə = yenidən iş
};

function warnings(d, comp, dec, v7) {
  const w = [];
  if (d.doc_to_code_ratio > THRESHOLDS.doc_to_code_ratio)
    w.push(`SƏNƏD ARTIQLIĞI: doc/code = ${d.doc_to_code_ratio} (hədd ${THRESHOLDS.doc_to_code_ratio})`);
  if (d.focus_7d_pct < THRESHOLDS.focus_7d_pct)
    w.push(`FOKUS AŞAĞI: son 7 gündə commit-lərin yalnız ${d.focus_7d_pct}%-i web/supabase toxunub`);
  if (d.test_to_app_ratio < THRESHOLDS.test_to_app_ratio)
    w.push(`TEST AZLIĞI: test/app = ${d.test_to_app_ratio}`);
  if (dec.handoff.lines > THRESHOLDS.handoff_lines)
    w.push(`HANDOFF ${dec.handoff.lines} sətir — rotasiya lazımdır`);
  if (v7.churn_ratio > THRESHOLDS.churn_ratio)
    w.push(`YENİDƏN İŞ: churn = ${v7.churn_ratio} (silinən/əlavə)`);
  if (dec.adr_duplicate_numbers.length)
    w.push(`ADR NÖMRƏ TOQQUŞMASI: ${dec.adr_duplicate_numbers.join(', ')}`);
  if (dec.handoff.open_blocks > 0)
    w.push(`${dec.handoff.open_blocks} açıq blok HANDOFF-da`);
  if (d.gate_progress_pct === 0)
    w.push('QAPI 0%: heç bir real şagird məlumatı yoxdur — qalan hər şey fərziyyədir');
  return w;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

const comp = composition();
const c7 = commits(7), c30 = commits(30);
const v7 = velocity(c7, 7), v30 = velocity(c30, 30);
const dec = decisions();
const del = delivery();
const g = gate();
const der = derive(comp, v7, v30, g);
const warns = warnings(der, comp, dec, v7);

const snapshot = {
  date: today,
  commit: sh('git rev-parse --short HEAD').trim(),
  composition: comp,
  velocity_7d: v7,
  velocity_30d: v30,
  decisions: dec,
  delivery: del,
  gate: g,
  derived: der,
  warnings: warns,
};

if (!DRY) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}/latest.json`, JSON.stringify(snapshot, null, 2));
  appendFileSync(`${OUT_DIR}/history.jsonl`, JSON.stringify(snapshot) + '\n');
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`\n═══ ${today} · ${snapshot.commit} ═══\n`);
console.log('TƏRKİB (sətir)');
for (const [k, v] of Object.entries(comp).sort((a, b) => b[1].lines - a[1].lines))
  console.log(`  ${pad(k, 12)} ${String(v.lines).padStart(6)}  (${v.files} fayl)`);

console.log('\nNİSBƏTLƏR');
for (const [k, v] of Object.entries(der)) console.log(`  ${pad(k, 30)} ${v}`);

console.log('\nSÜRƏT (7 gün)');
console.log(`  commit ${v7.commits} · aktiv gün ${v7.active_days} · +${v7.lines_added}/-${v7.lines_deleted} · fokus ${v7.focus_pct}%`);
console.log(`  tiplər: ${Object.entries(v7.commit_types).map(([k, n]) => `${k}:${n}`).join(' ')}`);

console.log('\nQƏRARLAR');
console.log(`  ADR ${dec.adr_total} (qəbul ${dec.adr_accepted}, təklif ${dec.adr_proposed}) · HANDOFF #${dec.handoff.latest}, ${dec.handoff.lines} sətir · açıq blok ${dec.handoff.open_blocks}`);

console.log('\nTƏHVİL');
console.log(`  miqrasiya ${del.migrations_written} · api ${del.api_routes} · komponent ${del.components} · test ${del.test_files}`);

if (warns.length) {
  console.log('\n⚠ XƏBƏRDARLIQ');
  for (const w of warns) console.log(`  • ${w}`);
}
console.log('');
