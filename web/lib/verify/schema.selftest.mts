// STEP-SCHEMA v2 `visual` (ADR-031) — LLM SVG yazmır; naməlum kind rədd.
import { validateStep, STEP_SCHEMA_VERSION } from "./schema.ts";

const BASE = {
  schema_version: STEP_SCHEMA_VERSION,
  canonical: "y=kx+b",
  problem_type: "formula",
  subject: "math",
  grade: 9,
  topic_code: "ALG.LINEAR_EQUATION",
  final_answer: { latex: "k=1", values: ["1"] },
  steps: [
    {
      index: 1,
      title: "Əmsalı oxu",
      explanation: "Qrafikdən k-nı oxu.",
      check: { ask: "k neçədir?", accept: ["1"], input_kind: "number" },
      error_code: "COEFFICIENT_READ",
      hint: "Y-kəsişməyə bax.",
    },
  ],
};

let fails = 0;
function check(label: string, obj: unknown, expectValid: boolean) {
  const { valid, errors } = validateStep(obj);
  const ok = valid === expectValid;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> valid=${valid} (gözlənilən ${expectValid})${errors.length ? " " + errors.join("; ") : ""}`);
}

check("v1 without visual", { ...BASE, schema_version: 1 }, true);
check("v2 omit visual", BASE, true);
check("kind none", { ...BASE, visual: { kind: "none" } }, true);
check("number_line", {
  ...BASE,
  visual: { kind: "number_line", min: -2, max: 5, points: [{ x: 0, label: "O" }, { x: 3, open: true }] },
}, true);
check("linear", { ...BASE, visual: { kind: "linear", k: -1, b: 2 } }, true);
check("quadratic", { ...BASE, visual: { kind: "quadratic", a: 1, b: -2, c: 0 } }, true);
check("unknown kind rejected", { ...BASE, visual: { kind: "hyperbola" } }, false);
check("svg path extra rejected", { ...BASE, visual: { kind: "linear", k: 1, b: 0, svg: "<path/>" } }, false);
check("linear missing b rejected", { ...BASE, visual: { kind: "linear", k: 1 } }, false);

if (fails) {
  console.error(`\n${fails} uğursuz.`);
  process.exit(1);
}
console.log("\nHamısı keçdi.");
process.exit(0);
