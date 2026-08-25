"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveProfile } from "@/lib/profile/storage";
import { applyVisualToneFromProfile } from "@/components/ThemeToneSync";
import type { Locale, Role, Goal } from "@/lib/profile/types";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [fullName, setFullName] = useState<string>("");
  const [locale, setLocale] = useState<Locale>("az");
  const [role, setRole] = useState<Role>("sagird");
  const [grade, setGrade] = useState<number>(9);
  const [goal, setGoal] = useState<Goal>("dim");

  function persistAndGo(path: string, opts: { fullName: string; locale: Locale; role: Role; grade: number; goal: Goal }) {
    saveProfile({
      fullName: opts.fullName,
      locale: opts.locale,
      role: opts.role,
      grade: opts.grade,
      goal: opts.goal,
      onboarded: true,
    });
    applyVisualToneFromProfile();
    router.push(path);
  }

  function handleSkip() {
    persistAndGo("/", { fullName: fullName || "", locale: "az", role: "sagird", grade: 9, goal: "dim" });
  }

  function handleFinish() {
    persistAndGo("/kamera", { fullName, locale, role, grade, goal });
  }

  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5);
  }

  const p1 = step >= 1 ? "var(--acc)" : "var(--bor)";
  const p2 = step >= 2 ? "var(--acc)" : "var(--bor)";
  const p3 = step >= 3 ? "var(--acc)" : "var(--bor)";
  const p4 = step >= 4 ? "var(--acc)" : "var(--bor)";
  const p5 = step >= 5 ? "var(--acc)" : "var(--bor)";

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
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px var(--page-pad-x) 0" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--t3)" }}>
          {t("headerLabel")}
        </span>
        <button
          type="button"
          onClick={handleSkip}
          style={{ minHeight: "44px", padding: 0, border: "none", background: "transparent", color: "var(--t3)", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}
        >
          {t("skip")}
        </button>
      </div>

      {/* Progress Bars */}
      <div style={{ display: "flex", gap: "6px", padding: "12px var(--page-pad-x) 0" }}>
        <span style={{ height: "6px", borderRadius: "99px", flex: 1, transition: "background 380ms cubic-bezier(0.16,1,0.3,1)", background: p1 }} />
        <span style={{ height: "6px", borderRadius: "99px", flex: 1, transition: "background 380ms cubic-bezier(0.16,1,0.3,1)", background: p2 }} />
        <span style={{ height: "6px", borderRadius: "99px", flex: 1, transition: "background 380ms cubic-bezier(0.16,1,0.3,1)", background: p3 }} />
        <span style={{ height: "6px", borderRadius: "99px", flex: 1, transition: "background 380ms cubic-bezier(0.16,1,0.3,1)", background: p4 }} />
        <span style={{ height: "6px", borderRadius: "99px", flex: 1, transition: "background 380ms cubic-bezier(0.16,1,0.3,1)", background: p5 }} />
      </div>

      <div style={{ flex: 1, padding: "28px var(--page-pad-x) 24px" }}>
        {/* Step 1: Full Name */}
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
                  if (e.key === "Enter") setStep(2);
                }}
                placeholder={t("stepNamePlaceholder")}
                autoFocus
                style={{
                  width: "100%",
                  minHeight: "56px",
                  padding: "0 18px",
                  border: "1px solid var(--bor)",
                  borderRadius: "var(--rad)",
                  background: "var(--sur)",
                  color: "var(--t1)",
                  fontFamily: "inherit",
                  fontSize: "16px", // >=16px prevents iOS zoom
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <button
                type="button"
                onClick={() => setStep(2)}
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

        {/* Step 2: Language */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={goBack}
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
                  {t("step1Counter")}
                </span>
                <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--t1)" }}>
                  {t("step1Title")}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--t2)" }}>
              {t("step1Body")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { code: "az", label: "Azərbaycan", sub: "AZ" },
                { code: "ru", label: "Русский", sub: "RU" },
                { code: "en", label: "English", sub: "EN" },
                { code: "tr", label: "Türkçe", sub: "TR" },
              ].map((item) => {
                const isSel = locale === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLocale(item.code as Locale);
                      setStep(3);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: "60px",
                      padding: "0 18px",
                      border: isSel ? "2px solid var(--acc)" : "1px solid var(--bor)",
                      borderRadius: "var(--rad)",
                      background: isSel ? "var(--accsoft)" : "var(--sur)",
                      color: "var(--t1)",
                      fontFamily: "inherit",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: isSel ? "var(--acc)" : "var(--t3)" }}>{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Role */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={goBack}
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
                  {t("step2Counter")}
                </span>
                <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--t1)" }}>
                  {t("step2Title")}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--t2)" }}>
              {t("step2Body")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setRole("sagird");
                  setStep(4);
                }}
                style={{
                  display: "grid",
                  rowGap: "6px",
                  minHeight: "86px",
                  padding: "16px 18px",
                  border: role === "sagird" ? "2px solid var(--acc)" : "1px solid var(--bor)",
                  borderRadius: "var(--rad)",
                  background: role === "sagird" ? "var(--accsoft)" : "var(--sur)",
                  color: "var(--t1)",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "17px", fontWeight: 600 }}>{t("roleStudentTitle")}</span>
                <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("roleStudentSub")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("valideyn");
                  setStep(4);
                }}
                style={{
                  display: "grid",
                  rowGap: "6px",
                  minHeight: "86px",
                  padding: "16px 18px",
                  border: role === "valideyn" ? "2px solid var(--acc)" : "1px solid var(--bor)",
                  borderRadius: "var(--rad)",
                  background: role === "valideyn" ? "var(--accsoft)" : "var(--sur)",
                  color: "var(--t1)",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "17px", fontWeight: 600 }}>{t("roleParentTitle")}</span>
                <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("roleParentSub")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Grade */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={goBack}
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
                  {t("step3Counter")}
                </span>
                <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--t1)" }}>
                  {t("step3Title")}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--t2)" }}>
              {t("step3Body")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {[5, 6, 7, 8, 9, 10, 11].map((g) => {
                const isSel = grade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGrade(g);
                      setStep(5);
                    }}
                    style={{
                      minHeight: "56px",
                      border: isSel ? "2px solid var(--acc)" : "1px solid var(--bor)",
                      borderRadius: "var(--rad)",
                      background: isSel ? "var(--accsoft)" : "var(--sur)",
                      color: isSel ? "var(--acc)" : "var(--t1)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "17px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Goal & Finish */}
        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={goBack}
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
                  {t("step4Counter")}
                </span>
                <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--t1)" }}>
                  {t("step4Title")}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--t2)" }}>
              {t("step4Body")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { code: "dim", label: t("goalDim") },
                { code: "buraxilis", label: t("goalBuraxilis") },
                { code: "mekteb", label: t("goalMekteb") },
                { code: "olimpiada", label: t("goalOlimpiada") },
              ].map((item) => {
                const isSel = goal === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setGoal(item.code as Goal)}
                    style={{
                      minHeight: "56px",
                      padding: "0 18px",
                      border: isSel ? "2px solid var(--acc)" : "1px solid var(--bor)",
                      borderRadius: "var(--rad)",
                      background: isSel ? "var(--accsoft)" : "var(--sur)",
                      color: "var(--t1)",
                      fontFamily: "inherit",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleFinish}
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
                marginTop: "12px",
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
