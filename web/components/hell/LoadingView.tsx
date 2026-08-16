"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// ADR-001: ölçülmüş orta latensiya 16.8 saniyədir, "HƏLL QURULUR" boş spinner OLA BİLMƏZ
// (docs/PHASE-1.md S4). Mərhələli mətn elapsed vaxta görə dəyişir — real irəliləyiş göstərmir
// (server bunu bildirmir), amma boş gözləmə hissini qırır.
//
// `solve.waiting_abandoned` BURADA YOX, `kamera/page.tsx`-də izlənir: bu komponent HƏM
// nəticə gələndə (uğur), HƏM səhifə tərk edildikdə (tərk) eyni şəkildə unmount olur —
// öz unmount-undan ikisini ayırd edə bilməz. Əsl "tərk" siqnalı yalnız səhifənin özü
// sökülməsidir, komponentin daxili unmount-u deyil.
const STAGES: { afterMs: number; key: string }[] = [
  { afterMs: 0, key: "stage1" },
  { afterMs: 2500, key: "stage2" },
  { afterMs: 7000, key: "stage3" },
  { afterMs: 13000, key: "stage4" },
];

export type LoadingPreviewStep = {
  index?: number;
  title?: string;
  explanation?: string;
};

// HANDOFF (49) §3a + COST-LATENCY-SAFE-SEQUENCE addım 5: `questionText` təsdiqlənmiş
// canonical; `previewStep` Qat 5 axınından gələn ilk tamamlanmış addımdır (accept YOX).
export function LoadingView({
  questionText,
  previewStep,
}: {
  questionText?: string;
  previewStep?: LoadingPreviewStep | null;
}) {
  const t = useTranslations("hell.loading");
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 400);
    return () => clearInterval(id);
  }, []);

  let stageKey = STAGES[0].key;
  for (const stage of STAGES) {
    if (elapsedMs >= stage.afterMs) stageKey = stage.key;
  }

  return (
    <main style={{ flex: 1, padding: "0 var(--page-pad-x)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
      {questionText && (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>{questionText}</p>
      )}
      {previewStep?.title && previewStep?.explanation ? (
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 16,
            borderRadius: "var(--rad)",
            background: "var(--sur)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--t3)",
            }}
          >
            {t("previewStep")}
            {typeof previewStep.index === "number" ? ` ${previewStep.index}` : ""}
          </span>
          <h2 style={{ margin: 0, fontFamily: "var(--hfont)", fontSize: 18, fontWeight: 700 }}>{previewStep.title}</h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--t1)" }}>{previewStep.explanation}</p>
        </section>
      ) : (
        <>
          <div
            style={{
              height: 56,
              width: "44%",
              borderRadius: "var(--rad)",
              background: "var(--sur)",
              animation: "th-breathe 1400ms ease-in-out infinite both",
            }}
          />
          <div
            style={{
              height: 12,
              width: "86%",
              borderRadius: 99,
              background: "var(--sur)",
              animation: "th-breathe 1400ms ease-in-out infinite both",
              animationDelay: "200ms",
            }}
          />
          <div
            style={{
              height: 12,
              width: "62%",
              borderRadius: 99,
              background: "var(--sur)",
              animation: "th-breathe 1400ms ease-in-out infinite both",
              animationDelay: "400ms",
            }}
          />
        </>
      )}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--t3)",
        }}
      >
        {previewStep?.title ? t("previewMore") : t(stageKey)}
      </span>
      <style>{`@keyframes th-breathe { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.65; } }`}</style>
    </main>
  );
}
