"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent, getDeviceId } from "@/lib/telemetry";
import { reportAttemptProgress } from "@/lib/attempts";
import { formatMath, formatMathProse, findUnformattedLatex } from "@/lib/math-format";
import { canPassStuckStep } from "@/lib/verify/step-pass";
import { VisualFigure } from "@/components/hell/VisualFigure";
import type { VisualSpec } from "@/lib/visual";

export type SolveStep = {
  index: number;
  title: string;
  explanation: string;
  latex?: string;
  check: { ask: string; input_kind?: "number" | "expression" | "choice" };
  error_code: string;
  hint: string;
};

export type SolveResult = {
  canonical: string;
  steps: SolveStep[];
  visual?: VisualSpec | null;
  // S5 (86eymwgkv) — sympy `equationCrossCheck` təsdiqləyə bilmədi (söz məsələsi, çoxdəyişənli
  // tənlik və s.). Bilinmirsə (köhnə klient axını, sahə göndərilmirsə) `undefined` — şagirdə
  // heç nə göstərilmir (defolt "sükut" halı, YALANDAN xəbərdarlıq etmə).
  verified?: boolean | null;
};

type FinalAnswer = { latex: string; values: string[]; choice?: string };

type StepStatus = "idle" | "checking" | "correct" | "wrong" | "network_error";

type StepAnswerState = {
  input: string;
  status: StepStatus;
  attemptNo: number;
  startedAt: number;
  // UX audit tapıntısı (2026-08-14): server-in hesabladığı distraktor mesajı/başlıq
  // ƏVVƏLLƏR TAMAMİLƏ ATILIRDI (checkStepAnswer-in tipi yalnız `correct`-i saxlayırdı) —
  // HANDOFF-83-ün "LLM-siz konkret diaqnostik mesaj" məqsədi bununla itirilirdi.
  errorTitle?: string | null;
  distractorMessage?: string | null;
};

// SYSTEM-REVIEW-2026-08-07 §2 (HANDOFF 45): addım yoxlaması indi SERVERDƏDİR
// (`/api/steps/check`) — `check.accept` artıq `/api/solve` cavabında yoxdur (bax
// web/app/api/solve/route.ts), ona görə burada yoxlana bilməzdi belə. Server §B1-dəki EYNİ
// `studentAnswerMatches`-i işlədir və nəticəni `step_events`-ə ÖZÜ yazır — `error_code` indi
// şagirdin CAVABINA əsaslanır, klientin "düz/səhv" dediyinə yox.
//
// HANDOFF (73): `step_index` BURADA `SolveStep.index`-dir (STEP-SCHEMA-nın öz sahəsi),
// massiv MÖVQEYİ YOX. Server açarı bununla saxlayır (`private.step_answers`) — massiv
// mövqeyi ilə çağırmaq dil fallback ssenarisində (fərqli tərcümələr fərqli `steps[]`
// uzunluğu/sırası daşıya bilər) səssiz yanlış nəticəyə gətirirdi. Çağıran `currentStep.index`
// göndərməlidir, `stepIndex` (React state, massiv mövqeyi) YOX — bax aşağıda `submitAnswer`.
type StepCheckResponse = {
  correct: boolean;
  distractor?: { error_code: string; message: string };
  error_title?: string;
};

async function checkStepAnswer(attemptId: string, stepSchemaIndex: number, answer: string): Promise<StepCheckResponse> {
  const res = await fetch("/api/steps/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt_id: attemptId, device_id: getDeviceId(), step_index: stepSchemaIndex, answer }),
  });
  if (!res.ok) throw new Error(`step check http ${res.status}`);
  return res.json();
}

async function fetchFinalAnswer(attemptId: string): Promise<FinalAnswer> {
  const res = await fetch("/api/attempts/reveal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt_id: attemptId, device_id: getDeviceId() }),
  });
  if (!res.ok) throw new Error(`reveal http ${res.status}`);
  const body = await res.json();
  return body.final_answer;
}

async function passStuckStep(attemptId: string, stepSchemaIndex: number): Promise<void> {
  const res = await fetch("/api/steps/pass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt_id: attemptId, device_id: getDeviceId(), step_index: stepSchemaIndex }),
  });
  if (!res.ok) throw new Error(`step pass http ${res.status}`);
}

// S6 (HANDOFF 56/57): "eynisini sən həll et" — yeni LLM çağırışı yoxdur, `problems`-dən eyni
// `topic_code`-lu başqa məsələ. 404 = namizəd yoxdur (ADR-003: `formula`-ya məhdudlaşdırılıb),
// bu, xəta deyil — çağıran sadəcə transfer addımını göstərmir.
type TransferProblem = { transfer_problem_id: string; canonical: string };

async function fetchTransferProblem(attemptId: string): Promise<TransferProblem | null> {
  const res = await fetch("/api/attempts/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt_id: attemptId, device_id: getDeviceId() }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`transfer http ${res.status}`);
  return res.json();
}

async function checkTransferAnswer(attemptId: string, transferProblemId: string, answer: string): Promise<{ correct: boolean }> {
  const res = await fetch("/api/attempts/transfer/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt_id: attemptId, device_id: getDeviceId(), transfer_problem_id: transferProblemId, answer }),
  });
  if (!res.ok) throw new Error(`transfer check http ${res.status}`);
  return res.json();
}

type TransferState = "loading" | "shown" | "checking" | "answered" | "unavailable" | "error";

// HANDOFF 116: həll ekranında canonical — defolt bir sətir, toxunanda açılır.
// `whiteSpace: nowrap` + `overflowX: auto` YOX (4036f91): kəsilmiş düstur görünməz qalırdı.
// Yığılmış hal `-webkit-line-clamp: 1` (ellipsis). Açılmış hal `overflowWrap: anywhere`
// və `maxHeight` — uzun söz məsələsi `check` input-unu 480px-də ekranın altına itələməsin.
function ProblemBanner({
  text,
  expanded,
  onToggle,
  label,
  expandLabel,
  collapseLabel,
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
  label: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  if (!text.trim()) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? collapseLabel : expandLabel}
      style={{
        margin: "12px var(--page-pad-x) 0",
        padding: "12px 16px",
        border: "1px solid var(--bor)",
        borderRadius: "var(--rad)",
        background: "var(--sur)",
        display: "flex",
        alignItems: expanded ? "flex-start" : "center",
        gap: 12,
        width: "calc(100% - 2 * var(--page-pad-x))",
        boxSizing: "border-box",
        textAlign: "left",
        cursor: "pointer",
        minHeight: 44,
        fontFamily: "inherit",
        color: "inherit",
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--t3)", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={
          expanded
            ? {
                flex: 1,
                minWidth: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                lineHeight: 1.45,
                color: "var(--t1)",
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                maxHeight: "min(22vh, 8.5rem)",
                overflowY: "auto",
                overflowX: "hidden",
              }
            : {
                flex: 1,
                minWidth: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                lineHeight: 1.45,
                color: "var(--t1)",
                overflowWrap: "anywhere",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 1,
                overflow: "hidden",
              }
        }
      >
        {text}
      </span>
    </button>
  );
}

export function SolveView({
  solution,
  attemptId,
  onReset,
  // ClickUp 86eykhve0: bank UI eyni komponenti kamerasız işlədir — "Yeni sual çək" (kameranı
  // nəzərdə tutur) bank axınında YANLIŞ oxunur. Optional, defolt DƏYİŞMİR — kamera axını
  // TOXUNULMUR.
  resetLabel,
}: {
  solution: SolveResult;
  attemptId: string;
  onReset: () => void;
  resetLabel?: string;
}) {
  const t = useTranslations("hell");
  const steps = solution.steps;
  const total = steps.length;

  const [stepIndex, setStepIndex] = useState(0);
  // ClickUp 86eyn1t7b — ən uzaq açılmış addım. Geri/irəli yalnız `i <= farthestIndex`.
  // `answers` silinmir: yazılmış `error_code` (server `step_events`) və UI-dakı səhv adı qalır.
  const [farthestIndex, setFarthestIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, StepAnswerState>>({});
  const [hintOpen, setHintOpen] = useState<Record<number, boolean>>({});
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState(false);
  const [passing, setPassing] = useState(false);
  const [passError, setPassError] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState<FinalAnswer | null>(null);
  const [reportedWrong, setReportedWrong] = useState(false);
  const [transferState, setTransferState] = useState<TransferState | null>(null);
  const [transferProblem, setTransferProblem] = useState<TransferProblem | null>(null);
  const [transferInput, setTransferInput] = useState("");
  const [transferCorrect, setTransferCorrect] = useState<boolean | null>(null);
  const [problemExpanded, setProblemExpanded] = useState(false);
  // eslint-disable-next-line react-hooks/purity -- mount-only wall clock for telemetry duration
  const solveStartedAt = useRef(Date.now());
  const shownSteps = useRef<Set<number>>(new Set());
  const transferShownAt = useRef<number>(0);
  const transferFetchStarted = useRef(false);

  const currentStep = steps[stepIndex];
  const currentAnswer = answers[stepIndex] ?? {
    input: "",
    status: "idle" as StepStatus,
    attemptNo: 0,
    // Placeholder; real startedAt setAnswer ilə yazılır — render-də Date.now() yox.
    startedAt: 0,
  };
  const formattedCanonical = useMemo(() => formatMathProse(solution.canonical ?? ""), [solution.canonical]);
  // ClickUp 86eyn28kn: ipucu + ≥1 səhv, orta addım. Son addım «Cavabı göstər»dir.
  const stuckPassable = canPassStuckStep({
    isLastStep: stepIndex >= total - 1,
    hintOpen: Boolean(hintOpen[stepIndex]),
    status: currentAnswer.status,
  });
  const alreadyUnlocked = stepIndex < farthestIndex;
  const midStepLocked =
    stepIndex < total - 1 && currentAnswer.status !== "correct" && !stuckPassable && !alreadyUnlocked;

  function toggleProblem() {
    if (!problemExpanded) {
      trackEvent("problem.expanded", { step_index: currentStep?.index ?? stepIndex });
    }
    setProblemExpanded((open) => !open);
  }

  // SYSTEM-REVIEW-2026-08-07 §A1: son addıma çatmadan bu ekran sökülürsə (geri, "yeni sual
  // çək" ADƏTƏN sökmür amma naviqasiya edə bilər, tab bağlama) — `abandoned_at_step` bunu
  // yazır. `HANDOFF 40`-dakı unmount-cleanup dərsi eynidir: unmount anında `revealed`/
  // `farthestIndex` dəyərləri prop/closure-dan gec ola bilər, ona görə ref-lər ayrıca
  // sinxronlaşdırılır. 86eyn1t7b: baxış üçün geri getmək funnel-i "addım 0-da ilişdi"
  // kimi yazmamalıdır — ən uzaq açılmış addım yazılır.
  const revealedRef = useRef(revealed);
  const farthestIndexRef = useRef(farthestIndex);
  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);
  useEffect(() => {
    farthestIndexRef.current = farthestIndex;
  }, [farthestIndex]);
  useEffect(() => {
    return () => {
      if (!revealedRef.current) {
        reportAttemptProgress({ attemptId, completed: false, abandonedAtStep: farthestIndexRef.current, durationSec: null, revealedAnswer: false });
      }
    };
  }, [attemptId]);

  // S6: cavab açılan kimi (bir dəfə) transfer namizədi soruşulur — tapılmasa (`null`) heç nə
  // göstərilmir, `transfer.shown`/`skipped` yalnız HƏQİQƏTƏN göstərildikdə mənalıdır.
  useEffect(() => {
    if (!revealed || transferFetchStarted.current) return;
    transferFetchStarted.current = true;
    setTransferState("loading");
    fetchTransferProblem(attemptId)
      .then((problem) => {
        if (!problem) {
          setTransferState("unavailable");
          return;
        }
        setTransferProblem(problem);
        transferShownAt.current = Date.now();
        setTransferState("shown");
        trackEvent("transfer.shown", {});
      })
      .catch(() => setTransferState("unavailable"));
  }, [revealed, attemptId]);

  async function submitTransferAnswer() {
    if (!transferProblem || !transferInput.trim() || transferState === "checking") return;
    setTransferState("checking");
    try {
      const { correct } = await checkTransferAnswer(attemptId, transferProblem.transfer_problem_id, transferInput);
      setTransferCorrect(correct);
      setTransferState("answered");
      trackEvent("transfer.answered", { correct, time_ms: Date.now() - transferShownAt.current });
    } catch {
      // Şəbəkə xətası — S6 ölçmə üçündür, şagirdi buna görə ilişdirmirik: sadəcə keçirik.
      setTransferState("unavailable");
    }
  }

  function skipTransfer() {
    trackEvent("transfer.skipped", {});
    setTransferState("unavailable");
  }

  useEffect(() => {
    if (revealed || !currentStep) return;
    if (shownSteps.current.has(stepIndex)) return;
    shownSteps.current.add(stepIndex);
    trackEvent("step.shown", { index: stepIndex, total, error_code: currentStep.error_code });
    // S-tapşırığı (2026-08-14, HANDOFF 104) — server-timestamp əsaslı addım vaxtı üçün.
    // `currentStep.index` (STEP-SCHEMA-nın öz sahəsi) göndərilir, `stepIndex` (massiv
    // mövqeyi) YOX — `step_events`-in özü ilə EYNİ konvensiya (HANDOFF 73).
    fetch("/api/steps/shown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempt_id: attemptId, device_id: getDeviceId(), step_index: currentStep.index }),
      keepalive: true,
    }).catch(() => {
      // Telemetriya kimi — şəbəkə xətası UI-a heç vaxt çıxmır.
    });
    if (currentStep.latex) {
      // HANDOFF (55): `formatMath` cədvəli modelin lüğətindən geri qalır — çıxışda hələ
      // tanınmayan `\əmr` qalıbsa ÖLÇÜRÜK (mətni pozmuruq, `render.latex_missing` ilə eyni prinsip).
      const token = findUnformattedLatex(formatMath(currentStep.latex));
      if (token) trackEvent("render.unformatted_latex", { field: "step", token });
    }
    setAnswers((prev) => ({
      ...prev,
      [stepIndex]: prev[stepIndex] ?? { input: "", status: "idle", attemptNo: 0, startedAt: Date.now() },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, revealed]);

  function setInput(value: string) {
    setAnswers((prev) => ({
      ...prev,
      [stepIndex]: {
        ...currentAnswer,
        input: value,
        startedAt: currentAnswer.startedAt || Date.now(),
      },
    }));
  }

  async function submitAnswer() {
    if (!currentStep || currentAnswer.status === "checking") return;
    const attemptNo = currentAnswer.attemptNo + 1;
    const startedAt = currentAnswer.startedAt || Date.now();
    const timeOnStepMs = Date.now() - startedAt;
    const submittedInput = currentAnswer.input;

    setAnswers((prev) => ({ ...prev, [stepIndex]: { ...currentAnswer, status: "checking" } }));

    let correct: boolean;
    let errorTitle: string | null = null;
    let distractorMessage: string | null = null;
    try {
      const result = await checkStepAnswer(attemptId, currentStep.index, submittedInput);
      correct = result.correct;
      errorTitle = result.error_title ?? null;
      distractorMessage = result.distractor?.message ?? null;
    } catch {
      // SYSTEM-REVIEW §2 diqqəti: şəbəkə yoxdursa AYDIN mesaj, səssiz "səhv" yox.
      setAnswers((prev) => ({ ...prev, [stepIndex]: { ...currentAnswer, status: "network_error" } }));
      return;
    }

    trackEvent("step.answer_submitted", {
      index: stepIndex,
      correct,
      attempt_no: attemptNo,
      input_kind: currentStep.check.input_kind ?? "number",
      time_on_step_ms: timeOnStepMs,
    });
    if (!correct) {
      trackEvent("step.error_recorded", { index: stepIndex, error_code: currentStep.error_code });
    }

    setAnswers((prev) => ({
      ...prev,
      [stepIndex]: {
        ...prev[stepIndex],
        input: submittedInput,
        status: correct ? "correct" : "wrong",
        attemptNo,
        errorTitle,
        distractorMessage,
      },
    }));
  }

  function retryAnswer() {
    setAnswers((prev) => ({
      ...prev,
      [stepIndex]: { ...currentAnswer, input: "", status: "idle" },
    }));
  }

  // UX düzəlişi (Ilkin-in tapşırığı, 2026-08-15): əvvəllər bu düymə "Bu addımı başa düşmədim"
  // etiketi ilə şagirdi SƏSSİZCƏ növbəti addıma keçirirdi (`advance()`) — düymənin adı izah
  // vəd edir, davranışı isə pas keçirdi. İndi addımda QALIR, `currentStep.hint`-i göstərir.
  // `step.hint_opened` `docs/TELEMETRY.md`-də ARTIQ TƏSVİR OLUNMUŞDU (sətir 142) amma heç vaxt
  // atılmırdı — kod indi mövcud taksonomiyanı tamamlayır, yenisini yaratmır. Orta addımdan
  // çıxış 86eyn28kn: ipucu + səhv cəhddən sonra «Bu addımı keç» (`/api/steps/pass`),
  // final cavab AÇILMIR. `step.abandoned` səhifə tərkidir, keçid deyil.
  function openHint() {
    if (!hintOpen[stepIndex]) trackEvent("step.hint_opened", { index: stepIndex });
    setHintOpen((prev) => ({ ...prev, [stepIndex]: true }));
  }

  // ClickUp 86eymrkjn / Ilkin: "Cavabı göstər" YALNIZ son addımdadır. HANDOFF (49) §3d hər
  // addımdan çıxış qızıl qaydanı pozurdu — qalan addımların `error_code`-u heç yazılmırdı.
  // `completed`/`abandoned_at_step` hələ çağırış anındakı `stepIndex`-dən hesablanır
  // (müdafiə: bu funksiya təsadüfən erkən çağırılsa `solution.completed` yalan danışmasın).
  async function reveal() {
    if (stepIndex < total - 1) return;
    setRevealing(true);
    setRevealError(false);
    let answer: FinalAnswer;
    try {
      answer = await fetchFinalAnswer(attemptId);
    } catch {
      setRevealing(false);
      setRevealError(true);
      return;
    }
    if (!answer.latex) {
      // ADR-015 Tapıntı 1: `values` müqayisə üçündür, göstərmək üçün YOX. `latex` boşdursa
      // (nəzəri — sxem tələb edir, amma modeldən gələn hər sahə zəmanətli deyil) geri dönüş
      // `values[0]`-dur, tezliyini SƏSSİZ buraxmırıq.
      trackEvent("render.latex_missing", { field: "final_answer" });
    } else {
      // HANDOFF (55): eyni ölçmə final_answer üçün — `render.latex_missing`-dən AYRI hal,
      // `latex` var, amma `formatMath` onu tam çevirə bilməyib.
      const token = findUnformattedLatex(formatMath(answer.latex));
      if (token) trackEvent("render.unformatted_latex", { field: "final_answer", token });
    }
    setFinalAnswer(answer);
    setRevealing(false);
    setRevealed(true);
    trackEvent("solution.answer_revealed", { at_step: stepIndex + 1, of_total: total });
    const finishedAllSteps = stepIndex >= total - 1;
    const durationSec = Math.round((Date.now() - solveStartedAt.current) / 1000);
    if (finishedAllSteps) {
      const errorsTotal = Object.values(answers).filter((a) => a.status === "wrong").length;
      trackEvent("solution.completed", {
        steps_total: total,
        errors_total: errorsTotal,
        duration_sec: durationSec,
      });
    }
    reportAttemptProgress({
      attemptId,
      completed: finishedAllSteps,
      abandonedAtStep: finishedAllSteps ? null : stepIndex,
      durationSec,
      // S4 — bura HƏMİŞƏ `true`-dur: `reveal()` bu nöqtəyə çatıbsa `final_answer` HƏQİQƏTƏN
      // gətirilib/göstərilib (yuxarıda `setRevealed(true)`). 86eymrkjn-dən sonra bura yalnız
      // son addımdan gəlinir; final cavabı görmədən "bitirmə" yolu YOXDUR.
      revealedAnswer: true,
    });
  }

  function goToStep(i: number) {
    if (i < 0 || i > farthestIndex || i === stepIndex) return;
    if (revealing || passing || currentAnswer.status === "checking") return;
    setPassError(false);
    setProblemExpanded(false);
    setStepIndex(i);
  }

  function advance() {
    if (stepIndex >= total - 1) {
      void reveal();
      return;
    }
    const next = stepIndex + 1;
    setPassError(false);
    setProblemExpanded(false);
    setStepIndex(next);
    setFarthestIndex((f) => Math.max(f, next));
  }

  async function passAndAdvance() {
    if (!currentStep || passing || !stuckPassable || alreadyUnlocked) return;
    setPassing(true);
    setPassError(false);
    try {
      await passStuckStep(attemptId, currentStep.index);
    } catch {
      setPassing(false);
      setPassError(true);
      return;
    }
    setPassing(false);
    advance();
  }

  // ADR-015 Tapıntı 1/2: `values` müqayisə üçündür (server tərəfdə istifadə olunur), şagirdə
  // GÖSTƏRİLƏN `latex`-dir — o da `formatMath`-dan keçir (unicode riyaziyyat, `data-tex`
  // müqaviləsi). `latex` boşdursa geri dönüş `values[0]` (yenə formatlanmış).
  const finalDisplayText = useMemo(() => {
    if (!finalAnswer) return "";
    const src = finalAnswer.latex || finalAnswer.values[0] || "";
    return formatMath(src);
  }, [finalAnswer]);

  if (revealError) {
    return (
      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: "24px var(--page-pad-x)" }}>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)", margin: 0 }}>{t("answer.revealError")}</p>
        <button
          type="button"
          onClick={() => void reveal()}
          style={{ alignSelf: "flex-start", minHeight: "var(--tap)", padding: "0 22px", border: "none", borderRadius: "var(--rad)", background: "var(--acc)", color: "var(--accink)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          {t("step.retry")}
        </button>
      </main>
    );
  }

  if (revealed) {
    return (
      <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "24px 0" }}>
        <div style={{ padding: "0 var(--page-pad-x)", display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--acc)" }}>
            {t("answer.label")}
          </span>
          <span style={{ color: "var(--acc)", fontSize: 14 }}>✓</span>
        </div>
        {solution.verified !== true && solution.verified !== undefined && (
          // S5 (86eymwgkv) — `null` = yoxlanılmadı nişanı; `false` semantik olaraq gizlətmədir
          // və server onu bura çatdırmır. `undefined` = köhnə klient, nişan yox.
          <div style={{ margin: "0 var(--page-pad-x)", fontSize: 13, color: "var(--warn)" }}>
            {t("answer.unverified")}
          </div>
        )}
        <div
          style={{
            margin: "0 var(--page-pad-x)",
            padding: 18,
            border: "1px solid var(--acc)",
            borderRadius: "var(--rad)",
            background: "var(--accsoft)",
            fontFamily: "var(--font-mono)",
            fontSize: 26,
            lineHeight: 1.3,
            color: "var(--t1)",
            whiteSpace: "normal",
            overflowWrap: "anywhere",
          }}
        >
          {finalDisplayText}
        </div>
        <VisualFigure spec={solution.visual} label={t("visual.label")} />
        <div style={{ padding: "0 var(--page-pad-x)", display: "flex", gap: 20 }}>
          {!reportedWrong && (
            <button
              type="button"
              onClick={() => {
                setReportedWrong(true);
                trackEvent("solution.reported_wrong", {});
              }}
              style={{
                minHeight: 44,
                padding: 0,
                border: "none",
                background: "transparent",
                color: "var(--t2)",
                fontFamily: "inherit",
                fontSize: 14,
                cursor: "pointer",
                borderBottom: "1px solid var(--bor)",
              }}
            >
              {t("answer.reportWrong")}
            </button>
          )}
          {reportedWrong && (
            <span style={{ fontSize: 14, color: "var(--t2)" }}>{t("answer.reportWrongDone")}</span>
          )}
        </div>

        {/* S6 — "eynisini sən həll et". `transferState` `null`/`loading`/`unavailable` heç nə
            göstərmir (namizəd yoxdursa səssizcə keçilir), `shown`/`checking`/`answered` sual +
            cavab axınıdır. */}
        {(transferState === "shown" || transferState === "checking" || transferState === "answered") && transferProblem && (
          <div style={{ margin: "0 var(--page-pad-x)", padding: 18, border: "1px solid var(--bor)", borderRadius: "var(--rad)", background: "var(--sur)", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--acc)" }}>
              {t("transfer.label")}
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--t1)", whiteSpace: "normal", overflowWrap: "anywhere" }}>
              {formatMathProse(transferProblem.canonical)}
            </div>
            {transferState !== "answered" && (
              <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                <input
                  type="text"
                  value={transferInput}
                  placeholder={t("step.inputPlaceholder")}
                  onChange={(e) => setTransferInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitTransferAnswer();
                  }}
                  disabled={transferState === "checking"}
                  style={{ flex: 1, minWidth: 0, minHeight: "var(--tap)", border: "1px solid var(--bor)", borderRadius: "var(--rad)", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--font-mono)", fontSize: 16, padding: "0 14px", outline: "none" }}
                />
                <button
                  type="button"
                  onClick={() => void submitTransferAnswer()}
                  disabled={!transferInput.trim() || transferState === "checking"}
                  style={{ minHeight: "var(--tap)", padding: "0 22px", border: "1px solid var(--acc)", borderRadius: "var(--rad)", background: "var(--accsoft)", color: "var(--acc)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", opacity: transferInput.trim() && transferState !== "checking" ? 1 : 0.5 }}
                >
                  {transferState === "checking" ? t("step.checking") : t("step.check")}
                </button>
              </div>
            )}
            {transferState === "answered" && transferCorrect !== null && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "10px 14px", borderRadius: "var(--rad)", background: transferCorrect ? "var(--accsoft)" : "var(--warnsoft)" }}>
                <span style={{ color: transferCorrect ? "var(--acc)" : "var(--warn)", fontSize: 14 }}>{transferCorrect ? "✓" : "✕"}</span>
                <span style={{ fontSize: 14, lineHeight: 1.6 }}>{transferCorrect ? t("transfer.correct") : t("transfer.wrong")}</span>
              </div>
            )}
            {transferState !== "answered" && (
              <button
                type="button"
                onClick={skipTransfer}
                style={{ alignSelf: "flex-start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}
              >
                {t("transfer.skip")}
              </button>
            )}
          </div>
        )}

        <div style={{ padding: "0 var(--page-pad-x)", marginTop: 8 }}>
          <button
            type="button"
            onClick={onReset}
            style={{
              width: "100%",
              minHeight: "var(--tap)",
              border: "1px solid var(--bor)",
              borderRadius: "var(--rad)",
              background: "transparent",
              color: "var(--t2)",
              fontFamily: "inherit",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
            }}
          >
            <span>{resetLabel ?? t("answer.newProblem")}</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>＋</span>
          </button>
        </div>
      </main>
    );
  }

  if (!currentStep) {
    return null;
  }

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 4, padding: "0 var(--page-pad-x) 0", flexShrink: 0 }}>
        {steps.map((s, i) => (
          <span
            key={`${s.index}-${i}`}
            style={{
              height: 6,
              borderRadius: 99,
              flex: 1,
              background: i <= farthestIndex ? "var(--acc)" : "var(--trackempty, var(--bor))",
              transition: "background 380ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        ))}
      </div>

      <ProblemBanner
        text={formattedCanonical}
        expanded={problemExpanded}
        onToggle={toggleProblem}
        label={t("problem.label")}
        expandLabel={t("problem.expand")}
        collapseLabel={t("problem.collapse")}
      />

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <VisualFigure spec={solution.visual} label={t("visual.label")} />
        <div style={{ padding: "0 var(--page-pad-x)", display: "grid", rowGap: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--acc)" }}>
            {t("step.counter", { index: stepIndex + 1, total })}
          </span>
          <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: "24ch" }}>
            {formatMathProse(currentStep.title)}
          </span>
        </div>
        <p style={{ margin: 0, padding: "0 var(--page-pad-x)", fontSize: 16, lineHeight: 1.6, color: "var(--t2)", maxWidth: "34ch" }}>
          {formatMathProse(currentStep.explanation)}
        </p>
        {currentStep.latex && (
          // Ilkin-in tapdığı bug (2026-08-15, screenshot): `whiteSpace: "nowrap"` +
          // `overflowX: "auto"` uzun düsturları mobil ekranda GÖRÜNMƏZ şəkildə kəsirdi —
          // qutu üfüqi sürüşdürülə bilirdi, amma bunun görünən heç bir işarəsi yox idi,
          // şagird "k = 9 · (−1/3)"-in yalnız "k = 9" hissəsini görüb DB-nin özü düzgün
          // olduğu halda nəticəni səhv sanırdı. İndi normal sətir keçidi ilə göstərilir —
          // heç nə kəsilmir, sürüşdürmə TƏLƏB OLUNMUR.
          <div
            style={{
              margin: "0 var(--page-pad-x)",
              padding: 16,
              border: "1px solid var(--bor)",
              borderRadius: "var(--rad)",
              background: "var(--sur)",
              fontFamily: "var(--font-mono)",
              fontSize: 20,
              color: "var(--t1)",
              whiteSpace: "normal",
              overflowWrap: "anywhere",
            }}
          >
            {formatMath(currentStep.latex)}
          </div>
        )}
      </div>

      <div style={{ padding: "0 var(--page-pad-x) 12px", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          {currentAnswer.status !== "correct" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{formatMathProse(currentStep.check.ask)}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                <input
                  type="text"
                  // UX audit tapıntısı (2026-08-14): `check.input_kind` YALNIZ telemetriyada
                  // işlədilirdi, real `<input>`-a heç vaxt ötürülmürdü — mobil klaviatura
                  // rəqəm sualında da tam hərf klaviaturası açırdı. `inputMode="decimal"`
                  // ("numeric" YOX) — mənfi ədəd/onluq vergül də yazıla bilməlidir (az
                  // lokalı), "decimal" klaviaturası bunu buraxır, "numeric" isə YOX.
                  inputMode={currentStep.check.input_kind === "number" ? "decimal" : undefined}
                  value={currentAnswer.input}
                  placeholder={t("step.inputPlaceholder")}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitAnswer();
                  }}
                  disabled={currentAnswer.status === "checking"}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: "var(--tap)",
                    border: "1px solid var(--bor)",
                    borderRadius: "var(--rad)",
                    background: "var(--sur)",
                    color: "var(--t1)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    padding: "0 14px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => void submitAnswer()}
                  disabled={!currentAnswer.input.trim() || currentAnswer.status === "checking" || passing}
                  style={{
                    minHeight: "var(--tap)",
                    padding: "0 22px",
                    border: "1px solid var(--acc)",
                    borderRadius: "var(--rad)",
                    background: "var(--accsoft)",
                    color: "var(--acc)",
                    fontFamily: "inherit",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    opacity: currentAnswer.input.trim() && currentAnswer.status !== "checking" ? 1 : 0.5,
                  }}
                >
                  {currentAnswer.status === "checking" ? t("step.checking") : t("step.check")}
                </button>
              </div>
              {hintOpen[stepIndex] && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 16px", borderRadius: "var(--rad)", background: "var(--sur)", border: "1px solid var(--bor)" }}>
                  <span style={{ fontSize: 12, color: "var(--t3)" }}>{t("step.hintLabel")}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>{formatMathProse(currentStep.hint)}</span>
                </div>
              )}
            </div>
          )}

          {currentAnswer.status === "correct" && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "12px 16px", borderRadius: "var(--rad)", background: "var(--accsoft)" }}>
              <span style={{ color: "var(--acc)", fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{t("step.correct")}</span>
            </div>
          )}

          {currentAnswer.status === "wrong" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px", borderRadius: "var(--rad)", background: "var(--warnsoft)" }}>
              {/* UX audit tapıntısı (2026-08-14): BURADA əvvəllər xam `currentStep.error_code`
                  (`PERCENT_TO_FRACTION` kimi) göstərilirdi — şagird üçün oxunmaz taksonomiya
                  açarı. İndi server-in tapdığı `error_codes.title_az` (Azərbaycanca insan
                  etiketi) göstərilir, TAPILMASA HEÇ NƏ göstərilmir (xam koda GERİ DÜŞMÜR). */}
              {currentAnswer.errorTitle && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      letterSpacing: "0.01em",
                      padding: "4px 8px",
                      borderRadius: "var(--radsm)",
                      border: "1px solid var(--warn)",
                      color: "var(--warn)",
                    }}
                  >
                    {currentAnswer.errorTitle}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--t3)" }}>{t("step.errorRecorded")}</span>
                </div>
              )}
              {/* Distraktor konkret mesajı (HANDOFF 83: "LLM-siz konkret diaqnostik mesaj")
                  ARTIQ göstərilir — əvvəllər checkStepAnswer-in tipi onu atırdı, HƏMİŞƏ
                  ümumi addım hint-i göstərilirdi, uyğun gələn distraktor olsa belə. */}
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>
                {formatMathProse(currentAnswer.distractorMessage ?? currentStep.hint)}
              </span>
              <button
                type="button"
                onClick={retryAnswer}
                style={{ alignSelf: "flex-start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer", borderBottom: "1px solid var(--bor)" }}
              >
                {t("step.retry")}
              </button>
            </div>
          )}

          {currentAnswer.status === "network_error" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px", borderRadius: "var(--rad)", background: "var(--warnsoft)" }}>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>{t("step.networkError")}</span>
              <button
                type="button"
                onClick={() => void submitAnswer()}
                style={{ alignSelf: "flex-start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer", borderBottom: "1px solid var(--bor)" }}
              >
                {t("step.retry")}
              </button>
            </div>
          )}

          {currentAnswer.status !== "correct" && !hintOpen[stepIndex] && (
            <button
              type="button"
              onClick={openHint}
              style={{ alignSelf: "flex-start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}
            >
              {t("step.needHint")}
            </button>
          )}
        </div>

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--bor)", padding: "10px var(--page-pad-x) 20px", flexShrink: 0 }}>
        {total > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 10, overflowX: "auto" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--t3)", flexShrink: 0 }}>
              {t("step.rail")}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {steps.map((s, i) => {
                const reached = i <= farthestIndex;
                const current = i === stepIndex;
                const locked = !reached || revealing || passing || currentAnswer.status === "checking";
                return (
                  <button
                    key={`${s.index}-${i}`}
                    type="button"
                    onClick={() => goToStep(i)}
                    disabled={locked && !current}
                    aria-current={current ? "step" : undefined}
                    aria-label={t("step.goTo", { index: i + 1 })}
                    style={{
                      minHeight: 44,
                      padding: "0 8px",
                      border: "none",
                      background: "transparent",
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      color: current ? "var(--t1)" : reached ? "var(--acc)" : "var(--t3)",
                      cursor: reached && !locked ? "pointer" : current ? "default" : "not-allowed",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {passError && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--warn)", margin: "0 0 10px" }}>{t("step.passError")}</p>
        )}
        <button
          type="button"
          onClick={() => {
            if (stepIndex >= total - 1) {
              void reveal();
              return;
            }
            if (stuckPassable && !alreadyUnlocked) {
              void passAndAdvance();
              return;
            }
            advance();
          }}
          // 86eyn28kn: orta addımda düzgün cavab VƏ YA (ipucu + səhv → keç) VƏ YA artıq
          // açılmış növbəti addıma qayıdış. Final hələ yalnız son addımdadır (86eymrkjn).
          disabled={revealing || passing || midStepLocked}
          style={{
            width: "100%",
            minHeight: 56,
            border: "none",
            borderRadius: "var(--rad)",
            background: "var(--acc)",
            color: "var(--accink)",
            fontFamily: "inherit",
            fontSize: 17,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            opacity: revealing || passing || midStepLocked ? 0.5 : 1,
            cursor: revealing || passing || midStepLocked ? "not-allowed" : "pointer",
          }}
        >
          <span>
            {stepIndex >= total - 1
              ? revealing
                ? t("step.checking")
                : t("step.showAnswer")
              : passing
                ? t("step.checking")
                : stuckPassable && !alreadyUnlocked
                  ? t("step.pass")
                  : t("step.next")}
          </span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{stepIndex >= total - 1 ? "↓" : "→"}</span>
        </button>
      </div>
    </main>
  );
}
