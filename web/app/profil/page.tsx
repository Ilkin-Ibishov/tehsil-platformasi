"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getStoredProfile, saveProfile, getProgressReport } from "@/lib/profile/storage";
import { applyVisualToneFromProfile } from "@/components/ThemeToneSync";
import type { ProfileData, ProgressReportData } from "@/lib/profile/types";
import { StatCard } from "@/components/profil/StatCard";
import { WeaknessDiagnosis } from "@/components/profil/WeaknessDiagnosis";
import { TopicMastery } from "@/components/profil/TopicMastery";
import { BottomNav } from "@/components/nav/BottomNav";
import { getStoredInviteCode, clearStoredInviteCode } from "@/components/kamera/InviteGate";

export default function ProfilePage() {
  const t = useTranslations("profil");
  const [profile, setProfile] = useState<ProfileData>(() => getStoredProfile());
  const [report] = useState<ProgressReportData>(() => getProgressReport());
  const [copied, setCopied] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [inviteCode] = useState<string | null>(() => getStoredInviteCode());

  const router = useRouter();

  function handleEditName() {
    const nextName = window.prompt(t("editNamePrompt"), profile.fullName || "");
    if (nextName !== null) {
      const updated = saveProfile({ fullName: nextName.trim() });
      setProfile(updated);
    }
  }

  function handleReRunOnboarding() {
    saveProfile({ onboarded: false });
    router.push("/onboarding");
  }

  function handleCopyInvite() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback
    });
  }

  function handleResetCode() {
    clearStoredInviteCode();
    router.push("/kamera");
  }

  function handleGradeChange(newGrade: number) {
    const updated = saveProfile({ grade: newGrade });
    setProfile(updated);
    applyVisualToneFromProfile();
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: t("shareTitle"),
        text: t("shareBody", {
          grade: profile.grade,
          solves: report.completedCount,
        }),
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      });
    }
  }

  const toneLabel =
    profile.pedagogicalTone === "dostyana"
      ? t("toneFriendly")
      : profile.pedagogicalTone === "qisa"
        ? t("toneConcise")
        : t("toneAcademic");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "12px",
          padding: "18px var(--page-pad-x) 0",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            letterSpacing: "0.1em",
            color: "var(--t3)",
            textTransform: "uppercase",
          }}
        >
          {profile.fullName ? `${profile.fullName.toUpperCase()} · ` : ""}
          {t("gradeBadge", { grade: profile.grade })}
        </span>
      </div>

      <main
        style={{
          flex: 1,
          padding: "24px var(--page-pad-x) 32px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {/* Main Stats */}
        <StatCard report={report} />

        {/* Weakness Diagnosis */}
        <WeaknessDiagnosis errors={report.repeatedErrors} attemptCount={report.completedCount} />

        {/* Topic Mastery */}
        <TopicMastery topics={report.topicMasteries} />

        {/* Settings & Account Management */}
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              color: "var(--t3)",
            }}
          >
            {t("settingsTitle")}
          </span>

          <div
            style={{
              border: "1px solid var(--bor)",
              borderRadius: "var(--rad)",
              background: "var(--sur)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* Full Name */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "grid", rowGap: "2px" }}>
                <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("fullNameLabel")}</span>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--t1)" }}>
                  {profile.fullName || t("notSet")}
                </span>
              </div>
              <button
                type="button"
                onClick={handleEditName}
                style={{
                  minHeight: "44px",
                  padding: "0 12px",
                  border: "1px solid var(--bor)",
                  borderRadius: "var(--radsm)",
                  background: "transparent",
                  color: "var(--t2)",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {t("editName")}
              </button>
            </div>

            <div style={{ height: "1px", background: "var(--bor)" }} />

            {/* Invite Code */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "grid", rowGap: "2px" }}>
                <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("inviteCodeLabel")}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 600, color: "var(--t1)" }}>
                  {inviteCode || t("inviteDefault")}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {inviteCode && (
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    style={{
                      minHeight: "44px",
                      padding: "0 12px",
                      border: "1px solid var(--bor)",
                      borderRadius: "var(--radsm)",
                      background: "transparent",
                      color: copied ? "var(--acc)" : "var(--t2)",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? t("copied") : t("copyCode")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetCode}
                  style={{
                    minHeight: "44px",
                    padding: "0 12px",
                    border: "1px solid var(--bor)",
                    borderRadius: "var(--radsm)",
                    background: "transparent",
                    color: "var(--t2)",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {t("resetCode")}
                </button>
              </div>
            </div>

            <div style={{ height: "1px", background: "var(--bor)" }} />

            {/* Grade Switcher */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("gradeLabel")}</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                {[5, 6, 7, 8, 9, 10, 11].map((g) => {
                  const isSelected = profile.grade === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGradeChange(g)}
                      style={{
                        minHeight: "44px",
                        border: isSelected ? "2px solid var(--acc)" : "1px solid var(--bor)",
                        borderRadius: "var(--radsm)",
                        background: isSelected ? "var(--accsoft)" : "transparent",
                        color: isSelected ? "var(--acc)" : "var(--t1)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "14px",
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: "1px", background: "var(--bor)" }} />

            {/* Tone Selector Link */}
            <Link
              href="/uslub"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "grid", rowGap: "2px" }}>
                <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("toneLabel")}</span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--t1)" }}>
                  {toneLabel}
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", color: "var(--acc)" }}>{t("changeTone")}</span>
            </Link>

            <div style={{ height: "1px", background: "var(--bor)" }} />

            {/* Re-run Onboarding */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", color: "var(--t2)" }}>{t("onboardingLabel")}</span>
              <button
                type="button"
                onClick={handleReRunOnboarding}
                style={{
                  minHeight: "44px",
                  padding: "6px 12px",
                  border: "1px solid var(--bor)",
                  borderRadius: "var(--radsm)",
                  background: "transparent",
                  color: "var(--acc)",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("reRunOnboarding")}
              </button>
            </div>
          </div>

          {/* Share Action */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              width: "100%",
              minHeight: "52px",
              border: "1px solid var(--bor)",
              borderRadius: "var(--rad)",
              background: "var(--sur)",
              color: "var(--t1)",
              fontFamily: "inherit",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "6px",
            }}
          >
            <span>{shareToast ? t("shareCopied") : t("shareReport")}</span>
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
