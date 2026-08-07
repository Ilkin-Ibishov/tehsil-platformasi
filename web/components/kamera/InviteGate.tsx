"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Dəvət kodu ictimai URL-in arxasındakı ödənişli açarı qoruyur (docs/PHASE-1.md S3, ADR-012).
// Server yoxlayır (/api/solve, 403 → invalid_invite) — bura yalnız sadə giriş forması,
// təsdiqlənmiş kodu localStorage-da saxlayır ki, hər dəfə soruşulmasın.
const INVITE_CODE_KEY = "th_invite_code";

export function getStoredInviteCode(): string | null {
  try {
    return localStorage.getItem(INVITE_CODE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredInviteCode(): void {
  try {
    localStorage.removeItem(INVITE_CODE_KEY);
  } catch {
    // localStorage yoxdursa görməzdən gəl
  }
}

export function InviteGate({ onCode }: { onCode: (code: string) => void }) {
  const t = useTranslations("invite");
  const [value, setValue] = useState("");

  function submit() {
    const code = value.trim();
    if (!code) return;
    try {
      localStorage.setItem(INVITE_CODE_KEY, code);
    } catch {
      // localStorage yoxdursa yenə davam et — server yoxlaması əsas qoruma
    }
    onCode(code);
  }

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: "24px var(--page-pad-x)" }}>
      <h1 style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", margin: 0 }}>
        {t("title")}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)", margin: 0 }}>{t("body")}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("placeholder")}
        style={{
          minHeight: "var(--tap)",
          padding: "0 16px",
          borderRadius: "var(--rad)",
          border: "1px solid var(--bor)",
          background: "var(--sur)",
          color: "var(--t1)",
          fontSize: 16,
        }}
      />
      <button
        type="button"
        onClick={submit}
        style={{
          alignSelf: "flex-start",
          minHeight: "var(--tap)",
          padding: "0 22px",
          border: "none",
          borderRadius: "var(--rad)",
          background: "var(--acc)",
          color: "var(--accink)",
          fontFamily: "inherit",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {t("submit")}
      </button>
    </main>
  );
}
