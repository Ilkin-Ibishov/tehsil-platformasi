// ADR-031 visual parse/strip + SVG həndəsəsi. LLM SVG yazmır.
import {
  parseVisual,
  stripUnknownVisual,
  drawableVisual,
  visualScene,
  visualPayloadJson,
  visualFromPayload,
  VISUAL_VIEW,
} from "./visual.ts";

let fails = 0;
function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

check("none", parseVisual({ kind: "none" }), { kind: "none" });
check("linear", parseVisual({ kind: "linear", k: -1, b: 2 }), { kind: "linear", k: -1, b: 2 });
check("quadratic", parseVisual({ kind: "quadratic", a: 1, b: -2, c: 0 }), { kind: "quadratic", a: 1, b: -2, c: 0 });
check(
  "number_line",
  parseVisual({ kind: "number_line", min: -2, max: 5, points: [{ x: 0, label: "O" }, { x: 3, open: true }] }),
  { kind: "number_line", min: -2, max: 5, points: [{ x: 0, label: "O" }, { x: 3, open: true }] }
);
check("unknown kind", parseVisual({ kind: "hyperbola" }), null);
check("svg extra", parseVisual({ kind: "linear", k: 1, b: 0, svg: "<path/>" }), null);
check("linear missing b", parseVisual({ kind: "linear", k: 1 }), null);
check("max<=min", parseVisual({ kind: "number_line", min: 3, max: 3, points: [] }), null);
check("none not drawable", drawableVisual({ kind: "none" }), null);

const stripped = stripUnknownVisual({
  schema_version: 2,
  canonical: "y=x",
  visual: { kind: "hyperbola" },
}) as { visual?: unknown; canonical: string };
check("strip drops unknown, keeps rest", stripped.canonical, "y=x");
check("strip deletes visual", stripped.visual, undefined);

const kept = stripUnknownVisual({
  schema_version: 2,
  visual: { kind: "linear", k: 1, b: 0 },
}) as { visual: { kind: string } };
check("strip keeps valid", kept.visual.kind, "linear");

check("payload json none is empty", visualPayloadJson({ kind: "none" }), "{}");
check(
  "payload roundtrip",
  visualFromPayload(JSON.parse(visualPayloadJson({ kind: "linear", k: 2, b: -1 }))),
  { kind: "linear", k: 2, b: -1 }
);

const line = visualScene({ kind: "number_line", min: -2, max: 2, points: [{ x: -2 }, { x: 2 }] });
if (line.kind !== "number_line") {
  fails++;
  console.log("FAIL  number_line scene kind");
} else {
  check("number_line min → pad", line.x0, VISUAL_VIEW.pad);
  check("number_line max → w-pad", line.x1, VISUAL_VIEW.w - VISUAL_VIEW.pad);
  check("number_line two dots", line.dots.length, 2);
}

const plot = visualScene({ kind: "linear", k: 1, b: 0 });
if (plot.kind !== "plot") {
  fails++;
  console.log("FAIL  linear scene kind");
} else {
  check("linear path starts M", plot.path.startsWith("M"), true);
  check("linear path has L", plot.path.includes(" L"), true);
  check("linear has axes", Boolean(plot.axisH && plot.axisV), true);
}

const quad = visualScene({ kind: "quadratic", a: 1, b: 0, c: -4 });
if (quad.kind !== "plot") {
  fails++;
  console.log("FAIL  quadratic scene kind");
} else {
  check("quadratic path starts M", quad.path.startsWith("M"), true);
}

if (fails) {
  console.error(`\n${fails} uğursuz.`);
  process.exit(1);
}
console.log("\nHamısı keçdi.");
process.exit(0);
