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

// HANDOFF (49) §3a: `ADR-014` (təklif, hələ qəbul edilməyib) — triaj çağırışı qayıdanda
// "Sualı oxudum: …" mətni BURAYA (`questionText`) düşəcək. İndi heç bir çağıran ötürmür
// (boş qalır, heç nə render olunmur) — sahə mərhələ mətnindən (`STAGES`) QƏSDƏN ayrılıb ki,
// ADR-014 gələndə struktur dəyişməsin, yalnız marşrutlaşdırma (kamera/page.tsx-də prop ötürülməsi).
export function LoadingView({ questionText }: { questionText?: string }) {
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
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--t3)",
        }}
      >
        {t(stageKey)}
      </span>
      <style>{`@keyframes th-breathe { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.65; } }`}</style>
    </main>
  );
}
