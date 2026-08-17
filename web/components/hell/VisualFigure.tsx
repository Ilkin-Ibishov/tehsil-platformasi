"use client";

import { VISUAL_POINT_R } from "@/lib/design-tokens";
import { drawableVisual, visualScene, VISUAL_VIEW, type VisualSpec } from "@/lib/visual";

type Props = {
  spec: VisualSpec | null | undefined;
  label: string;
};

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
        {scene.kind === "number_line" ? (
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
                <text
                  x={t.x}
                  y={t.y}
                  textAnchor={t.anchor}
                  fill="var(--t2)"
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                >
                  {t.label}
                </text>
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
        ) : (
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
              <text
                key={`pt-${i}-${t.x}-${t.y}`}
                x={t.x}
                y={t.y}
                textAnchor={t.anchor}
                fill="var(--t2)"
                fontFamily="var(--font-mono)"
                fontSize="11"
              >
                {t.label}
              </text>
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
            <text
              x={VISUAL_VIEW.pad}
              y={18}
              fill="var(--t1)"
              fontFamily="var(--font-mono)"
              fontSize="12"
            >
              {scene.equation}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
