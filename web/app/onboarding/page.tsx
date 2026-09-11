"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getStoredProfile, saveProfile } from "@/lib/profile/storage";
import { applyVisualToneFromProfile } from "@/components/ThemeToneSync";
import { trackEvent } from "@/lib/telemetry";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const startedRef = useRef(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState<string>(() => getStoredProfile().fullName || "");
  const [grade, setGrade] = useState<number>(() => getStoredProfile().grade || 9);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("onboarding.started", {});
    trackEvent("onboarding.step_viewed", { step: 1 });
  }, []);

  function persistAndGo(name: string, nextGrade: number) {
    trackEvent("onboarding.completed", {
      grade: nextGrade,
      has_name: Boolean(name),
    });
    saveProfile({
      fullName: name,
      locale: "az",
      role: "sagird",
      grade: nextGrade,
      onboarded: true,
    });
    applyVisualToneFromProfile();
    router.replace("/");
  }

  function handleSkip() {
    if (step === 1) {
      trackEvent("onboarding.skipped", { at_step: 1 });
      trackEvent("onboarding.step_viewed", { step: 2 });
      setStep(2);
    } else {
      trackEvent("onboarding.skipped", { at_step: 2 });
      persistAndGo(fullName.trim(), grade);
    }
  }

  function goToStep2() {
    trackEvent("onboarding.step_submitted", { step: 1, has_name: Boolean(fullName.trim()) });
    trackEvent("onboarding.step_viewed", { step: 2 });
    setStep(2);
  }

  function goToStep1() {
    trackEvent("onboarding.step_viewed", { step: 1 });
    setStep(1);
  }

  const p1 = "var(--acc)";
  const p2 = step >= 2 ? "var(--acc)" : "var(--bor)";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        color: "var(--t1)",
        display: "flex",
        flexDirection: "column",
        maxWidth: "480px",
        margin: "0 auto",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px var(--page-pad-x) 0" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--t3)" }}>
          {t("headerLabel")}
        </span>
        <button
          type="button"
          onClick={handleSkip}
          style={{ minHeight: "44px", minWidth: "44px", padding: "0 12px", border: "none", background: "transparent", color: "var(--t3)", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}
        >
          {t("skip")}
        </button>
      </div>

      <div style={{ display: "flex", gap: "6px", padding: "12px var(--page-pad-x) 0" }}>
        <span style={{ height: "6px", borderRadius: "99px", flex: 1, transition: "background 380ms cubic-bezier(0.16,1,0.3,1)", background: p1 }} />
        <span style={{ height: "6px", borderRadius: "99px", flex: 1, transition: "background 380ms cubic-bezier(0.16,1,0.3,1)", background: p2 }} />
      </div>

      <div style={{ flex: 1, padding: "28px var(--page-pad-x) 24px" }}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "grid", rowGap: "8px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--acc)" }}>
                {t("stepNameCounter")}
              </span>
              <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--t1)" }}>
                {t("stepNameTitle")}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--t2)" }}>
              {t("stepNameBody")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToStep2();
                }}
                placeholder={t("stepNamePlaceholder")}
                maxLength={50}
                autoCapitalize="words"
                autoComplete="given-name"
                enterKeyHint="next"
                spellCheck={false}
                aria-label={t("stepNameTitle")}
                style={{
                  width: "100%",
                  minHeight: "56px",
                  padding: "0 18px",
                  border: "1px solid var(--bor)",
                  borderRadius: "var(--rad)",
                  background: "var(--sur)",
                  color: "var(--t1)",
                  fontFamily: "inherit",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <button
                type="button"
                onClick={goToStep2}
                style={{
                  width: "100%",
                  minHeight: "56px",
                  border: "none",
                  borderRadius: "var(--rad)",
                  background: "var(--acc)",
                  color: "var(--accink)",
                  fontFamily: "inherit",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                {t("stepNameContinue")} →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={goToStep1}
                aria-label={t("backAria")}
                style={{
                  minHeight: 44,
                  minWidth: 44,
                  padding: 0,
                  border: "1px solid var(--bor)",
                  borderRadius: "var(--radsm)",
                  background: "var(--sur)",
                  color: "var(--t2)",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                ←
              </button>
              <div style={{ display: "grid", rowGap: "4px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--acc)" }}>
                  {t("stepGradeCounter")}
                </span>
                <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--t1)" }}>
                  {t("step3Title")}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--t2)" }}>
              {t("step3Body")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {[5, 6, 7, 8, 9, 10, 11].map((g) => {
                const isSel = grade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    aria-pressed={isSel}
                    aria-label={`${g}-ci sinif`}
                    style={{
                      minHeight: "52px",
                      border: isSel ? "2px solid var(--acc)" : "1px solid var(--bor)",
                      borderRadius: "var(--radsm)",
                      background: isSel ? "var(--accsoft)" : "var(--sur)",
                      color: isSel ? "var(--acc)" : "var(--t1)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "16px",
                      fontWeight: isSel ? 700 : 500,
                      cursor: "pointer",
                      transition: "border-color 160ms ease, background 160ms ease",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderLeft: "3px solid var(--acc)",
                borderRadius: "var(--radsm)",
                background: "var(--accsoft)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 180ms ease",
              }}
            >
              <span style={{ fontSize: "14px", lineHeight: 1.55, color: "var(--t1)" }}>
                {t(`gradeExpl${grade}` as "gradeExpl5")}
              </span>
            </div>

            <button
              type="button"
              onClick={() => persistAndGo(fullName.trim(), grade)}
              style={{
                width: "100%",
                minHeight: "56px",
                border: "none",
                borderRadius: "var(--rad)",
                background: "var(--acc)",
                color: "var(--accink)",
                fontFamily: "inherit",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              {t("finishCta")} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
