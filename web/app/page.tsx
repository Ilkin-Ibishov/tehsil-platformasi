"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trackEvent, getDeviceId } from "@/lib/telemetry";
import { extractInviteCodeFromSearch, cleanInviteFromUrl, validateAndStoreInviteCode } from "@/lib/invite/url";
import { getStoredProfile, getHistoryItems, getProgressReport, touchStreak } from "@/lib/profile/storage";
import type { ProfileData, SolvedAttemptItem, ProgressReportData } from "@/lib/profile/types";
import { AppHeader } from "@/components/nav/AppHeader";
import { BottomNav } from "@/components/nav/BottomNav";

const DEVICE_ID_KEY = "th_device_id";

export default function HomePage() {
  const t = useTranslations("home");
  const tWeek = useTranslations("weekdaysShort");
  const tErrLabel = useTranslations("errorLabels");
  const router = useRouter();
  const fired = useRef(false);

  const [profile] = useState<ProfileData>(() => {
    touchStreak();
    return getStoredProfile();
  });
  const [history] = useState<SolvedAttemptItem[]>(() => getHistoryItems());
  const [report] = useState<ProgressReportData>(() => getProgressReport());

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // 1-Toxunuşlu Dəvət: ?invite= və ya ?code= parametrini oxuyub yadda saxla
    if (typeof window !== "undefined" && window.location.search) {
      const code = extractInviteCodeFromSearch(window.location.search);
      if (code) {
        void validateAndStoreInviteCode(code, getDeviceId()).then((ok) => {
          if (ok) cleanInviteFromUrl();
        });
      }
    }

    const currentProfile = getStoredProfile();
    if (!currentProfile.onboarded) {
      router.replace("/onboarding");
      return;
    }

    let coldStart = true;
    try {
      coldStart = localStorage.getItem(DEVICE_ID_KEY) === null;
    } catch {
      // ignore
    }

    trackEvent("app.opened", {
      cold_start: coldStart,
      locale: currentProfile.locale,
      grade: currentProfile.grade,
      tone: currentProfile.pedagogicalTone,
    });
  }, [router]);

  const streakDays = profile.streakDays || 1;
  const weeklyData = report.weeklyActivity.length === 7 ? report.weeklyActivity : [0, 0, 0, 0, 0, 0, 0];
  const maxWeekly = Math.max(1, ...weeklyData);
  const topWeakness = report.repeatedErrors[0];
  const firstName = profile.fullName ? profile.fullName.trim().split(" ")[0] : "";
  const greetingText = firstName ? t("greetingPersonal", { name: firstName }) : t("greeting");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <AppHeader />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px var(--page-pad-x) 32px",
          gap: "28px",
        }}
      >
        {/* Streak & Greeting */}
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
            {streakDays}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.06em", color: "var(--t3)" }}>
            {t("streakDays", { count: streakDays })}
          </span>
          <h1
            style={{
              fontFamily: "var(--hfont)",
              fontWeight: "var(--hweight)" as unknown as number,
              fontSize: "var(--hsize)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              maxWidth: "24ch",
              margin: 0,
              color: "var(--t1)",
            }}
          >
            {greetingText}
          </h1>
        </div>

        {/* Primary CTA — Camera */}
        <button
          type="button"
          onClick={() => router.push("/kamera")}
          style={{
            width: "100%",
            minHeight: "84px",
            border: "none",
            borderRadius: "var(--rad)",
            background: "var(--acc)",
            color: "var(--accink)",
            fontFamily: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "0 20px",
            textAlign: "left",
            transition: "transform 140ms ease",
          }}
        >
          <span style={{ display: "grid", rowGap: "4px" }}>
            <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: 22, letterSpacing: "-0.01em" }}>
              {t("cta")}
            </span>
            <span style={{ fontSize: 14, opacity: 0.85 }}>{t("ctaSub")}</span>
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 22 }}>→</span>
        </button>

        {/* Secondary CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={() => router.push("/bank")}
            style={{
              width: "100%",
              minHeight: "56px",
              border: "1px solid var(--bor)",
              borderRadius: "var(--rad)",
              background: "var(--sur)",
              color: "var(--t1)",
              fontFamily: "inherit",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
            }}
          >
            <span>{t("bankCta")}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--t3)" }}>→</span>
          </button>

          {topWeakness && (
            <button
              type="button"
              onClick={() => router.push("/profil")}
              style={{
                width: "100%",
                minHeight: "56px",
                border: "1px solid var(--warn)",
                borderRadius: "var(--rad)",
                background: "var(--warnsoft)",
                color: "var(--t1)",
                fontFamily: "inherit",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                textAlign: "left",
              }}
            >
              <span>
                {t("weaknessCta")}:{" "}
                <strong style={{ fontWeight: 600 }}>
                  {tErrLabel(topWeakness.code as "SIGN_LOST")}
                </strong>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--warn)" }}>→</span>
            </button>
          )}
        </div>

        {/* History or Empty Guide */}
        {history.length > 0 ? (
          <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--t3)" }}>
              {t("historyTitle")}
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {history.slice(0, 3).map((item, idx) => {
                const rowInner = (
                  <>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--t3)" }}>
                    0{idx + 1}
                  </span>
                  <div style={{ display: "grid", rowGap: "3px", minWidth: 0 }}>
                    <span style={{ fontSize: "15px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.topicTitle || item.canonical || t("fallbackTopic")}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--t3)" }}>
                      {item.completed ? t("historyDone") : t("historyPaused", { step: item.currentStepIndex || 1 })}
                    </span>
                  </div>
                  {!item.completed ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--acc)" }}>
                      {t("historyRetry")}
                    </span>
                  ) : (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--t3)" }} />
                  )}
                  </>
                );
                const rowStyle = {
                  display: "grid",
                  gridTemplateColumns: "28px 1fr auto",
                  alignItems: "center",
                  gap: "14px",
                  minHeight: "72px",
                  padding: "0 16px",
                  border: "1px solid var(--bor)",
                  borderRadius: "var(--rad)",
                  background: "var(--sur)",
                  color: "var(--t1)",
                  fontFamily: "inherit",
                  textAlign: "left" as const,
                };
                if (item.completed) {
                  return (
                    <div key={item.id} style={rowStyle}>
                      {rowInner}
                    </div>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push("/kamera")}
                    style={{ ...rowStyle, cursor: "pointer" }}
                  >
                    {rowInner}
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--t3)" }}>
              {t("emptyTitle")}
            </span>
            <div style={{ display: "grid", rowGap: "6px" }}>
              <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "20px", lineHeight: 1.3, color: "var(--t1)" }}>
                {t("emptyHeading")}
              </span>
              <span style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--t2)" }}>
                {t("emptyBody")}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "48px", padding: "0 16px", border: "1px dashed var(--bor)", borderRadius: "var(--rad)", fontSize: "14px", color: "var(--t3)" }}>
                <span style={{ fontFamily: "var(--font-mono)" }}>01</span>{t("emptyStep1")}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "48px", padding: "0 16px", border: "1px dashed var(--bor)", borderRadius: "var(--rad)", fontSize: "14px", color: "var(--t3)" }}>
                <span style={{ fontFamily: "var(--font-mono)" }}>02</span>{t("emptyStep2")}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "48px", padding: "0 16px", border: "1px dashed var(--bor)", borderRadius: "var(--rad)", fontSize: "14px", color: "var(--t3)" }}>
                <span style={{ fontFamily: "var(--font-mono)" }}>03</span>{t("emptyStep3")}
              </span>
            </div>
          </section>
        )}

        {/* 7-Day Activity Chart */}
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--t3)" }}>
            {t("weekTitle")}
          </span>
          <div
            style={{
              padding: "16px",
              border: "1px solid var(--bor)",
              borderRadius: "var(--rad)",
              background: "var(--sur)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", alignItems: "end", height: "56px" }}>
              {weeklyData.map((cnt, i) => {
                const heightPct = Math.max(15, Math.round((cnt / maxWeekly) * 100));
                const isMax = cnt === maxWeekly && cnt > 0;
                return (
                  <span
                    key={i}
                    style={{
                      height: `${heightPct}%`,
                      borderRadius: "var(--radsm)",
                      background: cnt === 0 ? "var(--bor)" : isMax ? "var(--acc)" : "var(--accsoft)",
                      transition: "height 380ms ease",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--t3)", textAlign: "center" }}>
                  {tWeek(String(i) as "0")}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
