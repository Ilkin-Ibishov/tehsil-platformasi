"use client";

import { VISUAL_POINT_R } from "@/lib/design-tokens";
import { drawableVisual, visualScene, VISUAL_VIEW, type VisualSpec, type VisualScene } from "@/lib/visual";

type Props = {
  spec: VisualSpec | null | undefined;
  label: string;
};

function AxisText({
  x,
  y,
  anchor,
  children,
}: {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  children: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill="var(--t2)" fontFamily="var(--font-mono)" fontSize="11">
      {children}
    </text>
  );
}

function SceneSvg({ scene }: { scene: VisualScene }) {
  if (scene.kind === "number_line") {
    return (
      <>
        <line
          x1={scene.x0}
          y1={scene.axisY}
          x2={scene.x1}
          y2={scene.axisY}
          stroke="var(--bor)"
          style={{ strokeWidth: "var(--visual-stroke-axis)" }}
        />
        {scene.ticks.map((t) => (
          <g key={`t-${t.x}`}>
            <line
              x1={t.x}
              y1={scene.axisY - 5}
              x2={t.x}
              y2={scene.axisY + 5}
              stroke="var(--bor)"
              style={{ strokeWidth: "var(--visual-stroke-axis)" }}
            />
            <AxisText x={t.x} y={t.y} anchor={t.anchor}>
              {t.label}
            </AxisText>
          </g>
        ))}
        {scene.dots.map((d, i) => (
          <g key={`d-${i}-${d.cx}`}>
            <circle
              cx={d.cx}
              cy={d.cy}
              r={VISUAL_POINT_R}
              fill={d.open ? "var(--sur)" : "var(--acc)"}
              stroke="var(--acc)"
              style={{ strokeWidth: "var(--visual-stroke-plot)" }}
            />
            {d.label ? (
              <text
                x={d.cx}
                y={d.labelY}
                textAnchor="middle"
                fill="var(--t1)"
                fontFamily="var(--font-mono)"
                fontSize="12"
              >
                {d.label}
              </text>
            ) : null}
          </g>
        ))}
      </>
    );
  }
  if (scene.kind === "triangle") {
    return (
      <>
        {scene.edges.map((e, i) => (
          <line
            key={`e-${i}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={e.highlight ? "var(--acc)" : "var(--bor)"}
            style={{ strokeWidth: e.highlight ? "var(--visual-stroke-plot)" : "var(--visual-stroke-axis)" }}
          />
        ))}
        {scene.vertices.map((d, i) => (
          <g key={`v-${i}-${d.cx}`}>
            <circle
              cx={d.cx}
              cy={d.cy}
              r={VISUAL_POINT_R}
              fill="var(--acc)"
              stroke="var(--acc)"
              style={{ strokeWidth: "var(--visual-stroke-plot)" }}
            />
            {d.label ? (
              <text
                x={d.cx}
                y={d.labelY}
                textAnchor="middle"
                fill="var(--t1)"
                fontFamily="var(--font-mono)"
                fontSize="12"
              >
                {d.label}
              </text>
            ) : null}
          </g>
        ))}
        {scene.labels.map((t, i) => (
          <AxisText key={`tl-${i}-${t.x}`} x={t.x} y={t.y} anchor={t.anchor}>
            {t.label}
          </AxisText>
        ))}
      </>
    );
  }
  if (scene.kind === "circle") {
    return (
      <>
        <circle
          cx={scene.cx}
          cy={scene.cy}
          r={scene.r}
          fill="none"
          stroke="var(--acc)"
          style={{ strokeWidth: "var(--visual-stroke-plot)" }}
        />
        <line
          x1={scene.radius.x1}
          y1={scene.radius.y1}
          x2={scene.radius.x2}
          y2={scene.radius.y2}
          stroke="var(--bor)"
          style={{ strokeWidth: "var(--visual-stroke-axis)" }}
        />
        {scene.extras.map((e, i) => (
          <line
            key={`c-${i}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="var(--t1)"
            style={{ strokeWidth: "var(--visual-stroke-axis)" }}
          />
        ))}
        <circle cx={scene.cx} cy={scene.cy} r={VISUAL_POINT_R} fill="var(--acc)" />
        {scene.labels.map((t, i) => (
          <AxisText key={`cl-${i}-${t.x}`} x={t.x} y={t.y} anchor={t.anchor}>
            {t.label}
          </AxisText>
        ))}
      </>
    );
  }
  if (scene.kind === "force_diagram") {
    return (
      <>
        {scene.arrows.map((a, i) => (
          <g key={`f-${i}-${a.label}`}>
            <line
              x1={a.x1}
              y1={a.y1}
              x2={a.x2}
              y2={a.y2}
              stroke="var(--acc)"
              style={{ strokeWidth: "var(--visual-stroke-plot)" }}
            />
            <polygon points={a.head} fill="var(--acc)" />
            <text
              x={a.labelX}
              y={a.labelY}
              textAnchor="middle"
              fill="var(--t1)"
              fontFamily="var(--font-mono)"
              fontSize="12"
            >
              {a.label}
            </text>
          </g>
        ))}
        <circle
          cx={scene.body.cx}
          cy={scene.body.cy}
          r={10}
          fill="var(--sur)"
          stroke="var(--t1)"
          style={{ strokeWidth: "var(--visual-stroke-plot)" }}
        />
        <text
          x={scene.body.cx}
          y={scene.body.cy + 4}
          textAnchor="middle"
          fill="var(--t1)"
          fontFamily="var(--font-mono)"
          fontSize="11"
        >
          {scene.body.label}
        </text>
      </>
    );
  }
  return (
    <>
      {scene.axisH ? (
        <line
          x1={scene.axisH.x1}
          y1={scene.axisH.y1}
          x2={scene.axisH.x2}
          y2={scene.axisH.y2}
          stroke="var(--bor)"
          style={{ strokeWidth: "var(--visual-stroke-axis)" }}
        />
      ) : null}
      {scene.axisV ? (
        <line
          x1={scene.axisV.x1}
          y1={scene.axisV.y1}
          x2={scene.axisV.x2}
          y2={scene.axisV.y2}
          stroke="var(--bor)"
          style={{ strokeWidth: "var(--visual-stroke-axis)" }}
        />
      ) : null}
      {scene.ticks.map((t, i) => (
        <AxisText key={`pt-${i}-${t.x}-${t.y}`} x={t.x} y={t.y} anchor={t.anchor}>
          {t.label}
        </AxisText>
      ))}
      {scene.path ? (
        <path
          d={scene.path}
          fill="none"
          stroke="var(--acc)"
          strokeLinejoin="round"
          style={{ strokeWidth: "var(--visual-stroke-plot)" }}
          strokeLinecap="round"
        />
      ) : null}
      {scene.equation ? (
        <text x={VISUAL_VIEW.pad} y={18} fill="var(--t1)" fontFamily="var(--font-mono)" fontSize="12">
          {scene.equation}
        </text>
      ) : null}
    </>
  );
}

/** ADR-031: deterministik SVG. Rəng/qalınlıq yalnız CSS custom property. */
export function VisualFigure({ spec, label }: Props) {
  const draw = drawableVisual(spec);
  if (!draw) return null;
  const scene = visualScene(draw);
  const { w, h } = VISUAL_VIEW;

  return (
    <div style={{ padding: "0 var(--page-pad-x)", display: "grid", rowGap: 8 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--acc)" }}>
        {label}
      </span>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={label}
        style={{
          width: "100%",
          height: "auto",
          border: "1px solid var(--bor)",
          borderRadius: "var(--rad)",
          background: "var(--sur)",
        }}
      >
        <SceneSvg scene={scene} />
      </svg>
    </div>
  );
}
