"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// Dəvət kodu ictimai URL-in arxasındakı ödənişli açarı qoruyur (docs/PHASE-1.md S3, ADR-012).
// Qapıda `/api/invite/check` yoxlayır (ClickUp 86eymrm6g) — səhv kod localStorage-a
// yazılmır. Sonrakı API-lər yenə 403 qaytara bilər (köhnə saxlanılmış kod); o halda
// valideyn `invalid` ötürür.
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

type GateError = { kind: "invalid" } | { kind: "network" };

export function InviteGate({
  onCode,
  invalid = false,
}: {
  onCode: (code: string) => void;
  invalid?: boolean;
}) {
  const t = useTranslations("invite");
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<GateError | null>(invalid ? { kind: "invalid" } : null);

  useEffect(() => {
    if (invalid) setError({ kind: "invalid" });
  }, [invalid]);

  async function submit() {
    const code = value.trim();
    if (!code || checking) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/invite/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code }),
      });
      if (res.status === 403) {
        setError({ kind: "invalid" });
        return;
      }
      if (!res.ok) {
        setError({ kind: "network" });
        return;
      }
      try {
        localStorage.setItem(INVITE_CODE_KEY, code);
      } catch {
        // localStorage yoxdursa yenə davam et — server yoxlaması əsas qoruma
      }
      onCode(code);
    } catch {
      setError({ kind: "network" });
    } finally {
      setChecking(false);
    }
  }

  const errorText = error?.kind === "invalid" ? t("invalid") : error?.kind === "network" ? t("networkError") : null;

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: "24px var(--page-pad-x)" }}>
      <h1 style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", margin: 0 }}>
        {t("title")}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)", margin: 0 }}>{t("body")}</p>
      {errorText && (
        <p role="alert" style={{ color: "var(--warn)", margin: 0, fontSize: 13 }}>
          {errorText}
        </p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("placeholder")}
        autoComplete="off"
        data-testid="invite-code-input"
        autoCapitalize="off"
        spellCheck={false}
        aria-invalid={error?.kind === "invalid"}
        disabled={checking}
        style={{
          minHeight: "var(--tap)",
          padding: "0 16px",
          borderRadius: "var(--rad)",
          border: error ? "1px solid var(--warn)" : "1px solid var(--bor)",
          background: "var(--sur)",
          color: "var(--t1)",
          fontSize: 16,
        }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={checking || !value.trim()}
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
          cursor: checking || !value.trim() ? "not-allowed" : "pointer",
          opacity: checking || !value.trim() ? 0.5 : 1,
        }}
      >
        {checking ? t("checking") : t("submit")}
      </button>
      {/* SYSTEM-REVIEW §A3 (HANDOFF 41): quraşdırılmamış saytın localStorage-ı iOS Safari-də
          7 gün istifadəsizlikdən sonra silinir — məhz retensiya qapısının ölçdüyü pəncərə.
          PWA kimi quraşdırılanda ITP silinməsi tətbiq olunmur. */}
      <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--t3)", margin: 0 }}>{t("pwaHint")}</p>
    </main>
  );
}
