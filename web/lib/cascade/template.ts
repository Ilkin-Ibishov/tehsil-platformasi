// Kaskad Qat 3 — ŞABLONA OTURUR? (ADR-021). LLM ÇAĞIRILMIR, xərc SIFIR.
//
// `0038` miqrasiyası bu 5 mövzu kodu üçün SQL-də şablon YARATMIŞDI (birdəfəlik backfill,
// bankın öz sualları üçün, `v1|v2|v3` sabit generasiya formatından oxuyaraq). BU MODUL EYNİ
// ŞEY DEYİL — canlı Qat 1 çıxışı (`docs/TRANSCRIBE-SCHEMA.json`) sərbəst ASCII-math-dır,
// pipe-format YOXDUR. Tanıma REGEX-lə canonical-ın ÖZÜNDƏN aparılır.
//
// ADR-021-ə görə YALNIZ TƏMİZ TƏNLİK sinifi (3 topic_code) əhatə olunur — mətn-məsələsi
// sinfi (`FAIZ.*`) qəsdən KƏNARDA saxlanılıb (sərbəst-mətn ədəd-yerləşdirməsi ölçülmədən
// yazılmır, ADR-021 §"Qərar 1"). Regex uyğun gəlmirsə (gözlənilməz format, kəsr əmsal,
// faktorlaşmayan kvadratik) → `null`, Qat 5-ə (LLM) düşür. HEÇ VAXT TƏXMİN EDİLMİR —
// `ADR-007`-in "şübhəli isə imtina, təxmin bahalıdır" qaydası.
//
// `error_code` remapping (ADR-021-in tapıntısı, ClickUp 86eymfgd9-u təsdiqləyir): `0038`-in
// istifadə etdiyi `TRANSPOSE_SIGN`/`DIVISION`/`ROOT_SELECTION` `docs/STEP-SCHEMA.json`-un
// DƏYIŞMƏZ enum-unda YOXDUR (Cowork sahibliyi, CLAUDE.md). Bura yalnız MÖVCUD enum
// dəyərləri yazılır: TRANSPOSE_SIGN→SIGN_LOST, DIVISION→ARITHMETIC, ROOT_SELECTION→FACTOR_PAIR.

import type { CascadeContext, FinalAnswer, LayerSolution, PublicStep, RawStep, SolveLayer, StepAnswerRow } from "./types";

// ── Kömekçi: regex uyğunluğundan tam ədəd çıxarır, boşluqları atır ──────────────────────────
function toInt(raw: string | undefined): number {
  return parseInt((raw ?? "").replace(/\s+/g, ""), 10);
}

// ── ALG.LINEAR_EQUATION — "ax + b = c" (b işarəli, opsional) ────────────────────────────────
const LINEAR_RE = /^(-?\d*)x\s*([+-]\s*\d+)?\s*=\s*(-?\d+)\s*$/;

function solveLinear(canonical: string): { a: number; b: number; c: number; x: number } | null {
  const m = LINEAR_RE.exec(canonical.trim());
  if (!m) return null;
  const aRaw = m[1];
  const a = aRaw === "" || aRaw === "-" ? (aRaw === "-" ? -1 : 1) : toInt(aRaw);
  const b = m[2] ? toInt(m[2]) : 0;
  const c = toInt(m[3]);
  if (a === 0 || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return null;
  const numerator = c - b;
  if (numerator % a !== 0) return null; // qeyri-tam nəticə — imtina, təxmin yox
  return { a, b, c, x: numerator / a };
}

// ── ALG.QUADRATIC_EQUATION / ALG.VIETA_SUM — "x^2 + bx + c = 0" ─────────────────────────────
const QUADRATIC_RE = /^x\^2\s*(?:([+-]\s*\d+)x)?\s*([+-]\s*\d+)?\s*=\s*0\s*$/;

function parseQuadraticCoeffs(canonical: string): { b: number; c: number } | null {
  const m = QUADRATIC_RE.exec(canonical.trim());
  if (!m) return null;
  const b = m[1] ? toInt(m[1]) : 0;
  const c = m[2] ? toInt(m[2]) : 0;
  if (!Number.isFinite(b) || !Number.isFinite(c)) return null;
  return { b, c };
}

// Tam ədəd kök cütü axtarır: r1+r2 = -b, r1*r2 = c. Tapılmasa `null` — kvadrat düstura
// keçmirik (kəsr/irrasional kök halında şagirdə göstəriləcək "təmiz" addım yoxdur).
const ROOT_SEARCH_RANGE = 200;
function factorRoots(b: number, c: number): { r1: number; r2: number } | null {
  const targetSum = -b;
  for (let r1 = -ROOT_SEARCH_RANGE; r1 <= ROOT_SEARCH_RANGE; r1++) {
    const r2 = targetSum - r1;
    if (r1 * r2 === c) return { r1, r2: Math.round(r2) };
  }
  return null;
}

function num(n: number): string {
  return String(n);
}

function makeStep(
  index: number,
  title: string,
  latex: string,
  explanation: string,
  why: string,
  hint: string,
  errorCode: string,
  ask: string,
  accept: string
): { step: PublicStep; raw: RawStep; answer: StepAnswerRow } {
  const check = { ask, input_kind: "number" };
  const step: PublicStep = { index, title, explanation, latex, error_code: errorCode, hint, why, check };
  const raw: RawStep = { ...step, check: { ...check, accept: [accept] } };
  const answer: StepAnswerRow = { step_index: index, accept: [accept], input_kind: "number" };
  return { step, raw, answer };
}

function assembleSolution(
  parts: { step: PublicStep; raw: RawStep; answer: StepAnswerRow }[],
  finalAnswer: FinalAnswer
): LayerSolution {
  return {
    layer: "template",
    matchPath: "template", // bax types.ts qeydi — Cowork təsdiqi gözləyir (ADR-021)
    steps: parts.map((p) => p.step),
    newQuestion: {
      finalAnswer,
      stepAnswerRows: parts.map((p) => p.answer),
      rawSteps: parts.map((p) => p.raw),
      model: null, // ADR-023: bu qat LLM ÇAĞIRMIR — model adı yazmaq YANLIŞ olardı
    },
    costUsd: 0,
    latencyMs: 0,
    usage: null,
  };
}

function buildLinearSolution(canonical: string): LayerSolution | null {
  const solved = solveLinear(canonical);
  if (!solved) return null;
  const { a, b, c, x } = solved;
  const rhsAfterTranspose = c - b;
  const bTerm = b === 0 ? "" : b > 0 ? ` + ${num(b)}` : ` - ${num(Math.abs(b))}`;

  const parts = [
    makeStep(
      1,
      "Sərbəst həddi digər tərəfə keçir",
      `${num(a)}x = ${num(rhsAfterTranspose)}`,
      "Hər iki tərəfdən eyni ədədi çıxsaq (və ya əlavə etsək) bərabərlik pozulmur.",
      "Məqsəd x-i tək qoymaqdır; ona görə əvvəlcə yanındakı sərbəst həddi aradan qaldırırıq.",
      `Hər iki tərəfdən ${b >= 0 ? num(b) : `(${num(b)})`} çıx.`,
      "SIGN_LOST",
      `Sağ tərəf sadələşdikdən sonra ${num(a)}x nəyə bərabər olur?`,
      num(rhsAfterTranspose)
    ),
    makeStep(
      2,
      "Əmsala böl",
      `x = \\frac{${num(rhsAfterTranspose)}}{${num(a)}}`,
      "x-in əmsalına bölərək x-in özünü tapırıq.",
      "Vurma ilə bölmə tərs əməllərdir — əmsalı yalnız bölmə ilə aradan qaldırmaq olar.",
      `${num(rhsAfterTranspose)} ədədini ${num(a)}-ə böl.`,
      "ARITHMETIC",
      "x neçəyə bərabərdir?",
      num(x)
    ),
    makeStep(
      3,
      "Yoxla",
      `${num(a)} \\cdot (${num(x)})${bTerm}`,
      "Tapılan x-i ilkin tənlikdə yerinə qoyub sol tərəfi hesablayırıq.",
      "Yoxlama işarə və hesablama səhvlərini dərhal üzə çıxarır.",
      `x = ${num(x)} qiymətini tənlikdə yerinə qoy.`,
      "SUBSTITUTION_SKIPPED",
      `x = ${num(x)} olduqda sol tərəf neçə olur?`,
      num(c)
    ),
  ];

  return assembleSolution(parts, { latex: `x = ${num(x)}`, values: [num(x)] });
}

function buildQuadraticSolution(canonical: string): LayerSolution | null {
  const coeffs = parseQuadraticCoeffs(canonical);
  if (!coeffs) return null;
  const roots = factorRoots(coeffs.b, coeffs.c);
  if (!roots) return null;
  const { r1, r2 } = roots;
  const small = Math.min(r1, r2);
  const large = Math.max(r1, r2);
  const bTerm = coeffs.b === 0 ? "" : coeffs.b > 0 ? ` + ${num(coeffs.b)}x` : ` - ${num(Math.abs(coeffs.b))}x`;

  const parts = [
    makeStep(
      1,
      "Köklərin hasilini oxu",
      "x_1 \\cdot x_2 = c",
      "Vyet teoreminə görə x^2+bx+c=0 tənliyində köklərin hasili c-yə bərabərdir.",
      "Hasil və cəmi bilsək, kökləri diskriminantsız seçmək olar.",
      "Sərbəst həddə bax.",
      "COEFFICIENT_READ",
      "Köklərin hasili neçədir?",
      num(coeffs.c)
    ),
    makeStep(
      2,
      "Köklərin cəmini oxu",
      "x_1 + x_2 = -b",
      "Vyet teoreminə görə köklərin cəmi b əmsalının əks işarəlisidir.",
      "İşarəni unutmaq bu addımda ən çox rast gəlinən səhvdir.",
      "x-in əmsalını götür və işarəsini dəyiş.",
      "SIGN_CHOICE",
      "Köklərin cəmi neçədir?",
      num(-coeffs.b)
    ),
    makeStep(
      3,
      "Kökləri tap və kiçiyini seç",
      `x_1 = ${num(small)},\\ x_2 = ${num(large)}`,
      "Hasili və cəmi ödəyən iki tam ədədi tapıb kiçiyini seçirik.",
      "Məsələdə hər iki kök deyil, konkret olaraq kiçik kök soruşulur.",
      `Hasili ${num(coeffs.c)}, cəmi ${num(-coeffs.b)} olan iki ədədi tap.`,
      "FACTOR_PAIR",
      "Kiçik kök neçədir?",
      num(small)
    ),
    makeStep(
      4,
      "Yoxla",
      `x^2${bTerm} + ${num(coeffs.c)} = 0`,
      "Tapılan kökü tənlikdə yerinə qoyduqda nəticə sıfır olmalıdır.",
      "Sıfır alınmırsa, kök səhvdir — bu, ən etibarlı özünüyoxlamadır.",
      "Kiçik kökü tənlikdə yerinə qoy və hesabla.",
      "SUBSTITUTION_SKIPPED",
      "Kiçik kökü tənlikdə yerinə qoysaq nəticə neçə olar?",
      "0"
    ),
  ];

  return assembleSolution(parts, { latex: `x = ${num(small)}`, values: [num(small)] });
}

function buildVietaSumSolution(canonical: string): LayerSolution | null {
  const coeffs = parseQuadraticCoeffs(canonical);
  if (!coeffs) return null;
  // Cəmi (-b) bilmək üçün faktorlaşma ŞƏRT DEYİL, amma 3-cü addım ("tapıb yoxla") real
  // köklər tələb edir — faktorlaşmırsa yoxlama addımı MƏNASIZ olar, ona görə imtina.
  const roots = factorRoots(coeffs.b, coeffs.c);
  if (!roots) return null;
  const { r1, r2 } = roots;
  const sum = -coeffs.b;

  const parts = [
    makeStep(
      1,
      "x-in əmsalını oxu",
      `b = ${num(coeffs.b)}`,
      "Tənliyi x^2+bx+c=0 şəklində yazıb b əmsalını müəyyən edirik.",
      "Vyet düsturu birbaşa əmsallarla işləyir, kökləri tapmağa ehtiyac yoxdur.",
      "x-in qarşısındakı ədədi işarəsi ilə birlikdə götür.",
      "COEFFICIENT_READ",
      "b əmsalı neçədir?",
      num(coeffs.b)
    ),
    makeStep(
      2,
      "Vyet düsturunu tətbiq et",
      "x_1 + x_2 = -\\frac{b}{a}",
      "a=1 olduğuna görə köklərin cəmi sadəcə -b-yə bərabərdir.",
      "Bu düstur kökləri hesablamadan cəmi tapmağa imkan verir — vaxta qənaətdir.",
      "b-nin işarəsini dəyiş.",
      "FORMULA_MISAPPLIED",
      "Köklərin cəmi neçədir?",
      num(sum)
    ),
    makeStep(
      3,
      "Kökləri taparaq yoxla",
      `x_1 = ${num(r1)},\\ x_2 = ${num(r2)}`,
      "Kökləri tapıb cəmləyirik və düsturla alınan nəticə ilə müqayisə edirik.",
      "İki müxtəlif yolla eyni nəticəni almaq düsturu doğru tətbiq etdiyini təsdiqləyir.",
      `Hasili ${num(coeffs.c)} olan iki ədədi tap və cəmlə.`,
      "SUBSTITUTION_SKIPPED",
      "Kökləri tapıb cəmləsən nəticə neçədir?",
      num(sum)
    ),
  ];

  return assembleSolution(parts, { latex: `x_1+x_2 = ${num(sum)}`, values: [num(sum)] });
}

export function makeTemplateLayer(): SolveLayer {
  return {
    id: "template",
    async run(ctx: CascadeContext): Promise<LayerSolution | null> {
      const canonical = ctx.transcript.canonical;
      switch (ctx.transcript.topicCode) {
        case "ALG.LINEAR_EQUATION":
          return buildLinearSolution(canonical);
        case "ALG.QUADRATIC_EQUATION":
          return buildQuadraticSolution(canonical);
        case "ALG.VIETA_SUM":
          return buildVietaSumSolution(canonical);
        default:
          // FAIZ.* və digər mövzular ADR-021-ə görə QƏSDƏN kənarda — Qat 5-ə (LLM) düşür.
          return null;
      }
    },
  };
}

// Selftestin daxili funksiyalara birbaşa çatması üçün ixrac olunur (LLM/DB olmadan).
export { solveLinear, parseQuadraticCoeffs, factorRoots };
