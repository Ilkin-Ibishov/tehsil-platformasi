// STEP-SCHEMA v2 `visual` (ADR-031). LLM SVG/path vermir — yalnız qapalı JSON.
// Naməlum/əlavə sahə: vizual ATILIR, həll saxlanılır (`stripUnknownVisual`).
// Rəng/qalınlıq CSS var-larıdır (`DESIGN-TOKENS.json` → `getThemeVars`).

import { formatMath } from "./math-format";

export type VisualPoint = { x: number; label?: string; open?: boolean };
export type VisualVertex = { x: number; y: number; label?: string };
export type VisualSide = { from: string; to: string; label?: string };
export type VisualAngle = { at: string; label: string };
export type VisualSegment = { x1: number; y1: number; x2: number; y2: number; label?: string };
export type VisualForce = { label: string; dir_deg: number; rel: number };
export type VisualSample = { x: number; y: number };

export type VisualSpec =
  | { kind: "none" }
  | { kind: "number_line"; min: number; max: number; points: VisualPoint[] }
  | { kind: "linear"; k: number; b: number }
  | { kind: "quadratic"; a: number; b: number; c: number }
  | {
      kind: "triangle";
      vertices: [VisualVertex, VisualVertex, VisualVertex];
      sides?: VisualSide[];
      angles?: VisualAngle[];
      highlight?: string;
    }
  | {
      kind: "circle";
      center: VisualVertex;
      r: number;
      radius_label?: string;
      chord?: VisualSegment;
      tangent?: VisualSegment;
    }
  | { kind: "force_diagram"; body: string; forces: VisualForce[] }
  | {
      kind: "cartesian";
      points: VisualSample[];
      label?: string;
      x_min?: number;
      x_max?: number;
      y_min?: number;
      y_max?: number;
    };

export type DrawableVisual = Exclude<VisualSpec, { kind: "none" }>;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function extraKeys(obj: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(obj).some((k) => !allowed.includes(k));
}

function parseBoundedString(v: unknown, max: number): string | undefined | false {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || v.length > max) return false;
  return v;
}

function parseVertex(raw: unknown): VisualVertex | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (extraKeys(o, ["x", "y", "label"])) return null;
  if (!isFiniteNumber(o.x) || !isFiniteNumber(o.y)) return null;
  const label = parseBoundedString(o.label, 8);
  if (label === false) return null;
  return { x: o.x, y: o.y, ...(label !== undefined ? { label } : {}) };
}

function parseSegment(raw: unknown): VisualSegment | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (extraKeys(o, ["x1", "y1", "x2", "y2", "label"])) return null;
  if (
    !isFiniteNumber(o.x1) ||
    !isFiniteNumber(o.y1) ||
    !isFiniteNumber(o.x2) ||
    !isFiniteNumber(o.y2)
  ) {
    return null;
  }
  const label = parseBoundedString(o.label, 12);
  if (label === false) return null;
  return {
    x1: o.x1,
    y1: o.y1,
    x2: o.x2,
    y2: o.y2,
    ...(label !== undefined ? { label } : {}),
  };
}

export function parseVisual(raw: unknown): VisualSpec | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (kind === "none") {
    if (extraKeys(o, ["kind"])) return null;
    return { kind: "none" };
  }
  if (kind === "linear") {
    if (extraKeys(o, ["kind", "k", "b"])) return null;
    if (!isFiniteNumber(o.k) || !isFiniteNumber(o.b)) return null;
    return { kind: "linear", k: o.k, b: o.b };
  }
  if (kind === "quadratic") {
    if (extraKeys(o, ["kind", "a", "b", "c"])) return null;
    if (!isFiniteNumber(o.a) || !isFiniteNumber(o.b) || !isFiniteNumber(o.c)) return null;
    return { kind: "quadratic", a: o.a, b: o.b, c: o.c };
  }
  if (kind === "number_line") {
    if (extraKeys(o, ["kind", "min", "max", "points"])) return null;
    if (!isFiniteNumber(o.min) || !isFiniteNumber(o.max) || o.max <= o.min) return null;
    if (!Array.isArray(o.points) || o.points.length > 8) return null;
    const points: VisualPoint[] = [];
    for (const p of o.points) {
      if (p == null || typeof p !== "object" || Array.isArray(p)) return null;
      const pt = p as Record<string, unknown>;
      if (extraKeys(pt, ["x", "label", "open"])) return null;
      if (!isFiniteNumber(pt.x)) return null;
      if (pt.label !== undefined && (typeof pt.label !== "string" || pt.label.length > 16)) return null;
      if (pt.open !== undefined && typeof pt.open !== "boolean") return null;
      points.push({
        x: pt.x,
        ...(pt.label !== undefined ? { label: pt.label } : {}),
        ...(pt.open === true ? { open: true } : {}),
      });
    }
    return { kind: "number_line", min: o.min, max: o.max, points };
  }
  if (kind === "triangle") {
    if (extraKeys(o, ["kind", "vertices", "sides", "angles", "highlight"])) return null;
    if (!Array.isArray(o.vertices) || o.vertices.length !== 3) return null;
    const vertices: VisualVertex[] = [];
    for (const v of o.vertices) {
      const parsed = parseVertex(v);
      if (!parsed) return null;
      vertices.push(parsed);
    }
    let sides: VisualSide[] | undefined;
    if (o.sides !== undefined) {
      if (!Array.isArray(o.sides) || o.sides.length > 3) return null;
      sides = [];
      for (const s of o.sides) {
        if (s == null || typeof s !== "object" || Array.isArray(s)) return null;
        const side = s as Record<string, unknown>;
        if (extraKeys(side, ["from", "to", "label"])) return null;
        if (typeof side.from !== "string" || side.from.length > 8) return null;
        if (typeof side.to !== "string" || side.to.length > 8) return null;
        const label = parseBoundedString(side.label, 12);
        if (label === false) return null;
        sides.push({
          from: side.from,
          to: side.to,
          ...(label !== undefined ? { label } : {}),
        });
      }
    }
    let angles: VisualAngle[] | undefined;
    if (o.angles !== undefined) {
      if (!Array.isArray(o.angles) || o.angles.length > 3) return null;
      angles = [];
      for (const a of o.angles) {
        if (a == null || typeof a !== "object" || Array.isArray(a)) return null;
        const ang = a as Record<string, unknown>;
        if (extraKeys(ang, ["at", "label"])) return null;
        if (typeof ang.at !== "string" || ang.at.length > 8) return null;
        if (typeof ang.label !== "string" || ang.label.length > 12) return null;
        angles.push({ at: ang.at, label: ang.label });
      }
    }
    const highlight = parseBoundedString(o.highlight, 16);
    if (highlight === false) return null;
    return {
      kind: "triangle",
      vertices: vertices as [VisualVertex, VisualVertex, VisualVertex],
      ...(sides ? { sides } : {}),
      ...(angles ? { angles } : {}),
      ...(highlight !== undefined ? { highlight } : {}),
    };
  }
  if (kind === "circle") {
    if (extraKeys(o, ["kind", "center", "r", "radius_label", "chord", "tangent"])) return null;
    const center = parseVertex(o.center);
    if (!center || !isFiniteNumber(o.r) || o.r <= 0) return null;
    const radius_label = parseBoundedString(o.radius_label, 8);
    if (radius_label === false) return null;
    let chord: VisualSegment | undefined;
    if (o.chord !== undefined) {
      const parsed = parseSegment(o.chord);
      if (!parsed) return null;
      chord = parsed;
    }
    let tangent: VisualSegment | undefined;
    if (o.tangent !== undefined) {
      const parsed = parseSegment(o.tangent);
      if (!parsed) return null;
      tangent = parsed;
    }
    return {
      kind: "circle",
      center,
      r: o.r,
      ...(radius_label !== undefined ? { radius_label } : {}),
      ...(chord ? { chord } : {}),
      ...(tangent ? { tangent } : {}),
    };
  }
  if (kind === "force_diagram") {
    if (extraKeys(o, ["kind", "body", "forces"])) return null;
    if (typeof o.body !== "string" || o.body.length > 16) return null;
    if (!Array.isArray(o.forces) || o.forces.length < 1 || o.forces.length > 8) return null;
    const forces: VisualForce[] = [];
    for (const f of o.forces) {
      if (f == null || typeof f !== "object" || Array.isArray(f)) return null;
      const force = f as Record<string, unknown>;
      if (extraKeys(force, ["label", "dir_deg", "rel"])) return null;
      if (typeof force.label !== "string" || force.label.length > 12) return null;
      if (!isFiniteNumber(force.dir_deg) || !isFiniteNumber(force.rel) || force.rel <= 0 || force.rel > 2) {
        return null;
      }
      forces.push({ label: force.label, dir_deg: force.dir_deg, rel: force.rel });
    }
    return { kind: "force_diagram", body: o.body, forces };
  }
  if (kind === "cartesian") {
    if (extraKeys(o, ["kind", "points", "label", "x_min", "x_max", "y_min", "y_max"])) return null;
    if (!Array.isArray(o.points) || o.points.length < 2 || o.points.length > 40) return null;
    const points: VisualSample[] = [];
    for (const p of o.points) {
      if (p == null || typeof p !== "object" || Array.isArray(p)) return null;
      const pt = p as Record<string, unknown>;
      if (extraKeys(pt, ["x", "y"])) return null;
      if (!isFiniteNumber(pt.x) || !isFiniteNumber(pt.y)) return null;
      points.push({ x: pt.x, y: pt.y });
    }
    const label = parseBoundedString(o.label, 24);
    if (label === false) return null;
    for (const key of ["x_min", "x_max", "y_min", "y_max"] as const) {
      if (o[key] !== undefined && !isFiniteNumber(o[key])) return null;
    }
    if (isFiniteNumber(o.x_min) && isFiniteNumber(o.x_max) && o.x_max <= o.x_min) return null;
    if (isFiniteNumber(o.y_min) && isFiniteNumber(o.y_max) && o.y_max <= o.y_min) return null;
    return {
      kind: "cartesian",
      points,
      ...(label !== undefined ? { label } : {}),
      ...(isFiniteNumber(o.x_min) ? { x_min: o.x_min } : {}),
      ...(isFiniteNumber(o.x_max) ? { x_max: o.x_max } : {}),
      ...(isFiniteNumber(o.y_min) ? { y_min: o.y_min } : {}),
      ...(isFiniteNumber(o.y_max) ? { y_max: o.y_max } : {}),
    };
  }
  return null;
}

/** Naməlum/əlavə `visual` sahəsini silir — qalan JSON `validateStep`-dən keçə bilər (ADR-031). */
export function stripUnknownVisual(obj: unknown): unknown {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const rec = obj as Record<string, unknown>;
  if (!("visual" in rec)) return rec;
  const parsed = parseVisual(rec.visual);
  const next = { ...rec };
  if (parsed) next.visual = parsed;
  else delete next.visual;
  return next;
}

export function drawableVisual(spec: VisualSpec | null | undefined): DrawableVisual | null {
  if (!spec || spec.kind === "none") return null;
  return spec;
}

export const VISUAL_VIEW = { w: 320, h: 200, pad: 28 } as const;

export type VisualTick = { x: number; y: number; label: string; anchor: "start" | "middle" | "end" };
export type VisualDot = { cx: number; cy: number; open: boolean; label?: string; labelY: number };

export type VisualLine = { x1: number; y1: number; x2: number; y2: number; label?: string; highlight?: boolean };
export type VisualArrow = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  head: string;
  labelX: number;
  labelY: number;
};

export type VisualScene =
  | {
      kind: "number_line";
      axisY: number;
      x0: number;
      x1: number;
      ticks: VisualTick[];
      dots: VisualDot[];
    }
  | {
      kind: "plot";
      path: string;
      axisH: { x1: number; y1: number; x2: number; y2: number } | null;
      axisV: { x1: number; y1: number; x2: number; y2: number } | null;
      ticks: VisualTick[];
      equation: string;
    }
  | {
      kind: "triangle";
      vertices: VisualDot[];
      edges: VisualLine[];
      labels: VisualTick[];
    }
  | {
      kind: "circle";
      cx: number;
      cy: number;
      r: number;
      centerLabel?: string;
      radius: VisualLine;
      extras: VisualLine[];
      labels: VisualTick[];
    }
  | {
      kind: "force_diagram";
      body: { cx: number; cy: number; label: string };
      arrows: VisualArrow[];
    };

function mapX(x: number, xMin: number, xMax: number): number {
  const span = xMax - xMin;
  if (span === 0) return VISUAL_VIEW.w / 2;
  return VISUAL_VIEW.pad + ((x - xMin) / span) * (VISUAL_VIEW.w - 2 * VISUAL_VIEW.pad);
}

function mapY(y: number, yMin: number, yMax: number): number {
  const span = yMax - yMin;
  if (span === 0) return VISUAL_VIEW.h / 2;
  return VISUAL_VIEW.h - VISUAL_VIEW.pad - ((y - yMin) / span) * (VISUAL_VIEW.h - 2 * VISUAL_VIEW.pad);
}

function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min;
  if (!(span > 0) || count < 2) return [min, max];
  const raw = span / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) {
    ticks.push(Number(v.toPrecision(8)));
  }
  if (ticks.length === 0) return [min, max];
  return ticks;
}

function formatTick(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(4)));
}

function numberLineScene(spec: Extract<DrawableVisual, { kind: "number_line" }>): VisualScene {
  const { min, max } = spec;
  const y = VISUAL_VIEW.h / 2;
  const ticks = niceTicks(min, max, Math.min(9, Math.max(3, Math.round(max - min) + 1))).map((v) => ({
    x: mapX(v, min, max),
    y: y + 16,
    label: formatTick(v),
    anchor: "middle" as const,
  }));
  const dots: VisualDot[] = spec.points.map((p) => ({
    cx: mapX(p.x, min, max),
    cy: y,
    open: p.open === true,
    label: p.label ? formatMath(p.label) : undefined,
    labelY: y - 14,
  }));
  return {
    kind: "number_line",
    axisY: y,
    x0: mapX(min, min, max),
    x1: mapX(max, min, max),
    ticks,
    dots,
  };
}

function sampleRange(fn: (x: number) => number, xMin: number, xMax: number, n: number): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = xMin + ((xMax - xMin) * i) / n;
    const y = fn(x);
    xs.push(x);
    ys.push(y);
  }
  return { xs, ys };
}

function plotDomain(fn: (x: number) => number, extras: number[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = -5;
  let xMax = 5;
  for (const x of extras) {
    if (!Number.isFinite(x)) continue;
    xMin = Math.min(xMin, x - 1);
    xMax = Math.max(xMax, x + 1);
  }
  if (xMax - xMin < 4) {
    const mid = (xMin + xMax) / 2;
    xMin = mid - 2;
    xMax = mid + 2;
  }
  const { ys } = sampleRange(fn, xMin, xMax, 40);
  const finite = ys.filter(Number.isFinite);
  let yMin = finite.length ? Math.min(0, ...finite) : -5;
  let yMax = finite.length ? Math.max(0, ...finite) : 5;
  if (yMax - yMin < 4) {
    const mid = (yMin + yMax) / 2;
    yMin = mid - 2;
    yMax = mid + 2;
  }
  const pad = (yMax - yMin) * 0.12;
  return { xMin, xMax, yMin: yMin - pad, yMax: yMax + pad };
}

function polylinePath(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): string {
  const { xs, ys } = sampleRange(fn, xMin, xMax, 80);
  const parts: string[] = [];
  let drawing = false;
  for (let i = 0; i < xs.length; i++) {
    const y = ys[i];
    if (!Number.isFinite(y)) {
      drawing = false;
      continue;
    }
    const px = mapX(xs[i], xMin, xMax);
    const py = mapY(y, yMin, yMax);
    if (!drawing) {
      parts.push(`M${px.toFixed(2)} ${py.toFixed(2)}`);
      drawing = true;
    } else {
      parts.push(`L${px.toFixed(2)} ${py.toFixed(2)}`);
    }
  }
  return parts.join(" ");
}

function plotScene(fn: (x: number) => number, extras: number[], equation: string): VisualScene {
  const { xMin, xMax, yMin, yMax } = plotDomain(fn, extras);
  const originInX = xMin <= 0 && xMax >= 0;
  const originInY = yMin <= 0 && yMax >= 0;
  const axisH = originInY
    ? {
        x1: VISUAL_VIEW.pad,
        y1: mapY(0, yMin, yMax),
        x2: VISUAL_VIEW.w - VISUAL_VIEW.pad,
        y2: mapY(0, yMin, yMax),
      }
    : null;
  const axisV = originInX
    ? {
        x1: mapX(0, xMin, xMax),
        y1: VISUAL_VIEW.pad,
        x2: mapX(0, xMin, xMax),
        y2: VISUAL_VIEW.h - VISUAL_VIEW.pad,
      }
    : null;
  const ticks: VisualTick[] = [];
  if (axisH) {
    for (const v of niceTicks(xMin, xMax, 5)) {
      if (Math.abs(v) < 1e-9) continue;
      ticks.push({ x: mapX(v, xMin, xMax), y: axisH.y1 + 14, label: formatTick(v), anchor: "middle" });
    }
  }
  if (axisV) {
    for (const v of niceTicks(yMin, yMax, 5)) {
      if (Math.abs(v) < 1e-9) continue;
      ticks.push({
        x: axisV.x1 - 6,
        y: mapY(v, yMin, yMax) + 4,
        label: formatTick(v),
        anchor: "end",
      });
    }
  }
  return {
    kind: "plot",
    path: polylinePath(fn, xMin, xMax, yMin, yMax),
    axisH,
    axisV,
    ticks,
    equation,
  };
}

function dataBox(
  xs: number[],
  ys: number[],
  extras: Array<{ x: number; y: number }> = []
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  const allX = [...xs, ...extras.map((p) => p.x)];
  const allY = [...ys, ...extras.map((p) => p.y)];
  let xMin = Math.min(...allX);
  let xMax = Math.max(...allX);
  let yMin = Math.min(...allY);
  let yMax = Math.max(...allY);
  if (xMax - xMin < 1e-6) {
    xMin -= 1;
    xMax += 1;
  }
  if (yMax - yMin < 1e-6) {
    yMin -= 1;
    yMax += 1;
  }
  const dx = (xMax - xMin) * 0.18;
  const dy = (yMax - yMin) * 0.18;
  return { xMin: xMin - dx, xMax: xMax + dx, yMin: yMin - dy, yMax: yMax + dy };
}

function triangleScene(spec: Extract<DrawableVisual, { kind: "triangle" }>): VisualScene {
  const { vertices } = spec;
  const box = dataBox(
    vertices.map((v) => v.x),
    vertices.map((v) => v.y)
  );
  const mapped = vertices.map((v) => ({
    cx: mapX(v.x, box.xMin, box.xMax),
    cy: mapY(v.y, box.yMin, box.yMax),
    open: false,
    label: v.label ? formatMath(v.label) : undefined,
    labelY: mapY(v.y, box.yMin, box.yMax) - 12,
  }));
  const highlight = (spec.highlight ?? "").trim();
  const byLabel = new Map(vertices.map((v, i) => [v.label ?? "", i]));
  const edges: VisualLine[] = [];
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3;
    const a = vertices[i];
    const b = vertices[j];
    const pair = `${a.label ?? ""}${b.label ?? ""}`;
    const pairRev = `${b.label ?? ""}${a.label ?? ""}`;
    const side = spec.sides?.find(
      (s) =>
        (s.from === a.label && s.to === b.label) || (s.from === b.label && s.to === a.label)
    );
    const isHi =
      highlight.length > 0 &&
      (highlight === pair || highlight === pairRev || highlight === side?.label);
    edges.push({
      x1: mapped[i].cx,
      y1: mapped[i].cy,
      x2: mapped[j].cx,
      y2: mapped[j].cy,
      label: side?.label ? formatMath(side.label) : undefined,
      highlight: isHi,
    });
  }
  const labels: VisualTick[] = [];
  for (const edge of edges) {
    if (!edge.label) continue;
    labels.push({
      x: (edge.x1 + edge.x2) / 2,
      y: (edge.y1 + edge.y2) / 2 + 14,
      label: edge.label,
      anchor: "middle",
    });
  }
  const cx = (mapped[0].cx + mapped[1].cx + mapped[2].cx) / 3;
  const cy = (mapped[0].cy + mapped[1].cy + mapped[2].cy) / 3;
  for (const ang of spec.angles ?? []) {
    const idx = byLabel.get(ang.at);
    if (idx == null) continue;
    const vx = mapped[idx].cx;
    const vy = mapped[idx].cy;
    labels.push({
      x: vx + (cx - vx) * 0.28,
      y: vy + (cy - vy) * 0.28 + 4,
      label: formatMath(ang.label),
      anchor: "middle",
    });
  }
  if (highlight && byLabel.has(highlight)) {
    const idx = byLabel.get(highlight)!;
    mapped[idx] = { ...mapped[idx], open: false };
  }
  return { kind: "triangle", vertices: mapped, edges, labels };
}

function circleScene(spec: Extract<DrawableVisual, { kind: "circle" }>): VisualScene {
  const extras = [
    { x: spec.center.x + spec.r, y: spec.center.y },
    { x: spec.center.x - spec.r, y: spec.center.y },
    { x: spec.center.x, y: spec.center.y + spec.r },
    { x: spec.center.x, y: spec.center.y - spec.r },
  ];
  if (spec.chord) {
    extras.push({ x: spec.chord.x1, y: spec.chord.y1 }, { x: spec.chord.x2, y: spec.chord.y2 });
  }
  if (spec.tangent) {
    extras.push({ x: spec.tangent.x1, y: spec.tangent.y1 }, { x: spec.tangent.x2, y: spec.tangent.y2 });
  }
  const box = dataBox([spec.center.x], [spec.center.y], extras);
  const cx = mapX(spec.center.x, box.xMin, box.xMax);
  const cy = mapY(spec.center.y, box.yMin, box.yMax);
  const rPx = Math.abs(mapX(spec.center.x + spec.r, box.xMin, box.xMax) - cx);
  const rx = mapX(spec.center.x + spec.r, box.xMin, box.xMax);
  const radius: VisualLine = {
    x1: cx,
    y1: cy,
    x2: rx,
    y2: cy,
    label: spec.radius_label ? formatMath(spec.radius_label) : undefined,
  };
  const extrasLines: VisualLine[] = [];
  const labels: VisualTick[] = [];
  if (spec.center.label) {
    labels.push({ x: cx, y: cy - 12, label: formatMath(spec.center.label), anchor: "middle" });
  }
  if (radius.label) {
    labels.push({ x: (cx + rx) / 2, y: cy - 10, label: radius.label, anchor: "middle" });
  }
  for (const seg of [spec.chord, spec.tangent]) {
    if (!seg) continue;
    extrasLines.push({
      x1: mapX(seg.x1, box.xMin, box.xMax),
      y1: mapY(seg.y1, box.yMin, box.yMax),
      x2: mapX(seg.x2, box.xMin, box.xMax),
      y2: mapY(seg.y2, box.yMin, box.yMax),
      label: seg.label ? formatMath(seg.label) : undefined,
    });
    if (seg.label) {
      labels.push({
        x: (mapX(seg.x1, box.xMin, box.xMax) + mapX(seg.x2, box.xMin, box.xMax)) / 2,
        y: (mapY(seg.y1, box.yMin, box.yMax) + mapY(seg.y2, box.yMin, box.yMax)) / 2 - 8,
        label: formatMath(seg.label),
        anchor: "middle",
      });
    }
  }
  return {
    kind: "circle",
    cx,
    cy,
    r: rPx,
    centerLabel: spec.center.label ? formatMath(spec.center.label) : undefined,
    radius,
    extras: extrasLines,
    labels,
  };
}

function arrowHead(x1: number, y1: number, x2: number, y2: number, size = 7): string {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const p1x = x2 - size * Math.cos(ang - 0.45);
  const p1y = y2 - size * Math.sin(ang - 0.45);
  const p2x = x2 - size * Math.cos(ang + 0.45);
  const p2y = y2 - size * Math.sin(ang + 0.45);
  return `${x2.toFixed(1)},${y2.toFixed(1)} ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`;
}

function forceScene(spec: Extract<DrawableVisual, { kind: "force_diagram" }>): VisualScene {
  const cx = VISUAL_VIEW.w / 2;
  const cy = VISUAL_VIEW.h / 2;
  const maxLen = Math.min(VISUAL_VIEW.w, VISUAL_VIEW.h) / 2 - VISUAL_VIEW.pad;
  const arrows: VisualArrow[] = spec.forces.map((f) => {
    const rad = (f.dir_deg * Math.PI) / 180;
    const len = Math.min(2, Math.max(0.15, f.rel)) * maxLen;
    const x2 = cx + Math.cos(rad) * len;
    const y2 = cy - Math.sin(rad) * len;
    const label = formatMath(f.label);
    return {
      x1: cx,
      y1: cy,
      x2,
      y2,
      label,
      head: arrowHead(cx, cy, x2, y2),
      labelX: x2 + Math.cos(rad) * 12,
      labelY: y2 - Math.sin(rad) * 12 + 4,
    };
  });
  return {
    kind: "force_diagram",
    body: { cx, cy, label: formatMath(spec.body) },
    arrows,
  };
}

function cartesianScene(spec: Extract<DrawableVisual, { kind: "cartesian" }>): VisualScene {
  const extras = spec.points.map((p) => p.x);
  if (spec.x_min != null) extras.push(spec.x_min);
  if (spec.x_max != null) extras.push(spec.x_max);
  const fn = (x: number) => {
    if (x <= spec.points[0].x) return spec.points[0].y;
    for (let i = 1; i < spec.points.length; i++) {
      const a = spec.points[i - 1];
      const b = spec.points[i];
      if (x <= b.x) {
        const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
        return a.y + t * (b.y - a.y);
      }
    }
    return spec.points[spec.points.length - 1].y;
  };
  return plotScene(fn, extras, spec.label ? formatMath(spec.label) : "");
}

function linearLatex(k: number, b: number): string {
  const kPart = k === 1 ? "x" : k === -1 ? "-x" : `${k}x`;
  if (b === 0) return `y=${kPart}`;
  return `y=${kPart}${b > 0 ? `+${b}` : `${b}`}`;
}

function quadraticLatex(a: number, b: number, c: number): string {
  const aPart = a === 1 ? "x^2" : a === -1 ? "-x^2" : `${a}x^2`;
  const bPart = b === 0 ? "" : b === 1 ? "+x" : b === -1 ? "-x" : b > 0 ? `+${b}x` : `${b}x`;
  const cPart = c === 0 ? "" : c > 0 ? `+${c}` : `${c}`;
  return `y=${aPart}${bPart}${cPart}`;
}

export function visualScene(spec: DrawableVisual): VisualScene {
  if (spec.kind === "number_line") return numberLineScene(spec);
  if (spec.kind === "linear") {
    const { k, b } = spec;
    const xInt = k !== 0 ? -b / k : 0;
    return plotScene((x) => k * x + b, [0, xInt], formatMath(linearLatex(k, b)));
  }
  if (spec.kind === "quadratic") {
    const { a, b, c } = spec;
    const vertex = a !== 0 ? -b / (2 * a) : 0;
    return plotScene((x) => a * x * x + b * x + c, [0, vertex], formatMath(quadraticLatex(a, b, c)));
  }
  if (spec.kind === "triangle") return triangleScene(spec);
  if (spec.kind === "circle") return circleScene(spec);
  if (spec.kind === "force_diagram") return forceScene(spec);
  return cartesianScene(spec);
}

export function visualPayloadJson(spec: VisualSpec | null | undefined): string {
  const draw = drawableVisual(spec);
  if (!draw) return "{}";
  return JSON.stringify({ visual: draw });
}

export function visualFromPayload(payload: unknown): VisualSpec | null {
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) return null;
  return parseVisual((payload as { visual?: unknown }).visual);
}

/** Reuse: keep a stored drawable visual; else serve this response's LLM visual (payload backfill). */
export function visualForReuse(
  storedPayload: unknown,
  llmVisual: VisualSpec | null | undefined,
): { served: DrawableVisual | null; backfill: DrawableVisual | null } {
  const stored = drawableVisual(visualFromPayload(storedPayload));
  if (stored) return { served: stored, backfill: null };
  const llm = drawableVisual(llmVisual);
  return { served: llm, backfill: llm };
}
