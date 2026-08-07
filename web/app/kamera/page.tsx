"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trackEvent, setAttemptId, getDeviceId } from "@/lib/telemetry";
import { uuidv4 } from "@/lib/telemetry/uuid";
import { CaptureView, type Captured } from "@/components/kamera/CaptureView";
import { CropView } from "@/components/kamera/CropView";
import { InviteGate, getStoredInviteCode, clearStoredInviteCode } from "@/components/kamera/InviteGate";

type Stage = "invite" | "capture" | "crop" | "submitting" | "done";

export default function KameraPage() {
  const t = useTranslations("solve");
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(() => (getStoredInviteCode() ? "capture" : "invite"));
  const [inviteCode, setInviteCode] = useState<string | null>(() => getStoredInviteCode());
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [inviteError, setInviteError] = useState(false);
  const screenOpenedFired = useRef(false);

  useEffect(() => {
    if (stage === "invite" || screenOpenedFired.current) return;
    screenOpenedFired.current = true;
    setAttemptId(uuidv4());
    trackEvent("capture.screen_opened", {});
  }, [stage]);

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
      form.append("device_id", getDeviceId());
      form.append("invite_code", inviteCode ?? "");
      form.append("grade", "11");
      form.append("locale", "az");
      form.append("subject", "math");

      const res = await fetch("/api/solve", { method: "POST", body: form });

      if (res.status === 403) {
        // Server dəvət kodunu rədd etdi — saxlanılan kodu sil, yenidən soruşulsun.
        clearStoredInviteCode();
        trackEvent("solve.failed", { reason: "invalid_invite", http_status: 403, attempts: 1 });
        setInviteError(true);
        setStage("invite");
        return;
      }
      if (res.status === 429) {
        const body = await res.json().catch(() => null);
        trackEvent("limit.blocked", { daily_count: body?.daily_count ?? null });
        setStage("done");
        return;
      }
      if (!res.ok) {
        trackEvent("solve.failed", { reason: "http_error", http_status: res.status, attempts: 1 });
        setStage("done");
        return;
      }

      const body = await res.json();
      if (body.status && body.status !== "ok") {
        trackEvent("refusal.shown", { status: body.status, reason_code: body.status });
      } else {
        trackEvent("solve.response", {
          status: body.status ?? "ok",
          ocr_confidence: body.ocr_confidence ?? null,
          latency_ms: body.meta?.latency_ms ?? null,
          match_path: body.match_path ?? null,
          cost_usd: body.meta?.cost_usd ?? null,
          tokens_in: body.meta?.tokens_in ?? null,
          tokens_out: body.meta?.tokens_out ?? null,
          step_count: Array.isArray(body.steps) ? body.steps.length : null,
        });
      }
      // Həll ekranı (addımların göstərilməsi) S4-dədir — bura yalnız API cavabını qəbul edir.
    } catch {
      trackEvent("solve.failed", { reason: "network_error", http_status: null, attempts: 1 });
    }

    setStage("done");
  }

  if (stage === "invite") {
    return (
      <>
        {inviteError && (
          <p style={{ color: "var(--warn)", padding: "8px var(--page-pad-x) 0", margin: 0, fontSize: 13 }}>
            {t("inviteInvalid")}
          </p>
        )}
        <InviteGate
          onCode={(code) => {
            setInviteCode(code);
            setInviteError(false);
            setStage("capture");
          }}
        />
      </>
    );
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
