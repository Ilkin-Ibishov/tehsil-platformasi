// ADR-005: cavab sızması. scripts/lib/leak.py-ın hərfi TS portu (ADR-012) — sympy-dən
// asılı deyil, mexaniki regex məntiqi, divergensiya riski yoxdur.
//
// HANDOFF 106 (2026-08-15): 4 yalançı-müsbət istisnası scripts/lib/leak.py-la EYNİ vaxtda,
// EYNİ səbəblə əlavə edildi (bax o faylın başlığı) — burada TƏKRARLANMIR, port dəyişməz qalır.

type Step = { explanation?: string; check?: { accept?: string[] } };

// QƏSDƏN DAR — bax scripts/lib/leak.py-ın eyni sabitinin şərhi (geniş "-hər hansı hərf"
// forması "3-ə bərabər" (HƏQİQİ sızma) ilə toqquşurdu).
const ORDINAL_SUFFIX_RE = /^-(ci|cı|cü|cu|nci|ncı|ncü|ncu|inci|ıncı|uncu|üncü)\b/iu;
const COMPARISON_BEFORE_RE = /[<>≤≥]\s*$/u;

function inBracketSpan(text: string, start: number, end: number): boolean {
  const bracketRe = /\[[^[\]]*\]/gu;
  let m: RegExpExecArray | null;
  while ((m = bracketRe.exec(text)) !== null) {
    if (m.index <= start && end <= m.index + m[0].length) return true;
  }
  return false;
}

function leakedInText(value: string, text: string): boolean {
  const t = text.replace(/−/g, "-");
  const v = value.replace(/−/g, "-").trim();
  if (!v) return false;
  const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<![\\w.])${escaped}(?!\\w)(?!-\\d)(?!\\.\\d)`, "gu");
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(t)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (ORDINAL_SUFFIX_RE.test(t.slice(end, end + 3))) continue;
    if (inBracketSpan(t, start, end)) continue;
    if (COMPARISON_BEFORE_RE.test(t.slice(Math.max(0, start - 5), start))) continue;
    if (end < t.length && t[end] === "√") continue;
    return true;
  }
  return false;
}

function normalize(v: string): string {
  return v.replace(/−/g, "-").trim();
}

export function detectLeak(steps: Step[], finalAnswerValues: string[]): boolean {
  const values = (finalAnswerValues ?? []).filter(Boolean);
  if (values.length === 0) return false;

  const priorAccept = new Set<string>();
  for (const step of steps) {
    const explanation = step.explanation ?? "";
    for (const value of values) {
      if (leakedInText(value, explanation) && !priorAccept.has(normalize(value))) {
        return true;
      }
    }
    const accept = step.check?.accept ?? [];
    for (const a of accept) priorAccept.add(normalize(a));
  }

  return false;
}
