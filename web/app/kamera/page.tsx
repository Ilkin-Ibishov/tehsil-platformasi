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

type Stage = "invite" | "capture" | "crop" | "submitting" | "solved" | "refused" | "candidates" | "done";

type Candidate = { label: string; preview: string };
type CroppedResult = { blob: Blob; width: number; height: number };

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
  const [refusalStatus, setRefusalStatus] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  // ADR-007 Qat 2/3: kəsilmiş şəkil şagird namizəd seçəndə TƏKRAR göndərilir (`selected_label`
  // ilə) — yeni çəkiliş/kəsmə tələb OLUNMUR. Son uğurlu kəsmə nəticəsini saxlamaq lazımdır ki,
  // `/api/solve`-ə ikinci çağırışda eyni bloblanmış şəkli göndərə bilək.
  const lastCroppedRef = useRef<CroppedResult | null>(null);
  const candidatesShownAtRef = useRef<number>(0);
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

  // Yeni sual (S6 "Yeni sual çək" və s.) — burada həqiqətən YENİ şəkil istənilir, ADR-007
  // invariantı buna aid DEYİL (o, imtina/seçim daxilindəki geri dönüşlər üçündür).
  function resetToCapture() {
    setSolution(null);
    setSolutionAttemptId(null);
    setRefusalReason(null);
    setRefusalStatus(null);
    setCandidates(null);
    setCaptured(null);
    lastCroppedRef.current = null;
    const id = uuidv4();
    currentAttemptIdRef.current = id;
    setAttemptId(id);
    setStage("capture");
  }

  // ADR-007 / PHASE-1 S5 invariantı: imtina, seçim və "heç biri" HƏMİŞƏ kəsməyə qayıdır,
  // kameraya YOX — `captured` (orijinal donmuş kadr) TOXUNULMUR, yalnız kəsmə çərçivəsi
  // sıfırlanır (CropView öz DEFAULT_BOX-unu yenidən mount-da tətbiq edir).
  function backToCrop() {
    setSolution(null);
    setSolutionAttemptId(null);
    setRefusalReason(null);
    setRefusalStatus(null);
    setCandidates(null);
    setStage("crop");
  }

  // Bu funksiya yalnız `onClick`-dən çağırılır, render zamanı YOX (SolveView.tsx-dəki eyni
  // formalı `Date.now()` çağırışları react-hooks/purity-ni tetikləmir, bura niyə düşdüyü
  // aydın deyil — react-compiler eslint plugin hələ təcrübidir, bax package.json).
  function pickCandidate(candidate: Candidate, index: number, total: number) {
    // eslint-disable-next-line react-hooks/purity -- yuxarıdakı şərhə bax
    trackEvent("candidates.picked", { index, total, time_to_pick_ms: Date.now() - candidatesShownAtRef.current });
    const result = lastCroppedRef.current;
    if (!result) {
      // Nəzəri: candidates yalnız bir uğurlu kəsmədən sonra gələ bilər, `lastCroppedRef`
      // artıq doludur. Yenə boşdursa təhlükəsiz geriyə dönüş — yenidən kəs.
      backToCrop();
      return;
    }
    void submitSolve(result, candidate.label);
  }

  async function submitSolve(result: CroppedResult, selectedLabel?: string) {
    lastCroppedRef.current = result;
    setStage("submitting");
    // eslint-disable-next-line react-hooks/purity -- yalnız CropView-in `onConfirmed`/`pickCandidate`-dən çağırılır, render zamanı YOX (bax `pickCandidate`-in üstündəki şərh)
    pendingSince.current = Date.now();
    trackEvent("solve.requested", { image_bytes: result.blob.size, selected_label: selectedLabel ?? null });

    try {
      const form = new FormData();
      form.append("image", result.blob, "problem.jpg");
      form.append("device_id", getDeviceId());
      form.append("invite_code", inviteCode ?? "");
      form.append("grade", "11");
      form.append("locale", "az");
      form.append("subject", "math");
      if (selectedLabel) form.append("selected_label", selectedLabel);
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
        // ADR-007 Qat 2/3: `multiple_problems` + real namizəd siyahısı → seçim ekranı.
        // Namizədlər çıxarıla bilməyibsə (Qat 3) və digər bütün rədd statusları →
        // ümumi imtina ekranı, "yenidən kəs" HƏMİŞƏ kəsməyə aparır (aşağıda `backToCrop`).
        if (body.status === "multiple_problems" && Array.isArray(body.candidates) && body.candidates.length > 0) {
          trackEvent("candidates.shown", {
            count: body.candidates.length,
            labels_present: body.candidates.every((c: Candidate) => Boolean(c?.label)),
          });
          // eslint-disable-next-line react-hooks/purity -- eyni izah, `submitSolve`-in içindədir.
          candidatesShownAtRef.current = Date.now();
          setCandidates(body.candidates);
          setStage("candidates");
          return;
        }
        setRefusalReason(typeof body.reason === "string" ? body.reason : null);
        setRefusalStatus(body.status);
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
    return (
      <CropView canvas={captured.canvas} onConfirmed={submitSolve} onCancel={() => setStage("capture")} />
    );
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
          onClick={() => {
            trackEvent("refusal.action", { status: refusalStatus, action: "recrop" });
            backToCrop();
          }}
          style={{ alignSelf: "flex-start", minHeight: "var(--tap)", padding: "0 22px", border: "none", borderRadius: "var(--rad)", background: "var(--acc)", color: "var(--accink)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          {t("refusedRetake")}
        </button>
      </main>
    );
  }

  if (stage === "candidates" && candidates) {
    // ADR-007 Qat 2: model həll ETMİR, gördüklərinin siyahısını qaytarır. Şagird toxunur,
    // İKİNCİ çağırış (`selected_label` ilə) yalnız seçiləni həll edir — eyni kəsilmiş şəkil
    // TƏKRAR göndərilir, yeni çəkiliş/kəsmə YOXDUR.
    return (
      <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "24px var(--page-pad-x)" }}>
        <h1 style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", margin: 0 }}>
          {t("candidatesTitle")}
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {candidates.map((c, index) => (
            <button
              key={`${c.label}-${index}`}
              type="button"
              onClick={() => pickCandidate(c, index, candidates.length)}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                textAlign: "left",
                minHeight: "var(--tap)",
                padding: "12px 16px",
                border: "1px solid var(--bor)",
                borderRadius: "var(--rad)",
                background: "var(--sur)",
                color: "var(--t1)",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--acc)", flexShrink: 0 }}>
                {c.label}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.preview}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            trackEvent("candidates.none_of_these", {});
            backToCrop();
          }}
          style={{ alignSelf: "flex-start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}
        >
          {t("candidatesNoneOfThese")}
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
