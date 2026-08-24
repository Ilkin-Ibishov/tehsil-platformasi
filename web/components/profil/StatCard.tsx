"use client";

import { useTranslations } from "next-intl";
import type { ProgressReportData } from "@/lib/profile/types";

export function StatCard({ report }: { report: ProgressReportData }) {
  const t = useTranslations("profil");

  const summary =
    report.totalSolves === 0
      ? t("summaryEmpty")
      : report.summaryText
        ? t("summaryWithTopic", { topic: report.summaryText, count: report.totalSolves })
        : t("summaryGeneric", { count: report.totalSolves });

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "grid", rowGap: "8px" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "64px",
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
            color: "var(--acc)",
          }}
        >
          {t("solvesCount", { count: report.totalSolves })}
        </span>
        <span
          style={{
            fontFamily: "var(--hfont)",
            fontWeight: "var(--hweight)" as unknown as number,
            fontSize: "var(--hsize)",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            maxWidth: "24ch",
            color: "var(--t1)",
          }}
        >
          {summary}
        </span>
      </div>

      <div
        style={{
          border: "1px solid var(--bor)",
          borderRadius: "var(--rad)",
          background: "var(--sur)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            minHeight: "58px",
            padding: "0 18px",
            borderBottom: "1px solid var(--bor)",
          }}
        >
          <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("selfStepLabel")}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "17px",
              fontWeight: 500,
              color: "var(--acc)",
            }}
          >
            {report.selfStepPercent}%
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            minHeight: "58px",
            padding: "0 18px",
            borderBottom: "1px solid var(--bor)",
          }}
        >
          <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("immediateAnswerLabel")}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "17px",
              fontWeight: 500,
              color: report.immediateAnswerCount > 0 ? "var(--warn)" : "var(--t2)",
            }}
          >
            {t("times", { count: report.immediateAnswerCount })}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            minHeight: "58px",
            padding: "0 18px",
          }}
        >
          <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("avgTimeLabel")}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "17px",
              fontWeight: 500,
              color: "var(--t1)",
            }}
          >
            {t("avgTimeValue", { min: report.avgTimeMinutes, sec: report.avgTimeSeconds })}
          </span>
        </div>
      </div>
    </section>
  );
}
