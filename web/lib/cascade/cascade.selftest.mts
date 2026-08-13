// Kaskadın xərcsiz selftesti — ADR-020 / ClickUp 86eykj7tu. LLM VƏ DB ÇAĞIRILMIR.
//
// Nəyi qıfıllayır (hər biri real, ölçülmüş riskdir):
//   1. `numericFingerprint` MƏNFİ işarəni saxlayır — bankın `QUAD.*` şablonları `-1,-2` kimi
//      mənfi əmsallardır; işarə atılsaydı `1,2` (kök cütü) ilə qarışardı.
//   2. `interpretTranscript` imtinanı həlldən AYIRIR və `candidates`-i YALNIZ
//      `multiple_problems`-də buraxır (ADR-007).
//   3. `stripAccept` `check.accept`-i ÇIXARIR (ADR-017 — cavab şəbəkəyə düşməməlidir).
//   4. `runCascade` sırayla gedir, `null` qaytaran qatı ATLAYIR, XƏTA verən qatda DAYANMIR.
//
// İşə salma: npx tsx web/lib/cascade/cascade.selftest.mts

import { numericFingerprint, canonicalHash, normalizeCanonical } from "./bank.ts";
import { interpretTranscript } from "./transcribe.ts";
import { stripAccept, buildStepAnswerRows } from "./solve-text.ts";
import { runCascade } from "./run.ts";
import type { CascadeContext, LayerSolution, SolveLayer } from "./types.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

// ── 1. numericFingerprint — DATA-MODEL.md formatı ────────────────────────────────────────
check("fingerprint: sadə tənlik", numericFingerprint("x^2-5x+6=0"), "2,-5,6,0");
check("fingerprint: mənfi əmsallar SAXLANILIR", numericFingerprint("x^2-x-2=0 kiçik kök"), "2,-2,0");
check("fingerprint: faiz məsələsi", numericFingerprint("300 ədədinin 5%-i neçədir?"), "300,5");
check("fingerprint: onluq kəsr", numericFingerprint("0.3 və 12.5 cəmi"), "0.3,12.5");
check("fingerprint: rəqəmsiz məsələ boş qaytarır", numericFingerprint("ifadəni sadələşdir"), "");

// `normalizeCanonical` sabitdirsə `canonicalHash` da sabitdir — hash-in ÖZ dəyəri deyil,
// BOŞLUQ/REGİSTR fərqinə həssas OLMAMASI qıfıllanır (dedup açarıdır).
check("normalize: boşluq və registr", normalizeCanonical("  X^2 - 5X  + 6 = 0 "), "x^2 - 5x + 6 = 0");
check(
  "hash: boşluq/registr fərqi EYNİ hash verir",
  canonicalHash("X^2 - 5X + 6 = 0") === canonicalHash("  x^2 -   5x + 6 = 0  "),
  true
);
check("hash: fərqli məsələ FƏRQLİ hash", canonicalHash("x^2-5x+6=0") === canonicalHash("x^2-5x+7=0"), false);

// ── 2. interpretTranscript ───────────────────────────────────────────────────────────────
check(
  "interpret: status yoxdursa 'ok' sayılır",
  interpretTranscript({
    canonical: "x^2-7x+6=0, kiçik kök",
    subject: "math",
    grade: 9,
    topic_code: "ALG.QUADRATIC_EQUATION",
    problem_type: "formula",
    ocr_confidence: "high",
    detected_language: "az",
  }),
  {
    transcript: {
      canonical: "x^2-7x+6=0, kiçik kök",
      subject: "math",
      grade: 9,
      topicCode: "ALG.QUADRATIC_EQUATION",
      problemType: "formula",
      ocrConfidence: "high",
      detectedLanguage: "az",
      hasFigure: false,
    },
  }
);

check(
  "interpret: has_figure true ötürülür (ADR-014 R1 ölçüsü)",
  (interpretTranscript({
    canonical: "ABC üçbucağı, AB=5, BC=12",
    subject: "math",
    grade: 8,
    topic_code: "GEO.AREA",
    has_figure: true,
  }) as { transcript: { hasFigure: boolean } }).transcript.hasFigure,
  true
);

check(
  "interpret: unreadable → imtina",
  interpretTranscript({ status: "unreadable", reason: "Şəkil bulanıqdır." }),
  { refusal: { status: "unreadable", reason: "Şəkil bulanıqdır." } }
);

check(
  "interpret: multiple_problems namizədləri SAXLAYIR",
  interpretTranscript({
    status: "multiple_problems",
    reason: "İki məsələ var.",
    candidates: [{ label: "14", preview: "x^2-5x+6=0" }],
  }),
  {
    refusal: {
      status: "multiple_problems",
      reason: "İki məsələ var.",
      candidates: [{ label: "14", preview: "x^2-5x+6=0" }],
    },
  }
);

check(
  "interpret: candidates YALNIZ multiple_problems-də — unreadable-da ATILIR",
  interpretTranscript({
    status: "unreadable",
    reason: "Bulanıq.",
    candidates: [{ label: "1", preview: "nəsə" }],
  }),
  { refusal: { status: "unreadable", reason: "Bulanıq." } }
);

check("interpret: naməlum status RƏDD (null)", interpretTranscript({ status: "weird", reason: "x" }), null);
check(
  "interpret: 'ok' amma canonical yoxdursa RƏDD",
  interpretTranscript({ status: "ok", subject: "math", grade: 9, topic_code: "ALG.X" }),
  null
);
check(
  "interpret: 'ok' amma topic_code yoxdursa RƏDD (Qat 2 açarı pozulur)",
  interpretTranscript({ canonical: "x=1", subject: "math", grade: 9 }),
  null
);

// ── 3. stripAccept / buildStepAnswerRows — ADR-017 cavab təcridi ─────────────────────────
const rawSteps = [
  { index: 1, title: "Bir", explanation: "izah", check: { ask: "neçədir?", accept: ["2", "−2"], input_kind: "number" } },
  { index: 2, title: "İki", explanation: "izah2", check: { ask: "yoxla", accept: ["0"], input_kind: "number" } },
];

check(
  "stripAccept: accept ÇIXARILIR, ask/input_kind QALIR",
  stripAccept(rawSteps),
  [
    { index: 1, title: "Bir", explanation: "izah", check: { ask: "neçədir?", input_kind: "number" } },
    { index: 2, title: "İki", explanation: "izah2", check: { ask: "yoxla", input_kind: "number" } },
  ]
);
check(
  "stripAccept: xam obyekt DƏYİŞMİR (mutasiya yoxdur — accept DB-yə lazımdır)",
  rawSteps[0].check.accept,
  ["2", "−2"]
);
check(
  "buildStepAnswerRows: store_step_answers formasi",
  buildStepAnswerRows(rawSteps),
  [
    { step_index: 1, accept: ["2", "−2"], input_kind: "number" },
    { step_index: 2, accept: ["0"], input_kind: "number" },
  ]
);
check(
  "buildStepAnswerRows: accept-siz və index-siz addımlar ATILIR",
  buildStepAnswerRows([
    { index: 1, check: { ask: "a" } },
    { check: { ask: "b", accept: ["1"] } },
    { index: 3, check: { ask: "c", accept: ["9"], input_kind: "expression" } },
  ]),
  [{ step_index: 3, accept: ["9"], input_kind: "expression" }]
);

// ── 4. runCascade — sıra, imtina, xəta davranışı ─────────────────────────────────────────
const ctx = {
  transcript: {
    canonical: "x=1",
    subject: "math",
    grade: 9,
    topicCode: "ALG.X",
    problemType: null,
    ocrConfidence: null,
    detectedLanguage: null,
    hasFigure: false,
  },
  locale: "az",
  requestedGrade: 9,
  requestedSubject: "math",
} satisfies CascadeContext;

function fakeSolution(layer: LayerSolution["layer"]): LayerSolution {
  return { layer, matchPath: "hash", questionId: "q-1", steps: [], verification: { verified: true, method: "sympy" }, costUsd: 0, latencyMs: 0, usage: null };
}

const declining: SolveLayer = { id: "bank_hash", run: async () => null };
const answering: SolveLayer = { id: "bank_fingerprint", run: async () => fakeSolution("bank_fingerprint") };
const throwing: SolveLayer = {
  id: "template",
  run: async () => {
    throw new Error("qəsdən xəta");
  },
};
const neverRun: SolveLayer = {
  id: "llm_text",
  run: async () => {
    fails++;
    console.log("FAIL  runCascade: cavab tapıldıqdan SONRA növbəti qat çağırıldı");
    return null;
  },
};

const r1 = await runCascade([declining, answering, neverRun], ctx);
check("runCascade: imtina edən qat atlanır, cavab verən dayandırır", [r1.solution?.layer, r1.declinedLayers], [
  "bank_fingerprint",
  ["bank_hash"],
]);

// Xəta kaskadı DAYANDIRMAMALIDIR — Qat 2-nin DB sorğusu qırılsa (grant regresiyası) şagird
// yenə həll almalıdır, sadəcə bahalı yolla.
const r2 = await runCascade([throwing, answering], ctx);
check("runCascade: xəta verən qat kaskadı dayandırmır", [r2.solution?.layer, r2.declinedLayers], [
  "bank_fingerprint",
  ["template:error"],
]);

const r3 = await runCascade([declining, throwing], ctx);
check("runCascade: heç bir qat cavab verməsə solution=null", [r3.solution, r3.declinedLayers], [
  null,
  ["bank_hash", "template:error"],
]);

console.log(fails === 0 ? "\nHAMISI KEÇDİ" : `\n${fails} TEST UĞURSUZ`);
process.exit(fails === 0 ? 0 : 1);
