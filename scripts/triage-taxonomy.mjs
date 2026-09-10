#!/usr/bin/env node
/**
 * triage-taxonomy.mjs
 * 
 * Triage engine for self-healing taxonomy entries (public.v_taxonomy_review).
 * Analyzes unreviewed topic_codes and error_codes, clusters synonyms,
 * detects domain prefix overlaps, and generates actionable adoption/merge plans.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Built-in snapshot of recent v_taxonomy_review rows
export const DEFAULT_REVIEW_SNAPSHOT = [
  { nov: "topic", code: "ALG.INVERSE_PROPORTIONALITY", title_az: "ALG.INVERSE_PROPORTIONALITY", needs_review: true, active: false },
  { nov: "topic", code: "ALG.LINEAR_FUNCTION", title_az: "ALG.LINEAR_FUNCTION", needs_review: true, active: false },
  { nov: "topic", code: "ALG.FUNCTION_GRAPH", title_az: "ALG.FUNCTION_GRAPH", needs_review: true, active: false },
  { nov: "topic", code: "ARITH.ADDITION", title_az: "ARITH.ADDITION", needs_review: true, active: false },
  { nov: "topic", code: "ALG.FUNCTIONS", title_az: "ALG.FUNCTIONS", needs_review: true, active: false },
  { nov: "topic", code: "ALG.QUADRATIC_FUNCTION", title_az: "ALG.QUADRATIC_FUNCTION", needs_review: true, active: false },
  { nov: "topic", code: "ALG.PARABOLA_VERTEX", title_az: "ALG.PARABOLA_VERTEX", needs_review: true, active: false },
  { nov: "topic", code: "ALG.EXPONENTS", title_az: "ALG.EXPONENTS", needs_review: true, active: false },
  { nov: "topic", code: "ALG.FUNCTION_RANGE", title_az: "ALG.FUNCTION_RANGE", needs_review: true, active: false },
  { nov: "topic", code: "ALG.SEQUENCES", title_az: "ALG.SEQUENCES", needs_review: true, active: false },
  { nov: "topic", code: "GEO.TRIANGLE_ANGLES", title_az: "GEO.TRIANGLE_ANGLES", needs_review: true, active: false },
  { nov: "topic", code: "ALG.QUADRATIC_EXTREMUM", title_az: "ALG.QUADRATIC_EXTREMUM", needs_review: true, active: false },
  { nov: "topic", code: "ALG.FACTORING", title_az: "ALG.FACTORING", needs_review: true, active: false },
  { nov: "topic", code: "ALG.ARITHMETIC_PROGRESSION", title_az: "ALG.ARITHMETIC_PROGRESSION", needs_review: true, active: false },
  { nov: "topic", code: "ALG.RADICALS", title_az: "ALG.RADICALS", needs_review: true, active: false },
  { nov: "topic", code: "ARITH.SQUARE_ROOT", title_az: "ARITH.SQUARE_ROOT", needs_review: true, active: false },
  { nov: "topic", code: "LOGIC.CIPHER", title_az: "LOGIC.CIPHER", needs_review: true, active: false },
  { nov: "topic", code: "GEO.VECTORS", title_az: "GEO.VECTORS", needs_review: true, active: false },
  { nov: "topic", code: "GEO.INSCRIBED_CIRCLE", title_az: "GEO.INSCRIBED_CIRCLE", needs_review: true, active: false },
  { nov: "topic", code: "ALG.WORD_PROBLEM", title_az: "ALG.WORD_PROBLEM", needs_review: true, active: false },
  { nov: "topic", code: "GEO.CIRCLE_AREA", title_az: "GEO.CIRCLE_AREA", needs_review: true, active: false },
  { nov: "topic", code: "ALG.COMPLEX_NUMBERS", title_az: "ALG.COMPLEX_NUMBERS", needs_review: true, active: false },
  { nov: "topic", code: "VEC.OPERATIONS", title_az: "VEC.OPERATIONS", needs_review: true, active: false },
  { nov: "topic", code: "GEO.SOLID_GEOMETRY", title_az: "GEO.SOLID_GEOMETRY", needs_review: true, active: false },
  { nov: "topic", code: "GEO.CONE_AREA", title_az: "GEO.CONE_AREA", needs_review: true, active: false },
  { nov: "topic", code: "GEO.SOLID_CONE_VOLUME", title_az: "GEO.SOLID_CONE_VOLUME", needs_review: true, active: false },
  { nov: "topic", code: "GEO.CONE_VOLUME", title_az: "GEO.CONE_VOLUME", needs_review: true, active: false }
];

// Curated Azerbaijani labels for adoption candidates
export const TITLE_SUGGESTIONS = {
  "ALG.INVERSE_PROPORTIONALITY": "Tərs mütənasiblik",
  "ALG.LINEAR_FUNCTION": "Xətti funksiya",
  "ALG.FUNCTION_GRAPH": "Funksiyanın qrafiki",
  "ARITH.ADDITION": "Sadə toplama",
  "ALG.FUNCTIONS": "Funksiyalar və qrafiklər",
  "ALG.QUADRATIC_FUNCTION": "Kvadratik funksiya",
  "ALG.PARABOLA_VERTEX": "Parabolanın təpə nöqtəsi",
  "ALG.EXPONENTS": "Qüvvət və xassələri",
  "ALG.FUNCTION_RANGE": "Funksiyanın qiymətlər çoxluğu",
  "ALG.SEQUENCES": "Ardıcıllıqlar",
  "GEO.TRIANGLE_ANGLES": "Üçbucağın bucaqları",
  "ALG.QUADRATIC_EXTREMUM": "Kvadrat üçhədlinin ən böyük/ən kiçik qiyməti",
  "ALG.FACTORING": "Vuruqlara ayırma",
  "ALG.ARITHMETIC_PROGRESSION": "Ədədi silsilə",
  "ALG.RADICALS": "Kökaltı ifadələr",
  "ARITH.SQUARE_ROOT": "Kvadrat kök",
  "LOGIC.CIPHER": "Şifrəli məntiq",
  "GEO.VECTORS": "Vektorlar",
  "GEO.INSCRIBED_CIRCLE": "Daxilə çəkilmiş çevrə",
  "ALG.WORD_PROBLEM": "Mətnli cəbr məsələsi",
  "GEO.CIRCLE_AREA": "Dairənin sahəsi",
  "ALG.COMPLEX_NUMBERS": "Kompleks ədədlər",
  "GEO.SOLID_GEOMETRY": "Fəza fiqurları (Stereometriya)",
  "GEO.CONE_AREA": "Konusun səthinin sahəsi",
  "GEO.CONE_VOLUME": "Konusun həcmi"
};

// Aliases mapping redundant/conflicting codes to canonical codes
export const SYNONYM_MERGES = {
  "VEC.OPERATIONS": { target: "GEO.VECTORS", reason: "DİM proqramında vektorlar həndəsənin tərkib hissəsidir; GEO prefiksi vahidləşdirilməlidir." },
  "GEO.SOLID_CONE_VOLUME": { target: "GEO.CONE_VOLUME", reason: "GEO.CONE_VOLUME qısa və standartdır; təkrardır." },
  "ARITH.SQUARE_ROOT": { target: "ALG.RADICALS", reason: "Kökaltı əməliyyatlar üçün ALG.RADICALS kanonikdir (və ya ARITH.SQUARE_ROOT sadə hesablamalara aid edilir)." }
};

export function triageTaxonomy(items = DEFAULT_REVIEW_SNAPSHOT) {
  const result = {
    total: items.length,
    byCategory: { topic: [], error: [] },
    byDomain: {},
    adoptions: [],
    merges: [],
    domainConflicts: []
  };

  for (const item of items) {
    const nov = item.nov || "topic";
    if (!result.byCategory[nov]) result.byCategory[nov] = [];
    result.byCategory[nov].push(item);

    const parts = item.code.split(".");
    const domain = parts[0];
    if (!result.byDomain[domain]) result.byDomain[domain] = [];
    result.byDomain[domain].push(item.code);

    if (SYNONYM_MERGES[item.code]) {
      result.merges.push({
        source: item.code,
        target: SYNONYM_MERGES[item.code].target,
        reason: SYNONYM_MERGES[item.code].reason
      });
    } else {
      const suggestedTitle = TITLE_SUGGESTIONS[item.code] || item.code;
      result.adoptions.push({
        code: item.code,
        category: nov,
        title_az: suggestedTitle,
        action: "ADOPT"
      });
    }
  }

  // Detect domain conflicts (e.g. VEC vs GEO for vectors)
  if (result.byDomain["VEC"] && result.byDomain["GEO"]) {
    const vecCodes = result.byDomain["VEC"];
    const geoVectors = result.byDomain["GEO"].filter(c => c.includes("VECTOR"));
    if (vecCodes.length > 0 && geoVectors.length > 0) {
      result.domainConflicts.push({
        conflict: "VEC vs GEO domain mismatch",
        codes: [...vecCodes, ...geoVectors],
        recommendation: "GEO.VECTORS altında birləşdirilsin."
      });
    }
  }

  return result;
}

export function generateMarkdownReport(triageResult, date = new Date().toISOString().slice(0, 10)) {
  const lines = [];
  lines.push(`# Taksonomiya Triyaj Hesabatı — ${date}`);
  lines.push("");
  lines.push(`> Mənbə: \`public.v_taxonomy_review\` · Cəmi baxış gözləyən kod sayı: **${triageResult.total}**`);
  lines.push("");
  lines.push("## 1. Domen İcmalı");
  lines.push("");
  lines.push("| Domen | Say | Nümunələr |");
  lines.push("|---|---|---|");
  for (const [dom, list] of Object.entries(triageResult.byDomain)) {
    lines.push(`| **${dom}** | ${list.length} | \`${list.slice(0, 3).join("`, `")}\`${list.length > 3 ? "..." : ""} |`);
  }
  lines.push("");

  if (triageResult.merges.length > 0) {
    lines.push("## 2. Sinonim və Birləşdirmə Təklifləri (Merges / Aliases)");
    lines.push("");
    lines.push("| Uydurulmuş Kod | Kanonik Hədəf | Səbəb |");
    lines.push("|---|---|---|");
    for (const m of triageResult.merges) {
      lines.push(`| \`${m.source}\` | **\`${m.target}\`** | ${m.reason} |`);
    }
    lines.push("");
  }

  if (triageResult.domainConflicts.length > 0) {
    lines.push("## 3. Prefiks / Domen Ziddiyyətləri");
    lines.push("");
    for (const dc of triageResult.domainConflicts) {
      lines.push(`- **${dc.conflict}**: \`${dc.codes.join("`, `")}\` ➔ ${dc.recommendation}`);
    }
    lines.push("");
  }

  lines.push("## 4. Təsdiq və Qəbul Planı (Adoptions)");
  lines.push("");
  lines.push("| Kod | Təklif Olunan Azərbaycan Adı | Kateqoriya |");
  lines.push("|---|---|---|");
  for (const a of triageResult.adoptions) {
    lines.push(`| \`${a.code}\` | **${a.title_az}** | ${a.category} |`);
  }
  lines.push("");

  return lines.join("\n");
}

export function generateMigrationSql(triageResult) {
  const sql = [];
  sql.push("-- Generated by triage-taxonomy.mjs");
  sql.push("-- Activates legitimate topic codes and resolves unreviewed taxonomy entries");
  sql.push("");

  for (const a of triageResult.adoptions) {
    sql.push(`update public.topic_codes set active = true, needs_review = false, title_az = '${a.title_az}' where code = '${a.code}';`);
  }

  for (const m of triageResult.merges) {
    sql.push(`-- Alias: ${m.source} -> ${m.target} (${m.reason})`);
    sql.push(`update public.topic_codes set active = false, needs_review = false where code = '${m.source}';`);
  }

  return sql.join("\n");
}

// CLI Execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);

  if (args.includes("--selftest")) {
    console.log("Running triage-taxonomy selftest...");
    const sample = [
      { nov: "topic", code: "VEC.OPERATIONS", needs_review: true },
      { nov: "topic", code: "GEO.VECTORS", needs_review: true },
      { nov: "topic", code: "GEO.SOLID_CONE_VOLUME", needs_review: true },
      { nov: "topic", code: "GEO.CONE_VOLUME", needs_review: true }
    ];
    const res = triageTaxonomy(sample);
    if (res.merges.length < 2) {
      console.error("FAIL: expected at least 2 merges, got", res.merges.length);
      process.exit(1);
    }
    if (res.domainConflicts.length < 1) {
      console.error("FAIL: expected domain conflict for VEC vs GEO");
      process.exit(1);
    }
    console.log("triage-taxonomy selftest passed!");
    process.exit(0);
  }

  let inputData = DEFAULT_REVIEW_SNAPSHOT;
  const inputIdx = args.indexOf("--input");
  if (inputIdx !== -1 && args[inputIdx + 1]) {
    inputData = JSON.parse(fs.readFileSync(args[inputIdx + 1], "utf8"));
  }

  const triageResult = triageTaxonomy(inputData);

  if (args.includes("--sql")) {
    console.log(generateMigrationSql(triageResult));
  } else {
    const report = generateMarkdownReport(triageResult);
    if (args.includes("--save")) {
      const outPath = path.join(__dirname, "..", "docs", "reports", `taxonomy-triage-${new Date().toISOString().slice(0, 10)}.md`);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, report, "utf8");
      console.log(`Saved triage report to ${outPath}`);
    } else {
      console.log(report);
    }
  }
}
