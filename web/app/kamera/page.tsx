"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trackEvent, setAttemptId, getDeviceId } from "@/lib/telemetry";
import { uuidv4 } from "@/lib/telemetry/uuid";
import { CaptureView, type Captured } from "@/components/kamera/CaptureView";
import { CropView } from "@/components/kamera/CropView";
import { InviteGate, getStoredInviteCode, clearStoredInviteCode } from "@/components/kamera/InviteGate";
import { LoadingView } from "@/components/hell/LoadingView";
import { SolveView, type SolveResult } from "@/components/hell/SolveView";

type Stage = "invite" | "capture" | "crop" | "submitting" | "solved" | "refused" | "done";

export default function KameraPage() {
  const t = useTranslations("solve");
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(() => (getStoredInviteCode() ? "capture" : "invite"));
  const [inviteCode, setInviteCode] = useState<string | null>(() => getStoredInviteCode());
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [inviteError, setInviteError] = useState(false);
  const [solution, setSolution] = useState<SolveResult | null>(null);
  const [solutionAttemptId, setSolutionAttemptId] = useState<string | null>(null);
  const [refusalReason, setRefusalReason] = useState<string | null>(null);
  const screenOpenedFired = useRef(false);
  const currentAttemptIdRef = useRef<string | undefined>(undefined);

  // docs/TELEMETRY.md: solve.waiting_abandoned (S7, KRİTİK) — istifadəçi cavab gözləyərkən
  // SƏHİFƏNİN ÖZÜNÜ tərk edir (geri, tab bağlama, marşrut dəyişimi). `pendingSince` sorğu
  // başlayanda vaxt möhürünü saxlayır, cavab gələndə (uğur/xəta fərq etməz) null olur.
  // Yalnız SƏHİFƏ sökülərkən hələ null olmayıbsa yazılır — daxili mərhələ keçidləri
  // (submitting → solved) heç vaxt bunu tetiklə bilmir, çünki onlar `pendingSince`-i
  // cavab gələn kimi təmizləyir, unmount-dan ƏVVƏL.
  const pendingSince = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (pendingSince.current !== null) {
        trackEvent("solve.waiting_abandoned", { waited_ms: Date.now() - pendingSince.current });
      }
    };
  }, []);

  useEffect(() => {
    if (stage === "invite" || screenOpenedFired.current) return;
    screenOpenedFired.current = true;
    const id = uuidv4();
    currentAttemptIdRef.current = id;
    setAttemptId(id);
    trackEvent("capture.screen_opened", {});
  }, [stage]);

  function goHome() {
    setAttemptId(undefined);
    router.push("/");
  }

  function resetToCapture() {
    setSolution(null);
    setSolutionAttemptId(null);
    setRefusalReason(null);
    setCaptured(null);
    const id = uuidv4();
    currentAttemptIdRef.current = id;
    setAttemptId(id);
    setStage("capture");
  }

  async function handleConfirmed(result: { blob: Blob; width: number; height: number }) {
    setStage("submitting");
    pendingSince.current = Date.now();
    trackEvent("solve.requested", { image_bytes: result.blob.size });

    try {
      const form = new FormData();
      form.append("image", result.blob, "problem.jpg");
      form.append("device_id", getDeviceId());
      form.append("invite_code", inviteCode ?? "");
      form.append("grade", "11");
      form.append("locale", "az");
      form.append("subject", "math");
      if (currentAttemptIdRef.current) form.append("attempt_id", currentAttemptIdRef.current);

      const res = await fetch("/api/solve", { method: "POST", body: form });

      if (res.status === 403) {
        // Server dəvət kodunu rədd etdi — saxlanılan kodu sil, yenidən soruşulsun.
        clearStoredInviteCode();
        trackEvent("solve.failed", { reason: "invalid_invite", http_status: 403, attempts: 1 });
        pendingSince.current = null;
        setInviteError(true);
        setStage("invite");
        return;
      }
      if (res.status === 429) {
        const body = await res.json().catch(() => null);
        trackEvent("limit.blocked", { daily_count: body?.daily_count ?? null });
        pendingSince.current = null;
        setStage("done");
        return;
      }
      if (!res.ok) {
        trackEvent("solve.failed", { reason: "http_error", http_status: res.status, attempts: 1 });
        pendingSince.current = null;
        setStage("done");
        return;
      }

      const body = await res.json();
      pendingSince.current = null;

      if (body.status && body.status !== "ok") {
        trackEvent("refusal.shown", { status: body.status, reason_code: body.status });
        setRefusalReason(typeof body.reason === "string" ? body.reason : null);
        setStage("refused");
        return;
      }

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

      if (!body.canonical || !Array.isArray(body.steps) || body.steps.length === 0) {
        // Sxem "ok" deyib, amma həll sahələri yoxdursa (nəzəri, server bunu artıq unreadable
        // kimi qaytarmalıdır) — bura düşməməlidir, amma UI-ı boş ekranla çökdürmək əvəzinə
        // ümumi xəta göstəririk. `final_answer` BURADA yoxlanılmır — SYSTEM-REVIEW §2-dən sonra
        // /api/solve onu artıq qaytarmır (bax web/app/api/solve/route.ts), `/api/attempts/reveal`
        // "Cavabı göstər"də alınır.
        trackEvent("solve.failed", { reason: "empty_solution", http_status: res.status, attempts: 1 });
        setStage("done");
        return;
      }

      setSolution({ canonical: body.canonical, steps: body.steps });
      setSolutionAttemptId(typeof body.attempt_id === "string" ? body.attempt_id : currentAttemptIdRef.current ?? null);
      setStage("solved");
    } catch {
      trackEvent("solve.failed", { reason: "network_error", http_status: null, attempts: 1 });
      pendingSince.current = null;
      setStage("done");
    }
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

  if (stage === "crop" && captured) {
    return <CropView canvas={captured.canvas} onConfirmed={handleConfirmed} onCancel={() => setStage("capture")} />;
  }

  if (stage === "submitting") {
    return <LoadingView />;
  }

  if (stage === "solved" && solution && solutionAttemptId) {
    return <SolveView solution={solution} attemptId={solutionAttemptId} onReset={resetToCapture} />;
  }

  if (stage === "refused") {
    return (
      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: "24px var(--page-pad-x)" }}>
        <h1 style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", margin: 0 }}>
          {t("refusedTitle")}
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)", margin: 0 }}>
          {refusalReason ?? t("refusedBody")}
        </p>
        <button
          type="button"
          onClick={resetToCapture}
          style={{ alignSelf: "flex-start", minHeight: "var(--tap)", padding: "0 22px", border: "none", borderRadius: "var(--rad)", background: "var(--acc)", color: "var(--accink)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          {t("refusedRetake")}
        </button>
      </main>
    );
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
