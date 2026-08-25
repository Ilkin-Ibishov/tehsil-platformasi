"use client";

import { useTranslations } from "next-intl";
import type { ErrorStats } from "@/lib/profile/types";

export function WeaknessDiagnosis({ errors, attemptCount }: { errors: ErrorStats[]; attemptCount: number }) {
  const t = useTranslations("profil");
  const tErr = useTranslations("errors");
  const tLabel = useTranslations("errorLabels");

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
        {t("errorsTitle")}
      </span>

      {errors.length === 0 ? (
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
          {attemptCount === 0 ? t("emptyErrorsNone") : t("emptyErrors")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {errors.map((err, i) => {
            const isTopWarn = i < 2;
            const label = tLabel(err.code as "SIGN_LOST");
            const note = tErr(err.code as "SIGN_LOST");
            return (
              <div
                key={err.code}
                style={{
                  display: "grid",
                  rowGap: "8px",
                  padding: "16px 18px",
                  border: isTopWarn ? "1px solid var(--warn)" : "1px solid var(--bor)",
                  borderRadius: "var(--rad)",
                  background: isTopWarn ? "var(--warnsoft)" : "var(--sur)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      letterSpacing: "0.06em",
                      padding: "4px 8px",
                      borderRadius: "var(--radsm)",
                      border: isTopWarn ? "1px solid var(--warn)" : "1px solid var(--bor)",
                      color: isTopWarn ? "var(--warn)" : "var(--t2)",
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--t2)" }}>
                    {t("times", { count: err.count })}
                  </span>
                </div>
                {note ? (
                  <span
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "var(--t2)",
                      maxWidth: "34ch",
                    }}
                  >
                    {note}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
