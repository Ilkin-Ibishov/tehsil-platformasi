// `final_answer.values`-in ədədi yoxlanışı. scripts/lib/verify.py-ın YALNIZ istehsalat yolunun
// portu (ADR-012) — `direct_compare` (golden-əsaslı, yalnız eval-da mövcuddur) köçürülmədi,
// istehsalatda `golden_values` heç vaxt yoxdur.
//
// sympy → mathjs: sympy.simplify tam simvolik idi, amma yekun yoxlama HƏMİŞƏ ədədidir
// (residual.is_number → abs(complex(residual)) < 1e-6). Simvolu ədədi qiymətlə əvəz edib
// ədədi hesablamaq eyni nəticəni verir — CAS lazım deyil (ADR-012, "Bilinən fərq" bölməsi).

import { evaluate, subtract, abs as mAbs } from "mathjs";

const LATEX_SEGMENT_RE = /\$(.+?)\$/g;
const LATEX_FRAC_RE = /\\frac\{([^{}]*)\}\{([^{}]*)\}/g;
const LATEX_SQRT_RE = /\\sqrt\{([^{}]*)\}/g;

// sympy-nin implicit-multiplication transformunun best-effort qarşılığı (ADR-012 "Bilinən fərq").
// Yalnız RƏQƏM-əsaslı bitişikliyi həll edir (5x, 2(x+1), )x, )(  ) — hərf-hərf bitişikliyinə
// toxunmur, çünki funksiya adları ilə (sqrt, log) qarışa bilər.
function insertImplicitMultiplication(text: string): string {
  let out = text;
  out = out.replace(/(\d)(?=[a-zA-Z(])/g, "$1*");
  out = out.replace(/\)(?=[a-zA-Z0-9(])/g, ")*");
  return out;
}

function normalize(raw: string): string {
  let text = raw.trim();
  text = text.replace(/−/g, "-");
  text = text.replace(LATEX_FRAC_RE, "($1)/($2)");
  text = text.replace(LATEX_SQRT_RE, "sqrt($1)");
  text = text.replace(/\\cdot/g, "*");
  text = text.replace(/\\pi/g, "pi");
  text = text.replace(/°/g, "");
  text = text.replace(/,/g, ".");
  text = text.replace(/\\ /g, " ");
  text = text.replace(/\bln\(/g, "log(");
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

function valueSatisfies(valueStr: string, lhs: string, rhs: string, symbol: string): boolean {
  const value = evalNumeric(normalize(valueStr));
  if (value === null) return false;
  const lhsVal = evalNumeric(lhs, { [symbol]: value });
  const rhsVal = evalNumeric(rhs, { [symbol]: value });
  if (lhsVal === null || rhsVal === null) return false;
  try {
    const residual = subtract(lhsVal as never, rhsVal as never);
    const mag = magnitude(residual);
    return mag !== null && mag < 1e-6;
  } catch {
    return false;
  }
}

function extractEquations(canonical: string): string[] {
  const segments = [...canonical.matchAll(LATEX_SEGMENT_RE)].map((m) => m[1]);
  const candidates = segments.length > 0 ? segments : [canonical];
  return candidates.filter((c) => c.includes("="));
}

function parseEquationSides(eqStr: string): { lhs: string; rhs: string } | null {
  const idx = eqStr.indexOf("=");
  if (idx === -1) return null;
  const lhs = normalize(eqStr.slice(0, idx));
  const rhs = normalize(eqStr.slice(idx + 1));
  return { lhs, rhs };
}

/** `verify.py::equation_cross_check`-in TS portu. `true`/`false`/`null` qaytarır —
 * `null` = canonical-dan yoxlanıla bilən tək-dəyişənli tənlik çıxarıla bilmədi. */
export function equationCrossCheck(canonical: string, values: string[]): boolean | null {
  if (!values || values.length === 0) return false;

  const equations = extractEquations(canonical);
  if (equations.length === 0) return null;

  const parsed: { lhs: string; rhs: string; symbol: string }[] = [];
  for (const eqStr of equations) {
    const sides = parseEquationSides(eqStr);
    if (!sides) continue;
    const symbols = new Set([...freeSymbols(sides.lhs), ...freeSymbols(sides.rhs)]);
    if (symbols.size !== 1) continue;
    parsed.push({ ...sides, symbol: [...symbols][0] });
  }

  if (parsed.length === 0) return null;

  for (const valueStr of values) {
    const ok = parsed.some(({ lhs, rhs, symbol }) => valueSatisfies(valueStr, lhs, rhs, symbol));
    if (!ok) return false;
  }
  return true;
}

/** `verify.py::verify_final_answer`-in istehsalat yolu (golden_values yoxdur, ADR-012).
 * `verified`: true/false/null. */
export function verifyFinalAnswer(canonical: string, values: string[]): { verified: boolean | null } {
  return { verified: equationCrossCheck(canonical, values) };
}
