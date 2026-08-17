#!/usr/bin/env node
/** Replay production LLM rows through equationCrossCheck — E1.2 baseline (no vision API). */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { equationCrossCheck } from "../web/lib/verify/answer.ts";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rowsPath = path.join(repo, "scripts", "prod-verify-rows.json");
const outPath = path.join(repo, "evals", "results", "summary-golden-set-2026-08-17.json");

const rows = JSON.parse(readFileSync(rowsPath, "utf8")) as Array<{
  id: string;
  canonical: string;
  values: string[];
  db_verified: boolean;
  db_reason: string | null;
}>;

let trueCount = 0;
let falseCount = 0;
let nullCount = 0;
let newFalse = 0;
const items = rows.map((row) => {
  const { verified, reason } = equationCrossCheck(row.canonical, row.values ?? []);
  if (verified === true) trueCount++;
  else if (verified === false) {
    falseCount++;
    if (row.db_verified !== true) newFalse++;
  } else nullCount++;
  return {
    id: row.id,
    verified,
    verification_reason: reason,
    db_verified: row.db_verified,
    db_reason: row.db_reason,
    values: row.values,
  };
});

const n = rows.length;
const payload = {
  pipeline: "verify_replay",
  set: "production_llm_question_translations",
  date: "2026-08-17",
  note: "Vision golden-set eval skipped — evals/images not present locally. Pre-E1.2 deploy replay of 52 LLM production rows.",
  metrics: {
    n_total: n,
    verification_true: { rate: trueCount / n, matched: trueCount, n },
    verification_false: { rate: falseCount / n, matched: falseCount, n },
    verification_null: { rate: nullCount / n, matched: nullCount, n },
    verification_false_regression_new: { matched: newFalse, n },
    db_verified_true_before: { matched: rows.filter((r) => r.db_verified === true).length, n },
  },
  items,
};

writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Wrote ${outPath}`);
console.log(`verified true: ${trueCount}/${n} (${((100 * trueCount) / n).toFixed(1)}%)`);
console.log(`verified false: ${falseCount}/${n}`);
console.log(`verified null: ${nullCount}/${n}`);
