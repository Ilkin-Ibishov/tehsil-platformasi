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

import {
  solveLinear,
  parseQuadraticCoeffs,
  factorRoots,
  solvePercentOf,
  solveNumberFromPercent,
  solvePythagoras,
  solveRectangle,
  solveArithmeticProgression,
  makeTemplateLayer,
} from "./template.ts";
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

// ── 4. solvePercentOf ─────────────────────────────────────────────────────────────────────
check("percent_of: 40 ədədinin 20%-i", solvePercentOf("40 ədədinin 20%-i"), { a: 40, p: 20, result: 8 });
check("percent_of: 200-ün 15%-ni tapın", solvePercentOf("200-ün 15%-ni tapın"), { a: 200, p: 15, result: 30 });
check("percent_of: qeyri-tam faiz (43-ün 15%-i) → null", solvePercentOf("43 ədədinin 15%-i"), null);

// ── 5. solveNumberFromPercent ─────────────────────────────────────────────────────────────
check("number_from_percent: 20%-i 40 olan ədədi tapın", solveNumberFromPercent("20%-i 40 olan ədədi tapın"), { p: 20, b: 40, result: 200 });
check("number_from_percent: 15 faizi 45-dir", solveNumberFromPercent("15 faizi 45 olan ədəd"), { p: 15, b: 45, result: 300 });
check("number_from_percent: qeyri-tam nəticə → null", solveNumberFromPercent("30%-i 25 olan ədəd"), null);

// ── 6. solvePythagoras ────────────────────────────────────────────────────────────────────
check("pythagoras: katetləri 3 və 4 olan düzbucaqlı üçbucağın hipotenuzu", solvePythagoras("katetləri 3 və 4 olan düzbucaqlı üçbucağın hipotenuzunu tapın"), { a: 3, b: 4, c: 5 });
check("pythagoras: katetləri 5 sm, 12 sm olan hipotenuz", solvePythagoras("katetləri 5 sm və 12 sm olan düzbucaqlı üçbucağın hipotenuzu"), { a: 5, b: 12, c: 13 });
check("pythagoras: irrasional hipotenuz (3 və 5) → null", solvePythagoras("katetləri 3 və 5 olan düzbucaqlı üçbucağın hipotenuzu"), null);

// ── 7. solveRectangle ─────────────────────────────────────────────────────────────────────
check("rectangle: tərəfləri 6 və 8 olan düzbucaqlının sahəsi", solveRectangle("tərəfləri 6 və 8 olan düzbucaqlının sahəsini tapın"), { a: 6, b: 8, area: 48, perimeter: 28 });
check("rectangle: eni 5 sm, uzunluğu 10 sm olan sahə", solveRectangle("eni 5 sm və uzunluğu 10 sm olan düzbucaqlının sahəsi"), { a: 5, b: 10, area: 50, perimeter: 30 });

// ── 8. solveArithmeticProgression ─────────────────────────────────────────────────────────
check("ap: a_1 = 3, d = 4 olan ədədi silsilənin 10-cu həddi", solveArithmeticProgression("a_1 = 3, d = 4 olan ədədi silsilənin 10-cu həddini tapın"), { a1: 3, d: 4, n: 10, an: 39 });
check("ap: birinci həddi 5, fərqi -2 olan 6-cı hədd", solveArithmeticProgression("birinci həddi 5, fərqi -2 olan ədədi silsilənin 6-cı həddini tapın"), { a1: 5, d: -2, n: 6, an: -5 });
check("ap: n < 2 → null", solveArithmeticProgression("a_1 = 3, d = 4 olan ədədi silsilənin 1-ci həddi"), null);

// ── 9. makeTemplateLayer — tam qat davranışı ─────────────────────────────────────────────
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

  const percentOf = await layer.run(ctx("ARITH.PERCENT_OF", "40 ədədinin 20%-i"));
  check("percent_of layer: cavab 8", percentOf && "newQuestion" in percentOf ? percentOf.newQuestion?.finalAnswer.values : null, ["8"]);
  const percentCodes = percentOf?.steps.map((s) => s.error_code) ?? [];
  check(
    "percent_of layer: BÜTÜN error_code-lar STEP-SCHEMA enum-undadır",
    percentCodes.every((c) => typeof c === "string" && STEP_SCHEMA_ERROR_CODES.has(c)),
    true
  );

  const numFromPercent = await layer.run(ctx("ARITH.NUMBER_FROM_PERCENT", "20%-i 40 olan ədədi tapın"));
  check("num_from_percent layer: cavab 200", numFromPercent && "newQuestion" in numFromPercent ? numFromPercent.newQuestion?.finalAnswer.values : null, ["200"]);

  const pythagoras = await layer.run(ctx("GEO.PYTHAGORAS_HYPOTENUSE", "katetləri 3 və 4 olan düzbucaqlı üçbucağın hipotenuzunu tapın"));
  check("pythagoras layer: hipotenuz 5", pythagoras && "newQuestion" in pythagoras ? pythagoras.newQuestion?.finalAnswer.values : null, ["5"]);

  const rectangle = await layer.run(ctx("GEO.RECTANGLE_AREA_PERIMETER", "tərəfləri 6 və 8 olan düzbucaqlının sahəsini tapın"));
  check("rectangle layer: sahə 48", rectangle && "newQuestion" in rectangle ? rectangle.newQuestion?.finalAnswer.values : null, ["48"]);

  const ap = await layer.run(ctx("ALG.ARITHMETIC_PROGRESSION_NTH", "a_1 = 3, d = 4 olan ədədi silsilənin 10-cu həddini tapın"));
  check("ap layer: a_10 = 39", ap && "newQuestion" in ap ? ap.newQuestion?.finalAnswer.values : null, ["39"]);

  const unrecognizedFormat = await layer.run(ctx("ALG.LINEAR_EQUATION", "3x + 2 = 10")); // qeyri-tam x
  check("qeyri-tam nəticəli tənlik — İMTİNA, təxmin YOX", unrecognizedFormat, null);

  const irrationalQuad = await layer.run(ctx("ALG.QUADRATIC_EQUATION", "x^2-x-1=0"));
  check("faktorlaşmayan kvadratik — İMTİNA", irrationalQuad, null);
})();

console.log(fails === 0 ? `\nHamısı keçdi.` : `\n${fails} test uğursuz.`);
process.exit(fails === 0 ? 0 : 1);
