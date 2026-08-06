"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trackEvent, setAttemptId } from "@/lib/telemetry";
import { uuidv4 } from "@/lib/telemetry/uuid";
import { CaptureView, type Captured } from "@/components/kamera/CaptureView";
import { CropView } from "@/components/kamera/CropView";

type Stage = "capture" | "crop" | "submitting" | "done";

export default function KameraPage() {
  const t = useTranslations("solve");
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("capture");
  const [captured, setCaptured] = useState<Captured | null>(null);
  const screenOpenedFired = useRef(false);

  useEffect(() => {
    if (screenOpenedFired.current) return;
    screenOpenedFired.current = true;
    setAttemptId(uuidv4());
    trackEvent("capture.screen_opened", {});
  }, []);

  function goHome() {
    setAttemptId(undefined);
    router.push("/");
  }

  async function handleConfirmed(result: { blob: Blob; width: number; height: number }) {
    setStage("submitting");
    trackEvent("solve.requested", { image_bytes: result.blob.size });

    try {
      const form = new FormData();
      form.append("image", result.blob, "problem.jpg");
      form.append("grade", "11");
      form.append("locale", "az");

      const res = await fetch("/api/solve", { method: "POST", body: form });
      if (!res.ok) {
        trackEvent("solve.failed", { reason: "http_error", http_status: res.status, attempts: 1 });
      }
      // S2-də cavab məzmunu istifadə olunmur (stub) — S3-də real emal başlayır.
    } catch {
      trackEvent("solve.failed", { reason: "network_error", http_status: null, attempts: 1 });
    }

    setStage("done");
  }

  if (stage === "capture") {
    return (
      <CaptureView
        onCaptured={(c) => {
          setCaptured(c);
          setStage("crop");
        }}
        onCancel={goHome}
      />
    );
  }

  if ((stage === "crop" || stage === "submitting") && captured) {
    if (stage === "submitting") {
      return (
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: 20 }}>
            {t("sendingTitle")}
          </span>
        </main>
      );
    }
    return <CropView canvas={captured.canvas} onConfirmed={handleConfirmed} onCancel={() => setStage("capture")} />;
  }

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: "24px var(--page-pad-x)" }}>
      <h1 style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", margin: 0 }}>
        {t("doneTitle")}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)", margin: 0 }}>{t("doneBody")}</p>
      <button
        type="button"
        onClick={goHome}
        style={{ alignSelf: "flex-start", minHeight: "var(--tap)", padding: "0 22px", border: "none", borderRadius: "var(--rad)", background: "var(--acc)", color: "var(--accink)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
      >
        {t("doneHome")}
      </button>
    </main>
  );
}
