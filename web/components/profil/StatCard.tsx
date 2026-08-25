"use client";

import { useTranslations } from "next-intl";
import type { ProgressReportData } from "@/lib/profile/types";

export function StatCard({ report }: { report: ProgressReportData }) {
  const t = useTranslations("profil");

  const summary =
    report.completedCount === 0
      ? t("summaryEmpty")
      : report.summaryText
        ? t("summaryWithTopic", { topic: report.summaryText, count: report.completedCount })
        : t("summaryGeneric", { count: report.completedCount });

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
          {t("solvesCount", { count: report.completedCount })}
        </span>
        {report.totalSolves > report.completedCount ? (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--t3)" }}>
            {t("attemptsCount", { count: report.totalSolves })}
          </span>
        ) : null}
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
    </section>
  );
}
