"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatMathProse } from "@/lib/math-format";

// ClickUp 86eykj7x2 / ADR-020 — kaskadın Qat 1-i qayıtdıqdan (~1s) SONRA göstərilir.
// «Bu məsələni oxudum: … Düzdür?» — taskın üç faydası: (1) boş gözləməni məzmunla doldurur,
// (2) OCR səhvini dərhal düzəltmə imkanı verir (şəklə qayıtmadan), (3) şagirdi məsələni öz
// sözləri ilə oxumağa vadar edir (pedaqoji addım).
//
// Ekranda unicode (formatMathProse); «Düzdür» dəyişməyibsə ORİJİNAL canonical gedir —
// əks halda fon `/finish` «düzəliş» sayılıb kəsilər.
export function TranscriptConfirmView({
  canonical,
  onConfirm,
  onReject,
}: {
  canonical: string;
  onConfirm: (finalText: string) => void;
  onReject: () => void;
}) {
  const t = useTranslations("solve");
  const displayed = formatMathProse(canonical);
  const [text, setText] = useState(displayed);

  function confirm() {
    const trimmed = text.trim();
    onConfirm(trimmed === displayed.trim() ? canonical : trimmed);
  }

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "24px var(--page-pad-x)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--hfont)",
          fontWeight: "var(--hweight)" as unknown as number,
          fontSize: "var(--hsize)",
          margin: 0,
        }}
      >
        {t("confirmTitle")}
      </h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          resize: "vertical",
          border: "1px solid var(--bor)",
          borderRadius: "var(--rad)",
          background: "var(--sur)",
          color: "var(--t1)",
          fontFamily: "var(--font-mono)",
          fontSize: 15,
          lineHeight: 1.6,
          padding: "12px 14px",
          boxSizing: "border-box",
        }}
      />
      <p style={{ margin: 0, fontSize: 14, color: "var(--t2)" }}>{t("confirmQuestion")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          disabled={text.trim().length === 0}
          onClick={confirm}
          style={{
            minHeight: "var(--tap)",
            padding: "0 22px",
            border: "none",
            borderRadius: "var(--rad)",
            background: "var(--acc)",
            color: "var(--accink)",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 700,
            cursor: text.trim().length === 0 ? "not-allowed" : "pointer",
            opacity: text.trim().length === 0 ? 0.5 : 1,
          }}
        >
          {t("confirmYes")}
        </button>
        <button
          type="button"
          onClick={onReject}
          style={{
            alignSelf: "flex-start",
            minHeight: 44,
            padding: 0,
            border: "none",
            background: "transparent",
            color: "var(--t2)",
            fontFamily: "inherit",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {t("confirmReject")}
        </button>
      </div>
    </main>
  );
}
