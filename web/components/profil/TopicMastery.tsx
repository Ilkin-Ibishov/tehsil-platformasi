"use client";

import { useTranslations } from "next-intl";
import type { TopicStats } from "@/lib/profile/types";

export function TopicMastery({ topics }: { topics: TopicStats[] }) {
  const t = useTranslations("profil");

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          letterSpacing: "0.1em",
          color: "var(--t3)",
        }}
      >
        {t("topicsTitle")}
      </span>

      {topics.length === 0 ? (
        <div
          style={{
            padding: "16px 18px",
            borderRadius: "var(--rad)",
            border: "1px solid var(--bor)",
            background: "var(--sur)",
            fontSize: "14px",
            color: "var(--t2)",
          }}
        >
          {t("emptyTopics")}
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--bor)",
            borderRadius: "var(--rad)",
            background: "var(--sur)",
            overflow: "hidden",
          }}
        >
          {topics.map((top, idx) => {
            const isLast = idx === topics.length - 1;
            const barColor = top.masteryPercent >= 60 ? "var(--acc)" : "var(--warn)";
            return (
              <div
                key={top.topicCode}
                style={{
                  display: "grid",
                  rowGap: "10px",
                  padding: "16px 18px",
                  borderBottom: isLast ? "none" : "1px solid var(--bor)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--t1)" }}>{top.title}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      color: barColor,
                    }}
                  >
                    {top.masteryPercent}%
                  </span>
                </div>
                <div
                  style={{
                    display: "block",
                    height: "6px",
                    borderRadius: "99px",
                    background: "var(--bor)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "block",
                      height: "6px",
                      width: `${Math.min(100, Math.max(0, top.masteryPercent))}%`,
                      borderRadius: "99px",
                      background: barColor,
                      transition: "width 380ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
