// `final_answer.values`-in ədədi yoxlanışı. scripts/lib/verify.py-ın YALNIZ istehsalat yolunun
// portu (ADR-012) — `direct_compare` (golden-əsaslı, yalnız eval-da mövcuddur) köçürülmədi,
// istehsalatda `golden_values` heç vaxt yoxdur.
//
// sympy → mathjs: sympy.simplify tam simvolik idi, amma yekun yoxlama HƏMİŞƏ ədədidir
// (residual.is_number → abs(complex(residual)) < 1e-6). Simvolu ədədi qiymətlə əvəz edib
// ədədi hesablamaq eyni nəticəni verir — CAS lazım deyil (ADR-012, "Bilinən fərq" bölməsi).
//
// E1.2 (86eyncj7k): tək-dəyişənli tənlikdən əlavə (a) canonical-dakı məlum dəyişən
// qiymətlərini yerinə qoyub çoxdəyişənlini tək-dəyişənliyə endirmək, (b) tənlik çıxmasa da
// ədədi ifadini qiymətləndirmək. Yeni yollar YALNIZ `true`/`null` qaytarır — `false` gizlədir
// və "yeni gizlətmə yoxdur" qəbul şərtini pozardı. Köhnə tək-dəyişənli yol hələ `false` verir.

import { evaluate, subtract, abs as mAbs } from "mathjs";

const LATEX_SEGMENT_RE = /\$(.+?)\$/g;
// ADR-015: `web/lib/math-format.ts` (GÖSTƏRMƏK üçün, əks istiqamətdə) bu İKİ patterni idxal
// edir ki, LaTeX konstruksiyalarının tanınma cədvəli TƏKRARLANMASIN — burada YOXLAMAQ üçün
// təmizlənir, orada UNICODE-a çevrilir, amma "bu, `\frac{a}{b}` formasıdır" tanınması eynidir.
export const LATEX_FRAC_RE = /\\frac\{([^{}]*)\}\{([^{}]*)\}/g;
export const LATEX_SQRT_RE = /\\sqrt\{([^{}]*)\}/g;

export type VerificationReason = "no_equation_extracted" | "no_single_variable_equation" | null;
export type VerificationMethod = "mathjs_equation" | "mathjs_unit" | "human" | "none";

function insertImplicitMultiplication(text: string): string {
  let out = text;
  out = out.replace(/(\d)(?=[a-zA-Z(])/g, "$1*");
  out = out.replace(/\)(?=[a-zA-Z0-9(])/g, ")*");
  return out;
}

function insertLetterTimes(text: string): string {
  return text.replace(/[a-zA-Z]{2,}/g, (word) => {
    if (KNOWN_NAMES.has(word.toLowerCase())) return word;
    if (word.length === 2) return `${word[0]}*${word[1]}`;
    return word;
  });
}

function normalizeEq(raw: string): string {
  return insertLetterTimes(normalize(raw));
}

const LOG_BASE_RE = /\blog_?(\d+)\(/g;

function convertLogBase(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    LOG_BASE_RE.lastIndex = i;
    const m = LOG_BASE_RE.exec(text);
    if (!m || m.index !== i) {
      result += text[i];
      i += 1;
      continue;
    }
    const base = m[1];
    let j = m.index + m[0].length;
    let depth = 1;
    while (j < text.length && depth > 0) {
      if (text[j] === "(") depth += 1;
      else if (text[j] === ")") depth -= 1;
      j += 1;
    }
    const arg = text.slice(m.index + m[0].length, j - 1);
    result += `log(${arg},${base})`;
    i = j;
  }
  return result;
}

function normalize(raw: string): string {
  let text = raw.trim().toLocaleLowerCase("az");
  text = text.replace(/\\ /g, " ");
  text = text.replace(/\s+/g, "");
  text = text.replace(/−/g, "-");
  text = text.replace(/·/g, "*");
  text = text.replace(/÷/g, "/");
  text = text.replace(LATEX_FRAC_RE, "($1)/($2)");
  text = text.replace(LATEX_SQRT_RE, "sqrt($1)");
  // Unicode kök və qüvvətlərin mathjs üçün normallaşdırılması (mobil riyaziyyat çipləri):
  text = text.replace(/√\s*(\d+|\([a-zA-Z0-9.+/*-]+\)|[a-zA-Z])/g, "sqrt($1)");
  text = text.replace(/√\{([^}]+)\}/g, "sqrt($1)");
  text = text.replace(/²/g, "^2");
  text = text.replace(/³/g, "^3");
  text = text.replace(/⁴/g, "^4");
  text = text.replace(/⁵/g, "^5");
  text = text.replace(/π/g, "pi");
  text = text.replace(/±/g, "+-");
  text = text.replace(/\\cdot/g, "*");
  text = text.replace(/\\pi/g, "pi");
  text = text.replace(/°/g, "");
  text = text.replace(/,/g, ".");
  text = text.replace(/\bln\(/g, "log(");
  text = convertLogBase(text);
  text = text.replace(/\\left|\\right/g, "");
  text = text.replace(/\\text\{[^}]*\}/g, "");
  text = insertImplicitMultiplication(text.trim());
  return text.trim();
}

const KNOWN_NAMES = new Set([
  "pi", "e", "i", "sqrt", "log", "log2", "log10", "ln", "sin", "cos", "tan",
  "asin", "acos", "atan", "abs", "exp", "cbrt", "min", "max",
]);

function freeSymbols(expr: string): Set<string> {
  const matches = expr.match(/[a-zA-Z_][a-zA-Z_0-9]*/g) ?? [];
  const symbols = new Set<string>();
  for (const m of matches) {
    if (!KNOWN_NAMES.has(m.toLowerCase())) symbols.add(m);
  }
  return symbols;
}

function evalNumeric(expr: string, scope?: Record<string, unknown>): unknown | null {
  try {
    return evaluate(expr, scope ?? {});
  } catch {
    return null;
  }
}

function magnitude(x: unknown): number | null {
  try {
    const m = mAbs(x as never);
    const n = typeof m === "object" && m !== null && "re" in (m as object) ? Math.hypot((m as { re: number }).re, (m as { im: number }).im) : Number(m);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

function numbersClose(a: unknown, b: unknown): boolean {
  try {
    const residual = subtract(a as never, b as never);
    const mag = magnitude(residual);
    return mag !== null && mag < 1e-6;
  } catch {
    return false;
  }
}

function valueSatisfies(
  valueStr: string,
  lhs: string,
  rhs: string,
  symbol: string,
  extras: Record<string, unknown> = {},
): boolean {
  const value = evalNumeric(normalize(valueStr));
  if (value === null) return false;
  const scope = { ...extras, [symbol]: value };
  const lhsVal = evalNumeric(lhs, scope);
  const rhsVal = evalNumeric(rhs, scope);
  if (lhsVal === null || rhsVal === null) return false;
  return numbersClose(lhsVal, rhsVal);
}

function valuesMatchComputed(values: string[], computed: unknown): boolean {
  return values.some((v) => {
    const got = evalNumeric(normalize(v));
    if (got === null) return false;
    return numbersClose(got, computed);
  });
}

function splitEquationChunks(text: string): string[] {
  return text
    .split(/\n|;/)
    .flatMap((line) => line.split(/,(?=\s*[A-Za-z\\][^=,]{0,40}=)/))
    .map((s) => s.trim())
    .filter(Boolean);
}

// Köhnə çıxarma (E1.2-dən əvvəl): `$...$` varsa YALNIZ onlar, yoxdursa bütün canonical.
// `verified=false` gizlətməsi YALNIZ bu yoldan gəlir — yeni əhatə gizlətmə əlavə etməsin.
function extractEquationsLegacy(canonical: string): string[] {
  const segments = [...canonical.matchAll(LATEX_SEGMENT_RE)].map((m) => m[1]);
  const candidates = segments.length > 0 ? segments : [canonical];
  return candidates.filter((c) => c.includes("="));
}

function extractEquationStrings(canonical: string): string[] {
  const latex = [...canonical.matchAll(LATEX_SEGMENT_RE)].map((m) => m[1]);
  const withoutLatex = canonical.replace(LATEX_SEGMENT_RE, "\n");
  const chunks: string[] = [];
  for (const piece of [...latex, withoutLatex]) {
    for (const part of splitEquationChunks(piece)) {
      if (part.includes("=") || part.includes("?")) chunks.push(part);
    }
  }
  return [...new Set(chunks)];
}

function clipProse(text: string): string {
  const cut = text.search(/\s+[A-Za-zƏəIıÖöÜüĞğÇçŞş]{4,}/);
  return (cut === -1 ? text : text.slice(0, cut)).trim();
}

function parseEquationSides(eqStr: string): { lhs: string; rhs: string } | null {
  const idx = eqStr.indexOf("=");
  if (idx === -1) return null;
  const lhs = normalizeEq(clipProse(eqStr.slice(0, idx)));
  let rhsRaw = eqStr.slice(idx + 1);
  const q = rhsRaw.indexOf("?");
  if (q !== -1) rhsRaw = rhsRaw.slice(0, q);
  const rhs = normalizeEq(clipProse(rhsRaw));
  return { lhs, rhs };
}

type ParsedEq = { lhs: string; rhs: string; symbols: Set<string> };

function parseAllEquations(canonical: string): ParsedEq[] {
  const out: ParsedEq[] = [];
  for (const eqStr of extractEquationStrings(canonical)) {
    const sides = parseEquationSides(eqStr);
    if (!sides) continue;
    const symbols = new Set([...freeSymbols(sides.lhs), ...freeSymbols(sides.rhs)]);
    out.push({ ...sides, symbols });
  }
  return out;
}

const POINT_RE =
  /(?:^|[^A-Za-z])[A-Za-z]\s*(?:\\left)?\s*\(\s*([^;,()]+)\s*[;,]\s*([^;,()]+)\s*(?:\\right)?\s*\)/g;

function extractPointBindings(canonical: string): Record<string, unknown> {
  const bindings: Record<string, unknown> = {};
  const matches = [...canonical.matchAll(POINT_RE)];
  if (matches.length !== 1) return bindings;
  const x = evalNumeric(normalize(matches[0][1]));
  const y = evalNumeric(normalize(matches[0][2]));
  if (x === null || y === null) return bindings;
  bindings.x = x;
  bindings.y = y;
  return bindings;
}

function assignmentBindings(parsed: ParsedEq[]): Record<string, unknown> {
  const bindings: Record<string, unknown> = {};
  for (const eq of parsed) {
    if (eq.symbols.size !== 1) continue;
    const symbol = [...eq.symbols][0];
    const lhsFree = freeSymbols(eq.lhs);
    const rhsFree = freeSymbols(eq.rhs);
    if (lhsFree.size === 1 && rhsFree.size === 0) {
      const v = evalNumeric(eq.rhs);
      if (v !== null) bindings[symbol] = v;
    } else if (rhsFree.size === 1 && lhsFree.size === 0) {
      const v = evalNumeric(eq.lhs);
      if (v !== null) bindings[symbol] = v;
    }
  }
  return bindings;
}

function tryPlaceholderArithmetic(canonical: string, values: string[]): boolean | null {
  for (const chunk of extractEquationStrings(canonical)) {
    if (!chunk.includes("?")) continue;
    const before = chunk.split("?")[0];
    const lhsRaw = before.includes("=") ? before.slice(0, before.indexOf("=")) : before;
    const lhs = normalize(lhsRaw);
    if (!lhs || freeSymbols(lhs).size !== 0) continue;
    const computed = evalNumeric(lhs);
    if (computed === null) continue;
    if (valuesMatchComputed(values, computed)) return true;
  }
  return null;
}

function tryNumericExpression(canonical: string, values: string[]): boolean | null {
  const stripped = canonical
    .replace(/\n[A-Ea-e][).]\s*[\s\S]*/g, "")
    .replace(/Variantlar:[\s\S]*/i, "")
    .trim();

  const computeCandidates: string[] = [];
  const hesabla = stripped.match(/Hesablayın:\s*([^\n]+)/i);
  if (hesabla) computeCandidates.push(hesabla[1]);

  const sumPhrase = stripped.match(/^\s*([0-9+\-*/^().,\s√\\a-zA-Z]+?)\s*,?\s*cəmi?\s/i);
  if (sumPhrase) computeCandidates.push(sumPhrase[1]);

  const latex = [...stripped.matchAll(LATEX_SEGMENT_RE)].map((m) => m[1]).filter((s) => !s.includes("="));
  computeCandidates.push(...latex);

  if (/^\s*\\sqrt\{[^}]+\}\s*$/.test(stripped) || /^\s*[0-9+\-*/^().,\s\\sqrt\{\}]+\s*$/.test(stripped.replace(/cəmi?\s+tapılmalıdır\.?/i, ""))) {
    computeCandidates.push(stripped.replace(/cəmi?\s+tapılmalıdır\.?/i, ""));
  }

  for (const raw of computeCandidates) {
    const expr = normalize(raw.replace(/\?.*$/, ""));
    if (!expr || expr.includes("=") || freeSymbols(expr).size !== 0) continue;
    const computed = evalNumeric(expr);
    if (computed === null) continue;
    if (valuesMatchComputed(values, computed)) return true;
  }
  return null;
}

function tryArithmeticSequence(canonical: string, values: string[]): boolean | null {
  if (!/silsil/i.test(canonical)) return null;
  const m = canonical.match(/([0-9xX+\-*/^()\\]+)\s*;\s*([0-9xX+\-*/^()\\]+)\s*;\s*([0-9xX+\-*/^()\\]+)/);
  if (!m) return null;
  const a = normalize(m[1]);
  const b = normalize(m[2]);
  const c = normalize(m[3]);
  const symbols = new Set([...freeSymbols(a), ...freeSymbols(b), ...freeSymbols(c)]);
  if (symbols.size !== 1) return null;
  const symbol = [...symbols][0];
  // 2·orta = birinci + üçüncü
  return values.some((v) => valueSatisfies(v, `(${a})+(${c})`, `2*(${b})`, symbol)) ? true : null;
}

function tryTriangleThirdAngle(canonical: string, values: string[]): boolean | null {
  if (!/buca/i.test(canonical)) return null;
  const degrees = [...canonical.matchAll(/(\d+)\s*°/g)].map((m) => Number(m[1]));
  if (degrees.length !== 2) return null;
  const third = 180 - degrees[0] - degrees[1];
  if (third <= 0 || third >= 180) return null;
  return valuesMatchComputed(values, third) ? true : null;
}

function tryCircleRadiusFromArea(canonical: string, values: string[]): boolean | null {
  if (!/radius|radiusunu|sahəsi/i.test(canonical)) return null;
  const m = canonical.match(/(\d+)\s*\\pi|(\d+)\s*π/);
  if (!m) return null;
  const areaOverPi = Number(m[1] ?? m[2]);
  if (!Number.isFinite(areaOverPi) || areaOverPi <= 0) return null;
  const r = Math.sqrt(areaOverPi);
  return valuesMatchComputed(values, r) ? true : null;
}

function tryLineInterceptSum(canonical: string, values: string[]): boolean | null {
  if (!/k\s*\+\s*b|k\+b/i.test(canonical)) return null;
  const yInt = canonical.match(/y oxunu\s+(-?\d+)/i);
  const xInt = canonical.match(/x oxunu\s+(-?\d+)/i);
  if (!yInt || !xInt) return null;
  const b = Number(yInt[1]);
  const x0 = Number(xInt[1]);
  if (!Number.isFinite(b) || !Number.isFinite(x0) || x0 === 0) return null;
  const k = -b / x0;
  return valuesMatchComputed(values, k + b) ? true : null;
}

function clipBeforeVariants(text: string): string {
  return text.split(/\n\s*[A-Ea-e][).]/)[0];
}

function tryRightTriangleInradius(canonical: string, values: string[]): boolean | null {
  if (!/katet|daxilinə/i.test(canonical)) return null;
  const sides = [...clipBeforeVariants(canonical).matchAll(/(\d+)\s*sm/gi)].map((m) => Number(m[1]));
  if (sides.length !== 2) return null;
  const [a, b] = sides;
  const c = Math.hypot(a, b);
  if (Math.abs(c - Math.round(c)) > 1e-6) return null;
  const r = (a + b - c) / 2;
  return valuesMatchComputed(values, r) ? true : null;
}

function tryMinIntegerComplexRootParameter(canonical: string, values: string[]): boolean | null {
  if (!/kompleks/i.test(canonical)) return null;
  const m = canonical.match(/x\s*(?:\^2|²|2)\s*\+\s*(\d+)\s*x\s*\+\s*([a-zA-Z])\s*=\s*0/i);
  if (!m) return null;
  const b = Number(m[1]);
  const param = m[2];
  if (param !== "m" || !Number.isFinite(b)) return null;
  const threshold = (b * b) / 4;
  const minInt = Number.isInteger(threshold) ? threshold + 1 : Math.floor(threshold) + 1;
  return valuesMatchComputed(values, minInt) ? true : null;
}

function answerIsNonRootContext(canonical: string): boolean {
  return /ehtimal|kompleks|parametr/i.test(canonical);
}

function reduceWithBindings(eq: ParsedEq, bindings: Record<string, unknown>): ParsedEq {
  const remaining = new Set([...eq.symbols].filter((s) => !(s in bindings)));
  return { ...eq, symbols: remaining };
}

function valuesSatisfySomeEq(eqs: ParsedEq[], values: string[], extras: Record<string, unknown>): boolean {
  return values.every((v) =>
    eqs.some((eq) => {
      if (eq.symbols.size !== 1) return false;
      return valueSatisfies(v, eq.lhs, eq.rhs, [...eq.symbols][0], extras);
    }),
  );
}

/** `verify.py::equation_cross_check`-in TS portu. `true`/`false`/`null` qaytarır —
 * `null` = canonical-dan yoxlanıla bilən tənlik/ifadə çıxarıla bilmədi. */
export function equationCrossCheck(
  canonical: string,
  values: string[]
): { verified: boolean | null; reason: VerificationReason } {
  if (!values || values.length === 0) return { verified: false, reason: null };

  const legacy: ParsedEq[] = [];
  for (const eqStr of extractEquationsLegacy(canonical)) {
    const sides = parseEquationSides(eqStr);
    if (!sides) continue;
    const symbols = new Set([...freeSymbols(sides.lhs), ...freeSymbols(sides.rhs)]);
    if (symbols.size === 1) legacy.push({ ...sides, symbols });
  }
  if (legacy.length > 0) {
    if (valuesSatisfySomeEq(legacy, values, {})) return { verified: true, reason: null };
    const complexParamEarly = tryMinIntegerComplexRootParameter(canonical, values);
    if (complexParamEarly === true) return { verified: true, reason: null };
    if (answerIsNonRootContext(canonical)) return { verified: null, reason: null };
    return { verified: false, reason: null };
  }

  const parsed = parseAllEquations(canonical);
  const point = extractPointBindings(canonical);
  const assigned = { ...point, ...assignmentBindings(parsed) };

  const reduced: ParsedEq[] = [];
  for (const eq of parsed) {
    if (eq.symbols.size <= 1) continue;
    const next = reduceWithBindings(eq, assigned);
    if (next.symbols.size === 1) reduced.push(next);
  }

  if (reduced.length > 0 && valuesSatisfySomeEq(reduced, values, assigned)) {
    return { verified: true, reason: null };
  }

  const placeholder = tryPlaceholderArithmetic(canonical, values);
  if (placeholder === true) return { verified: true, reason: null };

  const numeric = tryNumericExpression(canonical, values);
  if (numeric === true) return { verified: true, reason: null };

  const sequence = tryArithmeticSequence(canonical, values);
  if (sequence === true) return { verified: true, reason: null };

  const triangle = tryTriangleThirdAngle(canonical, values);
  if (triangle === true) return { verified: true, reason: null };

  const circle = tryCircleRadiusFromArea(canonical, values);
  if (circle === true) return { verified: true, reason: null };

  const intercepts = tryLineInterceptSum(canonical, values);
  if (intercepts === true) return { verified: true, reason: null };

  const inradius = tryRightTriangleInradius(canonical, values);
  if (inradius === true) return { verified: true, reason: null };

  const complexParam = tryMinIntegerComplexRootParameter(canonical, values);
  if (complexParam === true) return { verified: true, reason: null };

  if (parsed.some((eq) => eq.symbols.size !== 1 && eq.lhs !== "")) {
    return { verified: null, reason: "no_single_variable_equation" };
  }
  if (parsed.length === 0) return { verified: null, reason: "no_equation_extracted" };
  return { verified: null, reason: "no_single_variable_equation" };
}

function methodFor(verified: boolean | null): VerificationMethod {
  return verified === true ? "mathjs_equation" : "none";
}

/** `verify.py::verify_final_answer`-in istehsalat yolu (golden_values yoxdur, ADR-012).
 * `subject !== "math"` olanda həmişə `null` — fizikada yanlış gizlətmə riskini sıfırlayır (E1.2).
 * `verified`: true/false/null, `reason` YALNIZ `verified===null` olanda mənalıdır. */
export function verifyFinalAnswer(
  canonical: string,
  values: string[],
  subject?: string,
): { verified: boolean | null; reason: VerificationReason; method: VerificationMethod } {
  if (subject !== undefined && subject !== "math") {
    return { verified: null, reason: null, method: "none" };
  }
  const result = equationCrossCheck(canonical, values);
  return { ...result, method: methodFor(result.verified) };
}

/** SYSTEM-REVIEW-2026-08-07 §B1: şagirdin S4-də yazdığı cavab `check.accept`-in EYNİ
 * normallaşdırmasından keçsin (vergül/nöqtə, boşluq, unicode minus/kəsr, `log_b`, gizli
 * vurma) — əvvəllər addım-yoxlaması yalnız trim+lowercase edib sətir bərabərliyinə baxırdı,
 * `0.5` ilə `1/2` fərqli sətir olduğu üçün düzgün cavab səhv sayılırdı. Sətir bərabərliyi
 * (normallaşdırılmış formada) YALNIZ son çarədir — əvvəlcə ədədi ekvivalentlik yoxlanılır. */
export function studentAnswerMatches(input: string, accept: string): boolean {
  const normInput = normalize(input);
  const normAccept = normalize(accept);
  if (!normInput || !normAccept) return false;
  if (normInput === normAccept) return true;

  const inputVal = evalNumeric(normInput);
  const acceptVal = evalNumeric(normAccept);
  if (inputVal === null || acceptVal === null) return false;
  return numbersClose(inputVal, acceptVal);
}
