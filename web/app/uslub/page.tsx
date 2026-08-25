"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getStoredProfile, saveProfile } from "@/lib/profile/storage";
import type { PedagogicalTone } from "@/lib/profile/types";
import { AppHeader } from "@/components/nav/AppHeader";
import { BottomNav } from "@/components/nav/BottomNav";

export default function UslubPage() {
  const t = useTranslations("uslub");
  const [selectedTone, setSelectedTone] = useState<PedagogicalTone>(() => getStoredProfile().pedagogicalTone);
  const [savedToast, setSavedToast] = useState(false);

  function handleSelect(tone: PedagogicalTone) {
    setSelectedTone(tone);
    saveProfile({ pedagogicalTone: tone });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  }

  const tones: {
    code: PedagogicalTone;
    title: string;
    badge: string;
    desc: string;
    sample: string;
  }[] = [
    {
      code: "dostyana",
      title: t("friendlyTitle"),
      badge: t("friendlyBadge"),
      desc: t("friendlyDesc"),
      sample: t("friendlySample"),
    },
    {
      code: "yetkin",
      title: t("academicTitle"),
      badge: t("academicBadge"),
      desc: t("academicDesc"),
      sample: t("academicSample"),
    },
    {
      code: "qisa",
      title: t("conciseTitle"),
      badge: t("conciseBadge"),
      desc: t("conciseDesc"),
      sample: t("conciseSample"),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <AppHeader customTitle={t("headerLabel")} customBadge={t("tuneBadge")} />

      <main
        style={{
          flex: 1,
          padding: "24px var(--page-pad-x) 32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div style={{ display: "grid", rowGap: "6px" }}>
          <h1
            style={{
              fontFamily: "var(--hfont)",
              fontWeight: "var(--hweight)" as unknown as number,
              fontSize: "var(--hsize)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--t1)",
            }}
          >
            {t("title")}
          </h1>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--t2)" }}>
            {t("subtitle")}
          </p>
        </div>

        {savedToast && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radsm)",
              background: "var(--accsoft)",
              border: "1px solid var(--acc)",
              color: "var(--acc)",
              fontSize: "14px",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            ✓ {t("saveSuccess")}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tones.map((item) => {
            const isSelected = selectedTone === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "18px",
                  border: isSelected ? "2px solid var(--acc)" : "1px solid var(--bor)",
                  borderRadius: "var(--rad)",
                  background: isSelected ? "var(--sur)" : "var(--bg)",
                  color: "var(--t1)",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "border-color 180ms ease, background 180ms ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "17px", fontWeight: 700 }}>{item.title}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        letterSpacing: "0.04em",
                        padding: "2px 6px",
                        borderRadius: "var(--radsm)",
                        border: isSelected ? "1px solid var(--acc)" : "1px solid var(--bor)",
                        color: isSelected ? "var(--acc)" : "var(--t3)",
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: isSelected ? "6px solid var(--acc)" : "2px solid var(--bor)",
                      background: "transparent",
                    }}
                  />
                </div>

                <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--t2)" }}>
                  {item.desc}
                </span>

                {/* Live Formula Preview Box */}
                <div
                  style={{
                    marginTop: "4px",
                    padding: "12px 14px",
                    borderRadius: "var(--radsm)",
                    background: "var(--accsoft)",
                    border: "1px solid var(--bor)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--t3)" }}>
                      {t("sampleLabel")}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--acc)" }}>
                      {t("sampleFormula")}
                    </span>
                  </div>
                  <span style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--t1)", fontStyle: "italic" }}>
                    &ldquo;{item.sample}&rdquo;
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
