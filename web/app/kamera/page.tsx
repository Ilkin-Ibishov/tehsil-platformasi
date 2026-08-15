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
import { TranscriptConfirmView } from "@/components/hell/TranscriptConfirmView";

// ADR-020 / ClickUp 86eykj7x2 — transkripsiya təsdiq ekranı YALNIZ server kaskadı açıq
// olanda mənalıdır (o, `/api/solve/transcribe`+`/api/solve/finish` iki-endpoint axınına
// EHTİYAC DUYUR, monolit `/api/solve` bunu dəstəkləmir). Server bayrağı `cascade_enabled`
// (DB) ilə EYNİ qərarı əks etdirməlidir — ADR-014 qapısı keçilməyib, defolt SÖNÜKDÜR.
// Bayrağın özü artıq `NEXT_PUBLIC_*` env DEYİL, komponent daxilində `/api/config/public`-dən
// oxunur (bax `cascadeUiEnabled` state-i, aşağıda) — səbəb: `NEXT_PUBLIC_*` build vaxtı
// bundle-a yapışır, DB dəyişikliyi redeploy-suz görünmür.

type Stage = "invite" | "capture" | "crop" | "submitting" | "solved" | "refused" | "candidates" | "done" | "confirm";

type Candidate = { label: string; preview: string };
// S1 (86eymwght): `rawBlob` — kəsilməmiş orijinal kadr, ADR-024. `null` ola bilər (encode
// uğursuz olub, best-effort) — server bu halda yalnız kəsilmiş şəkli saxlayır.
type CroppedResult = { blob: Blob; width: number; height: number; rawBlob: Blob | null };

// `/api/solve/transcribe`-in "ok" cavabı — TranscriptConfirmView-ə və fon `/finish`
// çağırışına ötürülən forma.
type CascadeTranscript = {
  captureId: string | null;
  canonical: string;
  subject: string;
  grade: number;
  topicCode: string;
  problemType: string | null;
  ocrConfidence: string | null;
  detectedLanguage: string | null;
  hasFigure: boolean;
  meta: { latencyMs: number; costUsd: number | null };
  matchPath: string;
};

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
  // 2026-08-15 (Ilkin-in tapşırığı): əvvəllər `NEXT_PUBLIC_CASCADE_ENABLED` (build-vaxtı
  // yapışdırılan env) idi — DB-yə keçdi (`web/lib/app-config.ts`, `/api/config/public`).
  // Defolt `false` (monolit yol) — sorğu qayıdana qədər TƏHLÜKƏSİZ tərəfdə qalır, heç vaxt
  // yanlışlıqla kaskad yoluna DÜŞMÜR.
  const [cascadeUiEnabled, setCascadeUiEnabled] = useState(false);
  const [cascadeTranscript, setCascadeTranscript] = useState<CascadeTranscript | null>(null);
  // ADR-020 / 86eykj7x2: "fon prosesi davam etsin, şagird səhv görüb müdaxilə edərsə
  // dayandırılsın". Təsdiq ekranı göstərilən KİMİ `/api/solve/finish` FONDA başladılır
  // (`AbortController` ilə) — şagird düzəliş etsə `abort()` çağırılır, əvəzinə düzəldilmiş
  // mətnlə YENİ çağırış gedir. `promise` `handleConfirm`-in "düzəliş yoxdur" budağında
  // GÖZLƏNİLİR — belə desək, fon işi TƏSDİQ üçün lazım olan işin ÖZÜDÜR, təkrar edilmir.
  const backgroundFinishRef = useRef<{ controller: AbortController; promise: Promise<Record<string, unknown>> } | null>(null);
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

  // DB-dən (redeploy-suz) oxunan kaskad UI bayrağı — bax yuxarıdakı şərh. Uğursuz olsa
  // (şəbəkə, DB əlçatmazdır) sükutla `false`-da qalır — monolit yol, ən təhlükəsiz defolt.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/config/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { cascade_ui_enabled?: boolean } | null) => {
        if (!cancelled && body?.cascade_ui_enabled) setCascadeUiEnabled(true);
      })
      .catch(() => {
        // Səssiz — defolt `false` onsuz da təhlükəsiz yoldur.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    setCascadeTranscript(null);
    backgroundFinishRef.current?.controller.abort();
    backgroundFinishRef.current = null;
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
    setCascadeTranscript(null);
    backgroundFinishRef.current?.controller.abort();
    backgroundFinishRef.current = null;
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
    void runSolve(result, candidate.label);
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
      if (result.rawBlob) form.append("image_raw", result.rawBlob, "problem-raw.jpg");
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

      setSolution({ canonical: body.canonical, steps: body.steps, verified: body.verification?.verified });
      setSolutionAttemptId(typeof body.attempt_id === "string" ? body.attempt_id : currentAttemptIdRef.current ?? null);
      setStage("solved");
    } catch {
      trackEvent("solve.failed", { reason: "network_error", http_status: null, attempts: 1 });
      pendingSince.current = null;
      setStage("done");
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════════════
  // ADR-020 / ClickUp 86eykj7x2 — kaskad UI axını. `submitSolve`-in YANINDA, onu ƏVƏZ
  // ETMİR (`cascadeUiEnabled` sönükdə heç vaxt çağırılmır — bax `runSolve` aşağıda).
  // ══════════════════════════════════════════════════════════════════════════════════════

  function transcriptPayload(t: CascadeTranscript) {
    return {
      canonical: t.canonical,
      subject: t.subject,
      grade: t.grade,
      topic_code: t.topicCode,
      problem_type: t.problemType,
      ocr_confidence: t.ocrConfidence,
      detected_language: t.detectedLanguage,
      has_figure: t.hasFigure,
    };
  }

  // `/api/solve/finish`-ə çağırış. `signal` klientdə ləğv edilə bilməsi üçün (şagird
  // düzəliş edəndə köhnə fon sorğusu DAYANDIRILIR — ClickUp 86eykj7x2-nin məcburi tələbi).
  async function callFinish(
    t: CascadeTranscript,
    canonicalOverride: string,
    signal: AbortSignal
  ): Promise<Record<string, unknown>> {
    const res = await fetch("/api/solve/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        device_id: getDeviceId(),
        invite_code: inviteCode ?? "",
        locale: "az",
        attempt_id: currentAttemptIdRef.current ?? null,
        capture_id: t.captureId,
        transcribe_meta: { cache_hit: t.matchPath === "image_cache", cost_usd: t.meta.costUsd, latency_ms: t.meta.latencyMs },
        transcript: { ...transcriptPayload(t), canonical: canonicalOverride },
      }),
    });
    return res.json();
  }

  // Server tərəfi Qat 2-5-i həll edə bilmədi (`status !== "ok"`) VƏ ya şəbəkə xətası —
  // mövcud "refused" ekranına yönləndirir (backToCrop invariantı ORADA artıq qorunur).
  function handleFinishFailure(reasonKey: "unreadable" | "network_error") {
    trackEvent("solve.failed", { reason: reasonKey, http_status: null, attempts: 1 });
    setRefusalReason(null);
    setRefusalStatus("unreadable");
    setStage("refused");
  }

  function applyFinishResult(body: Record<string, unknown>) {
    if (body.status && body.status !== "ok") {
      handleFinishFailure("unreadable");
      return;
    }
    if (!body.canonical || !Array.isArray(body.steps) || body.steps.length === 0) {
      trackEvent("solve.failed", { reason: "empty_solution", http_status: 200, attempts: 1 });
      setStage("done");
      return;
    }
    trackEvent("solve.response", {
      status: "ok",
      ocr_confidence: cascadeTranscript?.ocrConfidence ?? null,
      latency_ms: (body.meta as { latency_ms?: number } | undefined)?.latency_ms ?? null,
      match_path: body.match_path ?? null,
      cost_usd: (body.meta as { cost_usd?: number | null } | undefined)?.cost_usd ?? null,
      tokens_in: (body.meta as { tokens_in?: number | null } | undefined)?.tokens_in ?? null,
      tokens_out: (body.meta as { tokens_out?: number | null } | undefined)?.tokens_out ?? null,
      step_count: (body.steps as unknown[]).length,
    });
    setSolution({
      canonical: body.canonical as string,
      steps: body.steps as SolveResult["steps"],
      verified: (body.verification as { verified?: boolean } | undefined)?.verified,
    });
    setSolutionAttemptId(typeof body.attempt_id === "string" ? body.attempt_id : currentAttemptIdRef.current ?? null);
    setStage("solved");
  }

  async function submitSolveCascade(result: CroppedResult, selectedLabel?: string) {
    lastCroppedRef.current = result;
    setStage("submitting");
    // eslint-disable-next-line react-hooks/purity -- eyni izah, submitSolve-in üstündəki şərhə bax
    pendingSince.current = Date.now();
    trackEvent("solve.requested", { image_bytes: result.blob.size, selected_label: selectedLabel ?? null });

    try {
      const form = new FormData();
      form.append("image", result.blob, "problem.jpg");
      if (result.rawBlob) form.append("image_raw", result.rawBlob, "problem-raw.jpg");
      form.append("device_id", getDeviceId());
      form.append("invite_code", inviteCode ?? "");
      form.append("grade", "11");
      form.append("locale", "az");
      form.append("subject", "math");
      if (selectedLabel) form.append("selected_label", selectedLabel);

      const res = await fetch("/api/solve/transcribe", { method: "POST", body: form });

      if (res.status === 403) {
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
        if (body.status === "multiple_problems" && Array.isArray(body.candidates) && body.candidates.length > 0) {
          trackEvent("candidates.shown", {
            count: body.candidates.length,
            labels_present: body.candidates.every((c: Candidate) => Boolean(c?.label)),
          });
          // eslint-disable-next-line react-hooks/purity -- eyni izah, submitSolve-in içindədir.
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

      if (!body.canonical || typeof body.subject !== "string" || typeof body.grade !== "number" || typeof body.topic_code !== "string") {
        trackEvent("solve.failed", { reason: "empty_solution", http_status: res.status, attempts: 1 });
        setStage("done");
        return;
      }

      const transcript: CascadeTranscript = {
        captureId: typeof body.capture_id === "string" ? body.capture_id : null,
        canonical: body.canonical,
        subject: body.subject,
        grade: body.grade,
        topicCode: body.topic_code,
        problemType: typeof body.problem_type === "string" ? body.problem_type : null,
        ocrConfidence: typeof body.ocr_confidence === "string" ? body.ocr_confidence : null,
        detectedLanguage: typeof body.detected_language === "string" ? body.detected_language : null,
        hasFigure: body.has_figure === true,
        meta: {
          latencyMs: body.meta?.latency_ms ?? 0,
          costUsd: typeof body.meta?.cost_usd === "number" ? body.meta.cost_usd : null,
        },
        matchPath: typeof body.match_path === "string" ? body.match_path : "llm",
      };
      setCascadeTranscript(transcript);
      trackEvent("transcript.shown", { ocr_confidence: transcript.ocrConfidence });

      // Fon çağırışı — DƏRHAL, şagird HƏLƏ mətni oxumamış başlayır. `handleConfirm`-in
      // "düzəliş yoxdur" budağı bunu GÖZLƏYİR, TƏKRAR sorğu GÖNDƏRMİR.
      const controller = new AbortController();
      const promise = callFinish(transcript, transcript.canonical, controller.signal).catch(
        (err) => ({ status: "network_error", __error: err instanceof Error ? err.message : String(err) })
      );
      backgroundFinishRef.current = { controller, promise };

      setStage("confirm");
    } catch {
      trackEvent("solve.failed", { reason: "network_error", http_status: null, attempts: 1 });
      pendingSince.current = null;
      setStage("done");
    }
  }

  async function handleConfirm(finalText: string) {
    if (!cascadeTranscript) return;
    const corrected = finalText !== cascadeTranscript.canonical;
    trackEvent("transcript.confirmed", { corrected });

    if (!corrected) {
      const inFlight = backgroundFinishRef.current;
      setStage("submitting");
      if (!inFlight) {
        // Nəzəri: "confirm" mərhələsinə YALNIZ fon çağırışı başladıqdan sonra keçilir.
        handleFinishFailure("network_error");
        return;
      }
      try {
        const body = await inFlight.promise;
        if (body.__error) {
          handleFinishFailure("network_error");
          return;
        }
        applyFinishResult(body);
      } catch {
        handleFinishFailure("network_error");
      }
      return;
    }

    // Düzəliş edilib — köhnə fon sorğusu artıq YARARSIZDIR, DAYANDIRILIR (86eykj7x2-nin
    // məcburi tələbi), düzəldilmiş mətnlə YENİ sorğu gedir.
    trackEvent("transcript.corrected", {});
    backgroundFinishRef.current?.controller.abort();
    const controller = new AbortController();
    setStage("submitting");
    try {
      const body = await callFinish(cascadeTranscript, finalText, controller.signal);
      applyFinishResult(body);
    } catch {
      handleFinishFailure("network_error");
    }
  }

  function handleReject() {
    trackEvent("transcript.rejected", {});
    backgroundFinishRef.current?.controller.abort();
    if (cascadeTranscript?.captureId) {
      // Best-effort korpus qeydi — axını BLOKLAMIR (`void`), ClickUp 86eymfg85.
      void fetch("/api/solve/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: getDeviceId(),
          invite_code: inviteCode ?? "",
          capture_id: cascadeTranscript.captureId,
          rejected: true,
        }),
      }).catch(() => {});
    }
    backToCrop();
  }

  const runSolve = cascadeUiEnabled ? submitSolveCascade : submitSolve;

  if (stage === "invite") {
    return (
      <InviteGate
        invalid={inviteError}
        onCode={(code) => {
          setInviteCode(code);
          setInviteError(false);
          setStage("capture");
        }}
      />
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
      <CropView canvas={captured.canvas} onConfirmed={runSolve} onCancel={() => setStage("capture")} />
    );
  }

  if (stage === "submitting") {
    // ADR-020: "confirm"-dən sonrakı gözləmə (fon /finish) canonical-ı ARTIQ bilir —
    // LoadingView-in `questionText` sahəsi (HANDOFF 49 §3a-dan bəri hazır) məhz bunun üçün.
    return <LoadingView questionText={cascadeTranscript?.canonical} />;
  }

  if (stage === "confirm" && cascadeTranscript) {
    return (
      <TranscriptConfirmView canonical={cascadeTranscript.canonical} onConfirm={handleConfirm} onReject={handleReject} />
    );
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
