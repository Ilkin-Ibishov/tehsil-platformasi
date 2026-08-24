"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getStoredProfile } from "@/lib/profile/storage";
import type { ProfileData } from "@/lib/profile/types";

export function AppHeader({
  customTitle,
  customBadge,
  rightAction,
}: {
  customTitle?: string;
  customBadge?: string;
  rightAction?: React.ReactNode;
}) {
  const tNav = useTranslations("nav");
  const tDay = useTranslations("weekdays");
  const tProfil = useTranslations("profil");
  const [profile] = useState<ProfileData>(() => getStoredProfile());

  const dayName = tDay(String(new Date().getDay()) as "0");
  const gradeText = tProfil("gradeBadge", { grade: profile.grade });
  const title = customTitle || `${dayName} · ${gradeText}`;
  const badge = customBadge || (profile.inviteCode ? profile.inviteCode.toUpperCase() : tNav("profileBadge"));

  return (
    <header
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
        {title}
      </span>

      {rightAction ? (
        rightAction
      ) : (
        <Link
          href="/profil"
          title={tNav("profileLink")}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: "var(--warn)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>{badge}</span>
        </Link>
      )}
    </header>
  );
}
