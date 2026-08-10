// `validateStepIndex`/`resolveStepCheck` üçün xərcsiz selftest — HANDOFF (73) tələb etdiyi
// reqressiya qıfılı: massiv-mövqe "körpüsü" silinəndən sonra (a) `step_index` STEP-SCHEMA
// `index` sahəsi kimi doğrulanmalıdır (minimum 1, tam), (b) açar tapılmayanda AÇIQ xəta
// qayıtmalıdır (`ok:false`), səssiz `correct:false` YOX.
//
// İşə salma: npx tsx web/lib/verify/step-check.selftest.mts

import { validateStepIndex, resolveStepCheck } from "./step-check.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

// --- validateStepIndex: massiv mövqeyi (0-based) ARTIQ QƏBUL EDİLMİR ---
check("validateStepIndex(1)", validateStepIndex(1), 1);
check("validateStepIndex(6)", validateStepIndex(6), 6);
check("validateStepIndex(0) — köhnə massiv-mövqe sıfırı RƏDD", validateStepIndex(0), null);
check("validateStepIndex(-1)", validateStepIndex(-1), null);
check("validateStepIndex(1.5)", validateStepIndex(1.5), null);
check("validateStepIndex('1') — sətir rədd edilir", validateStepIndex("1"), null);
check("validateStepIndex(undefined)", validateStepIndex(undefined), null);
check("validateStepIndex(null)", validateStepIndex(null), null);

// --- resolveStepCheck: açar tapılmayanda AÇIQ xəta, səssiz false YOX ---
check(
  "resolveStepCheck(null, ...) — açar heç yoxdur",
  resolveStepCheck(null, "3"),
  { ok: false, error: "step_not_found" }
);
check(
  "resolveStepCheck(undefined, ...) — reveal_step_answer heç nə qaytarmayıb",
  resolveStepCheck(undefined, "3"),
  { ok: false, error: "step_not_found" }
);
check(
  "resolveStepCheck({accept: undefined}, ...) — accept massiv deyil",
  resolveStepCheck({ accept: undefined }, "3"),
  { ok: false, error: "step_not_found" }
);
check(
  "resolveStepCheck(doğru cavab)",
  resolveStepCheck({ accept: ["3", "-3"] }, "3"),
  { ok: true, correct: true }
);
check(
  "resolveStepCheck(səhv cavab, açar TAPILIB)",
  resolveStepCheck({ accept: ["3"] }, "4"),
  { ok: true, correct: false }
);
check(
  "resolveStepCheck(ədədi ekvivalent, HANDOFF 45 §B1)",
  resolveStepCheck({ accept: ["0.5"] }, "1/2"),
  { ok: true, correct: true }
);
check(
  "resolveStepCheck(boş accept massivi) — açar tapılıb, sadəcə heç nəyə uyğun gəlmir",
  resolveStepCheck({ accept: [] }, "3"),
  { ok: true, correct: false }
);

const TOTAL = 15;
if (fails > 0) {
  console.error(`\n${fails}/${TOTAL} uğursuz.`);
  process.exit(1);
}
console.log(`\n${TOTAL}/${TOTAL} keçdi.`);
