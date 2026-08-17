// ADR-031 visual parse/strip + SVG həndəsəsi. LLM SVG yazmır.
import { VISUAL_POINT_R } from "./design-tokens.ts";
import {
  parseVisual,
  stripUnknownVisual,
  drawableVisual,
  visualScene,
  visualPayloadJson,
  visualFromPayload,
  visualForReuse,
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

const tri = parseVisual({
  kind: "triangle",
  vertices: [
    { label: "A", x: 0, y: 0 },
    { label: "B", x: 4, y: 0 },
    { label: "C", x: 1, y: 3 },
  ],
  angles: [{ at: "C", label: "75°" }],
  highlight: "C",
});
check("triangle kind", tri && "kind" in tri ? tri.kind : null, "triangle");
check("triangle extra svg", parseVisual({ kind: "triangle", vertices: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], svg: "x" }), null);

const circ = parseVisual({
  kind: "circle",
  center: { x: 0, y: 0, label: "O" },
  r: 3,
  radius_label: "R",
  chord: { x1: -2, y1: 2, x2: 2, y2: 2, label: "AB" },
});
check("circle kind", circ && "kind" in circ ? circ.kind : null, "circle");
check("circle r<=0", parseVisual({ kind: "circle", center: { x: 0, y: 0 }, r: 0 }), null);

const force = parseVisual({
  kind: "force_diagram",
  body: "m",
  forces: [
    { label: "F", dir_deg: 0, rel: 1 },
    { label: "mg", dir_deg: 270, rel: 0.8 },
  ],
});
check("force_diagram kind", force && "kind" in force ? force.kind : null, "force_diagram");
check("force empty", parseVisual({ kind: "force_diagram", body: "m", forces: [] }), null);

const cart = parseVisual({
  kind: "cartesian",
  points: [
    { x: 0, y: 0 },
    { x: 2, y: 4 },
    { x: 4, y: 16 },
  ],
  label: "s=t^2",
});
check("cartesian kind", cart && "kind" in cart ? cart.kind : null, "cartesian");
check("cartesian one point", parseVisual({ kind: "cartesian", points: [{ x: 0, y: 0 }] }), null);

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

check("point r is numeric", Number.isFinite(VISUAL_POINT_R) && VISUAL_POINT_R > 0, true);

const reuseEmpty = visualForReuse({}, { kind: "linear", k: 1, b: 0 });
check("reuse empty payload serves llm", reuseEmpty.served, { kind: "linear", k: 1, b: 0 });
check("reuse empty payload backfills", reuseEmpty.backfill, { kind: "linear", k: 1, b: 0 });
const reuseKept = visualForReuse(
  { visual: { kind: "quadratic", a: 1, b: 0, c: 0 } },
  { kind: "linear", k: 1, b: 0 }
);
check("reuse keeps stored visual", reuseKept.served, { kind: "quadratic", a: 1, b: 0, c: 0 });
check("reuse does not overwrite stored", reuseKept.backfill, null);

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

const triScene = visualScene({
  kind: "triangle",
  vertices: [
    { label: "A", x: 0, y: 0 },
    { label: "B", x: 4, y: 0 },
    { label: "C", x: 1, y: 3 },
  ],
  angles: [{ at: "C", label: "75°" }],
  highlight: "AB",
});
if (triScene.kind !== "triangle") {
  fails++;
  console.log("FAIL  triangle scene kind");
} else {
  check("triangle 3 edges", triScene.edges.length, 3);
  check("triangle 3 vertices", triScene.vertices.length, 3);
  check("triangle highlight AB", triScene.edges.filter((e) => e.highlight).length >= 1, true);
}

const circScene = visualScene({
  kind: "circle",
  center: { x: 0, y: 0, label: "O" },
  r: 3,
  radius_label: "R",
});
if (circScene.kind !== "circle") {
  fails++;
  console.log("FAIL  circle scene kind");
} else {
  check("circle r positive", circScene.r > 0, true);
  check("circle has radius line", circScene.radius.x2 !== circScene.radius.x1, true);
}

const forceSc = visualScene({
  kind: "force_diagram",
  body: "m",
  forces: [
    { label: "F", dir_deg: 0, rel: 1 },
    { label: "mg", dir_deg: 270, rel: 0.8 },
  ],
});
if (forceSc.kind !== "force_diagram") {
  fails++;
  console.log("FAIL  force_diagram scene kind");
} else {
  check("force 2 arrows", forceSc.arrows.length, 2);
  check("force rightward F", forceSc.arrows[0].x2 > forceSc.arrows[0].x1, true);
}

const cartScene = visualScene({
  kind: "cartesian",
  points: [
    { x: 0, y: 0 },
    { x: 2, y: 4 },
    { x: 4, y: 16 },
  ],
  label: "s=t^2",
});
if (cartScene.kind !== "plot") {
  fails++;
  console.log("FAIL  cartesian scene kind");
} else {
  check("cartesian path starts M", cartScene.path.startsWith("M"), true);
  check("cartesian has axes", Boolean(cartScene.axisH && cartScene.axisV), true);
}

if (fails) {
  console.error(`\n${fails} uğursuz.`);
  process.exit(1);
}
console.log("\nHamısı keçdi.");
process.exit(0);
