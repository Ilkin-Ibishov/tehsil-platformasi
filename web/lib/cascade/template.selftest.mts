// Qat 3 (şablon) selftesti — ADR-021. LLM VƏ DB ÇAĞIRILMIR, tamamilə determinist.
//
// Nəyi qıfıllayır:
//   1. `solveLinear`/`parseQuadraticCoeffs`/`factorRoots` düzgün əmsal çıxarır VƏ
//      uyğunsuz/qeyri-tam hallarda `null` qaytarır (təxmin YOX — ADR-007 qaydası).
//   2. `makeTemplateLayer().run` yalnız 3 topic_code-u tanıyır, digərlərində (məs. `FAIZ.*`)
//      İMTİNA edir (Qat 5-ə düşməlidir) — ADR-021-in əhatə qərarı.
//   3. Hər addımın `error_code`-u `docs/STEP-SCHEMA.json`-un DƏYIŞMƏZ enum-undadır —
//      TRANSPOSE_SIGN/DIVISION/ROOT_SELECTION kimi 0038-in off-schema kodları BURAYA SIZMIR.
//
// İşə salma: npx tsx web/lib/cascade/template.selftest.mts

import { solveLinear, parseQuadraticCoeffs, factorRoots, makeTemplateLayer } from "./template.ts";
import type { CascadeContext } from "./types.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

// ── 1. solveLinear ───────────────────────────────────────────────────────────────────────
check("linear: 5x + 3 = 18", solveLinear("5x + 3 = 18"), { a: 5, b: 3, c: 18, x: 3 });
check("linear: mənfi əmsal, boşluqsuz", solveLinear("-2x-7=1"), { a: -2, b: -7, c: 1, x: -4 });
check("linear: b=0", solveLinear("4x=20"), { a: 4, b: 0, c: 20, x: 5 });
check("linear: 'x' tək başına → a=1", solveLinear("x + 3 = 10"), { a: 1, b: 3, c: 10, x: 7 });
check("linear: qeyri-tam nəticə → null (təxmin YOX)", solveLinear("3x + 2 = 10"), null);
check("linear: uyğunsuz format → null", solveLinear("3x + 1 > 10"), null);

// ── 2. parseQuadraticCoeffs ───────────────────────────────────────────────────────────────
check("quad: x^2-5x+6=0", parseQuadraticCoeffs("x^2-5x+6=0"), { b: -5, c: 6 });
check("quad: x^2+2x-3=0", parseQuadraticCoeffs("x^2+2x-3=0"), { b: 2, c: -3 });
check("quad: b=0 (x^2-4=0)", parseQuadraticCoeffs("x^2-4=0"), { b: 0, c: -4 });
check("quad: uyğunsuz format → null", parseQuadraticCoeffs("2x^2-5x+6=0"), null);

// ── 3. factorRoots ────────────────────────────────────────────────────────────────────────
check("factor: x^2-5x+6=0 → köklər 2,3", factorRoots(-5, 6), { r1: 2, r2: 3 });
check("factor: x^2+2x-3=0 → köklər -3,1", factorRoots(2, -3), { r1: -3, r2: 1 });
check("factor: faktorlaşmayan (irrasional) → null", factorRoots(-1, -1), null);

// ── 4. makeTemplateLayer — tam qat davranışı ─────────────────────────────────────────────
const layer = makeTemplateLayer();
check("layer id", layer.id, "template");

function ctx(topicCode: string, canonical: string): CascadeContext {
  return {
    transcript: {
      canonical,
      subject: "math",
      grade: 9,
      topicCode,
      problemType: "formula",
      ocrConfidence: "high",
      detectedLanguage: "az",
      hasFigure: false,
    },
    locale: "az",
    requestedGrade: 9,
    requestedSubject: "math",
  };
}

const STEP_SCHEMA_ERROR_CODES = new Set([
  "SIGN_LOST", "SQUARE_FORGOTTEN", "SIGN_CHOICE", "SUBSTITUTION_SKIPPED", "ARITHMETIC",
  "FACTOR_PAIR", "ORDER_OF_OPS", "FORMULA_MISAPPLIED", "COEFFICIENT_READ", "UNIT_MISMATCH",
  "TRANSCRIPTION",
]);

await (async () => {
  const linear = await layer.run(ctx("ALG.LINEAR_EQUATION", "5x + 3 = 18"));
  check("linear layer: matchPath", linear?.matchPath, "template");
  check("linear layer: final answer", linear && "newQuestion" in linear ? linear.newQuestion?.finalAnswer.values : null, ["3"]);
  const linearCodes = linear?.steps.map((s) => s.error_code) ?? [];
  check(
    "linear layer: BÜTÜN error_code-lar STEP-SCHEMA enum-undadır (0038-in off-schema kodları YOX)",
    linearCodes.every((c) => typeof c === "string" && STEP_SCHEMA_ERROR_CODES.has(c)),
    true
  );

  const quad = await layer.run(ctx("ALG.QUADRATIC_EQUATION", "x^2-5x+6=0"));
  check("quad layer: kiçik kök seçilir", quad && "newQuestion" in quad ? quad.newQuestion?.finalAnswer.values : null, ["2"]);
  const quadCodes = quad?.steps.map((s) => s.error_code) ?? [];
  check(
    "quad layer: BÜTÜN error_code-lar STEP-SCHEMA enum-undadır",
    quadCodes.every((c) => typeof c === "string" && STEP_SCHEMA_ERROR_CODES.has(c)),
    true
  );

  const vieta = await layer.run(ctx("ALG.VIETA_SUM", "x^2-5x+6=0"));
  check("vieta layer: cəm = -b", vieta && "newQuestion" in vieta ? vieta.newQuestion?.finalAnswer.values : null, ["5"]);

  const percentDeclined = await layer.run(ctx("FAIZ.PERCENT_OF", "40 ədədinin 10%-i neçədir?"));
  check("FAIZ.* — ADR-021-ə görə İMTİNA (Qat 5-ə düşür)", percentDeclined, null);

  const unrecognizedFormat = await layer.run(ctx("ALG.LINEAR_EQUATION", "3x + 2 = 10")); // qeyri-tam x
  check("qeyri-tam nəticəli tənlik — İMTİNA, təxmin YOX", unrecognizedFormat, null);

  const irrationalQuad = await layer.run(ctx("ALG.QUADRATIC_EQUATION", "x^2-x-1=0"));
  check("faktorlaşmayan kvadratik — İMTİNA", irrationalQuad, null);
})();

console.log(fails === 0 ? `\nHamısı keçdi.` : `\n${fails} test uğursuz.`);
process.exit(fails === 0 ? 0 : 1);
