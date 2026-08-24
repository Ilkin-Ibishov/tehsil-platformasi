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

// ── 4. ARITH.PERCENT_OF — "A ədədinin P%-i" / "A-nın P%-ni tapın" ────────────────────────────
function solvePercentOf(canonical: string): { a: number; p: number; result: number } | null {
  const norm = canonical.trim().toLowerCase().replace(/\s+/g, " ");
  const m = norm.match(/^(\d+)\s*(?:ədədinin|ədədin|-nin|-nın|-nun|-nün|-in|-ın|-un|-ün)?\s*(\d+)\s*(?:%|%-ni|%-i|%-in|faizini|faizi)/);
  if (!m) return null;
  const a = toInt(m[1]);
  const p = toInt(m[2]);
  if (a <= 0 || p <= 0 || !Number.isFinite(a) || !Number.isFinite(p)) return null;
  if ((a * p) % 100 !== 0) return null; // qeyri-tam nəticə — imtina
  return { a, p, result: (a * p) / 100 };
}

function buildPercentOfSolution(canonical: string): LayerSolution | null {
  const solved = solvePercentOf(canonical);
  if (!solved) return null;
  const { a, p, result } = solved;

  const parts = [
    makeStep(
      1,
      "Faiz düsturunu yaz",
      `N = \\frac{${num(a)} \\cdot ${num(p)}}{100}`,
      "Ədədin faizini tapmaq üçün ədədi faiz göstərən ədədə vurub 100-ə bölmək lazımdır.",
      "Faiz bütövün yüzdə bir hissəsidir, ona görə 100-ə bölürük.",
      "Ədədi faiz göstəricisinə vurub 100-ə böl.",
      "FORMULA_MISAPPLIED",
      "Düsturda məxrəc neçə olmalıdır?",
      "100"
    ),
    makeStep(
      2,
      "Ədədin faizini hesabla",
      `N = \\frac{${num(a * p)}}{100} = ${num(result)}`,
      "Surətdəki hasili tapıb 100-ə bölərək ədədin faizini müəyyən edirik.",
      "İxtisarları düzgün aparmaq böyük ədədlərlə hesablamanı asanlaşdırır.",
      `${num(a)} vur ${num(p)} hasilini tap və 100-ə böl.`,
      "ARITHMETIC",
      `${num(a)}-nın ${num(p)}%-i neçədir?`,
      num(result)
    ),
    makeStep(
      3,
      "Tərs nisbətlə yoxla",
      `\\frac{${num(result)}}{${num(a)}} \\cdot 100\\%`,
      "Tapılan ədədin ilkin ədədə nisbətini 100-ə vuraraq ilkin faizi almalıyıq.",
      "Tərs yoxlama ədədin düzgün tapıldığını təsdiqləyir.",
      `${num(result)} ədədini ${num(a)}-ya böl və 100-ə vur.`,
      "SUBSTITUTION_SKIPPED",
      `${num(result)} ədədi ${num(a)}-nın neçə faizidir?`,
      num(p)
    ),
  ];

  return assembleSolution(parts, { latex: `${num(result)}`, values: [num(result)] });
}

// ── 5. ARITH.NUMBER_FROM_PERCENT — "P%-i B olan ədədi tapın" ────────────────────────────────
function solveNumberFromPercent(canonical: string): { p: number; b: number; result: number } | null {
  const norm = canonical.trim().toLowerCase().replace(/\s+/g, " ");
  const m = norm.match(/(\d+)\s*(?:%|%-i|faizi)\s*(\d+)\s*olan\s*ədəd/);
  if (!m) return null;
  const p = toInt(m[1]);
  const b = toInt(m[2]);
  if (p <= 0 || b <= 0 || !Number.isFinite(p) || !Number.isFinite(b)) return null;
  if ((b * 100) % p !== 0) return null; // qeyri-tam nəticə — imtina
  return { p, b, result: (b * 100) / p };
}

function buildNumberFromPercentSolution(canonical: string): LayerSolution | null {
  const solved = solveNumberFromPercent(canonical);
  if (!solved) return null;
  const { p, b, result } = solved;

  const parts = [
    makeStep(
      1,
      "Faizinə görə ədəd düsturunu yaz",
      `A = \\frac{${num(b)} \\cdot 100}{${num(p)}}`,
      "Faizinə görə ədədi tapmaq üçün məlum ədədi 100-ə vurub faiz göstəricisinə bölürük.",
      "1%-i tapmaq üçün faizə bölürük, 100%-i tapmaq üçün 100-ə vururuq.",
      "Məlum ədədi 100-ə vurub faizə bölməlisən.",
      "FORMULA_MISAPPLIED",
      `1%-i tapmaq üçün ${num(b)} ədədini neçəyə bölməliyik?`,
      num(p)
    ),
    makeStep(
      2,
      "Ədədin özünü hesabla",
      `A = \\frac{${num(b * 100)}}{${num(p)}} = ${num(result)}`,
      "Məlum qiyməti 100-ə vurub faiz göstəricisinə bölərək tam ədədi alırıq.",
      "Bu əməliyyat ilkin 100% dəyərini bərpa edir.",
      `${num(b * 100)} ədədini ${num(p)}-yə böl.`,
      "ARITHMETIC",
      `${num(p)}%-i ${num(b)} olan ədəd neçədir?`,
      num(result)
    ),
    makeStep(
      3,
      "Yoxlama apar",
      `\\frac{${num(result)} \\cdot ${num(p)}}{100}`,
      "Tapılan ədədin göstərilən faizini hesablayıb şərtlə eyni alıb-almadığımızı yoxlayırıq.",
      "Düzgün tapılmış ədədin göstərilən faizi ilkin şərtlə eyni olmalıdır.",
      `${num(result)} ədədinin ${num(p)}%-ni hesabla.`,
      "SUBSTITUTION_SKIPPED",
      `${num(result)} ədədinin ${num(p)}%-i neçə edir?`,
      num(b)
    ),
  ];

  return assembleSolution(parts, { latex: `${num(result)}`, values: [num(result)] });
}

// ── 6. GEO.PYTHAGORAS_HYPOTENUSE — "Katetləri a və b olan düzbucaqlı üçbucağın hipotenuzu" ──
function solvePythagoras(canonical: string): { a: number; b: number; c: number } | null {
  const norm = canonical.trim().toLowerCase().replace(/\s+/g, " ");
  const m = norm.match(/katet[a-zəıiöüçşğ\-]*\s*(\d+)\s*(?:sm|m)?\s*(?:və|,|;)\s*(\d+)\s*(?:sm|m)?\s*(?:olan)?\s*düzbucaqlı\s*üçbucağın\s*hipotenuz/);
  if (!m) return null;
  const a = toInt(m[1]);
  const b = toInt(m[2]);
  if (a <= 0 || b <= 0 || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  const cSq = a * a + b * b;
  const c = Math.round(Math.sqrt(cSq));
  if (c * c !== cSq) return null; // irrasional kök — imtina
  return { a, b, c };
}

function buildPythagorasSolution(canonical: string): LayerSolution | null {
  const solved = solvePythagoras(canonical);
  if (!solved) return null;
  const { a, b, c } = solved;
  const cSq = a * a + b * b;

  const parts = [
    makeStep(
      1,
      "Katetlərin kvadratlarını cəmlə",
      `c^2 = ${num(a)}^2 + ${num(b)}^2 = ${num(a * a)} + ${num(b * b)} = ${num(cSq)}`,
      "Düzbucaqlı üçbucaqda hipotenuzun kvadratı katetlərin kvadratları cəminə bərabərdir.",
      "Pifaqor teoreminin əsas düsturudur.",
      `${num(a)}-nın kvadratı ilə ${num(b)}-nin kvadratını topla.`,
      "SQUARE_FORGOTTEN",
      "Katetlərin kvadratları cəmi (c^2) neçədir?",
      num(cSq)
    ),
    makeStep(
      2,
      "Kök alaraq hipotenuzu hesabla",
      `c = \\sqrt{${num(cSq)}} = ${num(c)}`,
      "Kvadratı verilən ədəd olan müsbət ədədi taparaq hipotenuzun uzunluğunu müəyyən edirik.",
      "Uzunluq mənfi ola bilməz, yalnız müsbət kök götürülür.",
      `${num(cSq)} ədədindən kvadrat kök al.`,
      "ARITHMETIC",
      "Hipotenuzun uzunluğu (c) neçədir?",
      num(c)
    ),
    makeStep(
      3,
      "Pifaqor eyniliyini yoxla",
      `${num(c)}^2 - ${num(a)}^2`,
      "Hipotenuzun kvadratından katetlərdən birinin kvadratını çıxıb digərini alırıq.",
      "Tərəflərin üçbucağın həndəsi xassəsini ödədiyini yoxlayırıq.",
      `${num(c * c)}-dən ${num(a * a)} çıx.`,
      "SUBSTITUTION_SKIPPED",
      `${num(c)}^2 - ${num(a)}^2 fərqi neçədir?`,
      num(b * b)
    ),
  ];

  return assembleSolution(parts, { latex: `c = ${num(c)}`, values: [num(c)] });
}

// ── 7. GEO.RECTANGLE_AREA_PERIMETER — "Tərəfləri a və b olan düzbucaqlının sahəsi" ─────────
function solveRectangle(canonical: string): { a: number; b: number; area: number; perimeter: number } | null {
  const norm = canonical.trim().toLowerCase().replace(/\s+/g, " ");
  const m = norm.match(/(?:tərəfləri|eni|ölçüləri)\s*(\d+)\s*(?:sm|m)?\s*(?:və|,|;)\s*(?:uzunluğu\s*)?(\d+)\s*(?:sm|m)?\s*(?:olan)?\s*düzbucaqlının\s*sahə/);
  if (!m) return null;
  const a = toInt(m[1]);
  const b = toInt(m[2]);
  if (a <= 0 || b <= 0 || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { a, b, area: a * b, perimeter: 2 * (a + b) };
}

function buildRectangleSolution(canonical: string): LayerSolution | null {
  const solved = solveRectangle(canonical);
  if (!solved) return null;
  const { a, b, area, perimeter } = solved;

  const parts = [
    makeStep(
      1,
      "Düzbucaqlının sahə düsturunu yaz",
      `S = a \\cdot b = ${num(a)} \\cdot ${num(b)} = ${num(area)}`,
      "Düzbucaqlının sahəsi onun eni ilə uzunluğunun hasilinə bərabərdir.",
      "Sahə vahid kvadratların sayını göstərir.",
      "Tərəfləri bir-birinə vurmalısan.",
      "FORMULA_MISAPPLIED",
      `Eni ${num(a)} və uzunluğu ${num(b)} olan düzbucaqlının sahəsi neçədir?`,
      num(area)
    ),
    makeStep(
      2,
      "Perimetri hesabla",
      `P = 2(a + b) = 2(${num(a)} + ${num(b)}) = ${num(perimeter)}`,
      "Düzbucaqlının perimetri bütün dörd tərəfinin cəminə bərabərdir.",
      "Perimetr qapalı fiqurun kənar xətlərinin ümumi uzunluğudur.",
      `${num(a)} ilə ${num(b)}-ni toplayıb 2-yə vur.`,
      "ARITHMETIC",
      "Bu düzbucaqlının perimetri (P) neçədir?",
      num(perimeter)
    ),
    makeStep(
      3,
      "Tərəfi sahə ilə bölərək yoxla",
      `b = \\frac{S}{a} = \\frac{${num(area)}}{${num(a)}}`,
      "Sahəni verilən bir tərəfə bölərək digər tərəfin alındığını yoxlayırıq.",
      "Vurma və bölmənin qarşılıqlı tərsliyini yoxlayırıq.",
      `${num(area)} ədədini ${num(a)}-ya böl.`,
      "SUBSTITUTION_SKIPPED",
      `${num(area)} bölünsün ${num(a)} neçə edir?`,
      num(b)
    ),
  ];

  return assembleSolution(parts, { latex: `S = ${num(area)}`, values: [num(area)] });
}

// ── 8. ALG.ARITHMETIC_PROGRESSION_NTH — "a_1 = a1, d = d olan ədədi silsilənin n-ci həddi" ─
function solveArithmeticProgression(canonical: string): { a1: number; d: number; n: number; an: number } | null {
  const norm = canonical.trim().toLowerCase().replace(/\s+/g, " ");
  let a1: number;
  let d: number;
  let n: number;

  const m1 = norm.match(/a_?1\s*=\s*(-?\d+)[,;]?\s*d\s*=\s*(-?\d+)\s*(?:olan)?\s*(?:ədədi\s*silsilənin)?\s*(\d+)-?[a-zəıiöüçşğ]*\s*hədd/);
  if (m1) {
    a1 = toInt(m1[1]);
    d = toInt(m1[2]);
    n = toInt(m1[3]);
  } else {
    const m2 = norm.match(/birinci\s*həddi\s*(-?\d+)[,;]?\s*(?:silsilə\s*)?fərqi\s*(-?\d+)\s*(?:olan)?\s*(?:ədədi\s*silsilənin)?\s*(\d+)-?[a-zəıiöüçşğ]*\s*hədd/);
    if (!m2) return null;
    a1 = toInt(m2[1]);
    d = toInt(m2[2]);
    n = toInt(m2[3]);
  }

  if (n < 2 || !Number.isFinite(a1) || !Number.isFinite(d) || !Number.isFinite(n)) return null;
  return { a1, d, n, an: a1 + (n - 1) * d };
}

function buildArithmeticProgressionSolution(canonical: string): LayerSolution | null {
  const solved = solveArithmeticProgression(canonical);
  if (!solved) return null;
  const { a1, d, n, an } = solved;

  const parts = [
    makeStep(
      1,
      "Ədədi silsilənin n-ci hədd düsturunu yaz",
      "a_n = a_1 + (n - 1)d",
      "Hər sonrakı hədd əvvəlkinin üzərinə silsilə fərqi (d) əlavə edilməklə alınır.",
      "n-ci həddə çatmaq üçün birinci həddin üzərinə (n-1) dəfə fərq gəlinir.",
      "n-1 vuruğunu tapmalısan.",
      "FORMULA_MISAPPLIED",
      `${num(n)}-ci hədd üçün (n-1) vuruğu neçəyə bərabərdir?`,
      num(n - 1)
    ),
    makeStep(
      2,
      "n-ci həddin qiymətini hesabla",
      `a_{${num(n)}} = ${num(a1)} + (${num(n)} - 1) \\cdot (${num(d)}) = ${num(an)}`,
      "Düsturda verilənləri yerinə qoyaraq əməllər sırasına uyğun hesablayırıq.",
      "Əvvəlcə vurma, sonra toplama əməli yerinə yetirilir.",
      `(${num(n - 1)}) vur (${num(d)}) hasilini tap və üzərinə ${num(a1)} gəl.`,
      "ORDER_OF_OPS",
      `a_{${num(n)}} həddi neçədir?`,
      num(an)
    ),
    makeStep(
      3,
      "Fərqi çıxaraq yoxla",
      `a_{${num(n)}} - a_1 = (n - 1)d`,
      "Sonuncu hədd ilə birinci həddin fərqinin (n-1)d hasilinə bərabər olduğunu yoxlayırıq.",
      "Silsilənin artım addımının doğruluğunu təsdiqləyir.",
      `${num(an)} ədədindən ${num(a1)} çıx.`,
      "SUBSTITUTION_SKIPPED",
      `a_{${num(n)}} - a_1 fərqi neçədir?`,
      num((n - 1) * d)
    ),
  ];

  return assembleSolution(parts, { latex: `a_{${num(n)}} = ${num(an)}`, values: [num(an)] });
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
        case "ARITH.PERCENT_OF":
        case "FAIZ.PERCENT_OF":
          return buildPercentOfSolution(canonical) || buildNumberFromPercentSolution(canonical);
        case "ARITH.NUMBER_FROM_PERCENT":
        case "ARITH.PERCENTAGE":
          return buildNumberFromPercentSolution(canonical) || buildPercentOfSolution(canonical);
        case "GEO.PYTHAGORAS_HYPOTENUSE":
        case "GEOM.TRIANGLE_RIGHT":
        case "GEOM.PYTHAGOREAN_TRIPLE":
          return buildPythagorasSolution(canonical);
        case "GEO.RECTANGLE_AREA_PERIMETER":
        case "GEOM.RECTANGLE_AREA":
        case "GEOM.RECTANGLE":
          return buildRectangleSolution(canonical);
        case "ALG.ARITHMETIC_PROGRESSION_NTH":
        case "ALG.ARITHMETIC_SEQUENCE":
          return buildArithmeticProgressionSolution(canonical);
        default:
          return null;
      }
    },
  };
}

// Selftestin daxili funksiyalara birbaşa çatması üçün ixrac olunur (LLM/DB olmadan).
export {
  solveLinear,
  parseQuadraticCoeffs,
  factorRoots,
  solvePercentOf,
  solveNumberFromPercent,
  solvePythagoras,
  solveRectangle,
  solveArithmeticProgression,
};

