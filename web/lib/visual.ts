// STEP-SCHEMA v2 `visual` (ADR-031). LLM SVG/path vermir — yalnız qapalı JSON.
// Naməlum/əlavə sahə: vizual ATILIR, həll saxlanılır (`stripUnknownVisual`).
// Rəng/qalınlıq CSS var-larıdır (`DESIGN-TOKENS.json` → `getThemeVars`).

import { formatMath } from "./math-format";

export type VisualPoint = { x: number; label?: string; open?: boolean };

export type VisualSpec =
  | { kind: "none" }
  | { kind: "number_line"; min: number; max: number; points: VisualPoint[] }
  | { kind: "linear"; k: number; b: number }
  | { kind: "quadratic"; a: number; b: number; c: number };

export type DrawableVisual = Exclude<VisualSpec, { kind: "none" }>;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function extraKeys(obj: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(obj).some((k) => !allowed.includes(k));
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
  const { a, b, c } = spec;
  const vertex = a !== 0 ? -b / (2 * a) : 0;
  return plotScene((x) => a * x * x + b * x + c, [0, vertex], formatMath(quadraticLatex(a, b, c)));
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
