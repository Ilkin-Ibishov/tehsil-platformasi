// ADR-005: cavab sızması. scripts/lib/leak.py-ın hərfi TS portu (ADR-012) — sympy-dən
// asılı deyil, mexaniki regex məntiqi, divergensiya riski yoxdur.

type Step = { explanation?: string; check?: { accept?: string[] } };

function leakedInText(value: string, text: string): boolean {
  const t = text.replace(/−/g, "-");
  const v = value.replace(/−/g, "-").trim();
  if (!v) return false;
  const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<![\\w.])${escaped}(?!\\w)(?!-\\d)(?!\\.\\d)`, "u");
  return pattern.test(t);
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
