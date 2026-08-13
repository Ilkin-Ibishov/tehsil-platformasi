"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/telemetry";

const DEVICE_ID_KEY = "th_device_id";

export default function HomePage() {
  const t = useTranslations("home");
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return; // React StrictMode-da effect iki dəfə işə düşür — bir hadisə
    fired.current = true;

    let coldStart = true;
    try {
      coldStart = localStorage.getItem(DEVICE_ID_KEY) === null;
    } catch {
      // localStorage yoxdursa cold_start-ı təhlükəsiz defolt kimi saxla
    }

    // grade/profil hələ yoxdur (onboarding sonrakı sprintin işidir) — bilinənə qədər null.
    trackEvent("app.opened", { cold_start: coldStart, locale: "az", grade: null, tone: "yetkin" });
  }, []);

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px var(--page-pad-x)" }}>
      <h1
        style={{
          fontFamily: "var(--hfont)",
          fontWeight: "var(--hweight)" as unknown as number,
          fontSize: "var(--hsize)",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          maxWidth: "24ch",
          margin: "24px 0 0",
        }}
      >
        {t("greeting")}
      </h1>

      <div style={{ flex: 1 }} />

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
          marginBottom: "24px",
        }}
      >
        <span style={{ display: "grid", rowGap: "4px" }}>
          <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: 22 }}>
            {t("cta")}
          </span>
          <span style={{ fontSize: 14, opacity: 0.8 }}>{t("ctaSub")}</span>
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22 }}>→</span>
      </button>

      {/* ClickUp 86eykhve0: bankın 217 sualı kameraDAN AYRI giriş nöqtəsi tələb edir —
          onsuz Faza 1 qapısının "100+ real həll" metrikası yalnız kamera axınından yığılır. */}
      <button
        type="button"
        onClick={() => router.push("/bank")}
        style={{
          width: "100%",
          minHeight: 56,
          border: "1px solid var(--bor)",
          borderRadius: "var(--rad)",
          background: "transparent",
          color: "var(--t1)",
          fontFamily: "inherit",
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          marginBottom: "12px",
        }}
      >
        <span>{t("bankCta")}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--t3)" }}>→</span>
      </button>
    </main>
  );
}
