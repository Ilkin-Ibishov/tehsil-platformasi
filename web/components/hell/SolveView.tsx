"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent, getDeviceId } from "@/lib/telemetry";
import { reportAttemptProgress } from "@/lib/attempts";

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
};

type FinalAnswer = { latex: string; values: string[]; choice?: string };

type StepStatus = "idle" | "checking" | "correct" | "wrong" | "network_error";

type StepAnswerState = {
  input: string;
  status: StepStatus;
  attemptNo: number;
  startedAt: number;
};

// SYSTEM-REVIEW-2026-08-07 §2 (HANDOFF 45): addım yoxlaması indi SERVERDƏDİR
// (`/api/steps/check`) — `check.accept` artıq `/api/solve` cavabında yoxdur (bax
// web/app/api/solve/route.ts), ona görə burada yoxlana bilməzdi belə. Server §B1-dəki EYNİ
// `studentAnswerMatches`-i işlədir və nəticəni `step_events`-ə ÖZÜ yazır — `error_code` indi
// şagirdin CAVABINA əsaslanır, klientin "düz/səhv" dediyinə yox.
async function checkStepAnswer(attemptId: string, stepIndex: number, answer: string): Promise<{ correct: boolean }> {
  const res = await fetch("/api/steps/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt_id: attemptId, device_id: getDeviceId(), step_index: stepIndex, answer }),
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

export function SolveView({ solution, attemptId, onReset }: { solution: SolveResult; attemptId: string; onReset: () => void }) {
  const t = useTranslations("hell");
  const steps = solution.steps;
  const total = steps.length;

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, StepAnswerState>>({});
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState<FinalAnswer | null>(null);
  const [reportedWrong, setReportedWrong] = useState(false);
  const solveStartedAt = useRef(Date.now());
  const shownSteps = useRef<Set<number>>(new Set());

  const currentStep = steps[stepIndex];
  const currentAnswer = answers[stepIndex] ?? { input: "", status: "idle" as StepStatus, attemptNo: 0, startedAt: Date.now() };

  // SYSTEM-REVIEW-2026-08-07 §A1: son addıma çatmadan bu ekran sökülürsə (geri, "yeni sual
  // çək" ADƏTƏN sökmür amma naviqasiya edə bilər, tab bağlama) — `abandoned_at_step` bunu
  // yazır. `HANDOFF 40`-dakı unmount-cleanup dərsi eynidir: unmount anında `revealed`/`stepIndex`
  // dəyərləri prop/closure-dan gec ola bilər, ona görə ref-lər ayrıca sinxronlaşdırılır.
  const revealedRef = useRef(revealed);
  const stepIndexRef = useRef(stepIndex);
  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);
  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);
  useEffect(() => {
    return () => {
      if (!revealedRef.current) {
        reportAttemptProgress({ attemptId, completed: false, abandonedAtStep: stepIndexRef.current, durationSec: null });
      }
    };
  }, [attemptId]);

  useEffect(() => {
    if (revealed || !currentStep) return;
    if (shownSteps.current.has(stepIndex)) return;
    shownSteps.current.add(stepIndex);
    trackEvent("step.shown", { index: stepIndex, total, error_code: currentStep.error_code });
    setAnswers((prev) => ({
      ...prev,
      [stepIndex]: prev[stepIndex] ?? { input: "", status: "idle", attemptNo: 0, startedAt: Date.now() },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, revealed]);

  function setInput(value: string) {
    setAnswers((prev) => ({
      ...prev,
      [stepIndex]: { ...currentAnswer, input: value },
    }));
  }

  async function submitAnswer() {
    if (!currentStep || currentAnswer.status === "checking") return;
    const attemptNo = currentAnswer.attemptNo + 1;
    const timeOnStepMs = Date.now() - currentAnswer.startedAt;
    const submittedInput = currentAnswer.input;

    setAnswers((prev) => ({ ...prev, [stepIndex]: { ...currentAnswer, status: "checking" } }));

    let correct: boolean;
    try {
      const result = await checkStepAnswer(attemptId, stepIndex, submittedInput);
      correct = result.correct;
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
      [stepIndex]: { ...prev[stepIndex], input: submittedInput, status: correct ? "correct" : "wrong", attemptNo },
    }));
  }

  function retryAnswer() {
    setAnswers((prev) => ({
      ...prev,
      [stepIndex]: { ...currentAnswer, input: "", status: "idle" },
    }));
  }

  function abandonStep() {
    trackEvent("step.abandoned", { index: stepIndex, total });
    advance();
  }

  // HANDOFF (49) §3d: "Cavabı göstər" indi HƏR addımdan çağırıla bilər (ilişmiş şagirdin çıxış
  // yolu), təkcə sonuncudan yox — əvvəllər `advance()` yalnız son addımda buraya çatırdı.
  // `completed`/`abandoned_at_step` semantikasını qorumaq üçün "həqiqətən bitirdi" indi
  // ÇAĞIRIŞ ANINDAKI `stepIndex`-dən hesablanır: son addımdan çağırılıbsa tam bitmə, əks halda
  // pes etmə (`completed=false`, `abandoned_at_step=stepIndex`) — `solution.completed` YALNIZ
  // birincidə atılır, ikincidə DEYİL (steps_total/errors_total "bütün addımlar bitdi" fərz edir).
  async function reveal() {
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
    });
  }

  function advance() {
    if (stepIndex >= total - 1) {
      void reveal();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  const finalValuesText = useMemo(() => finalAnswer?.values.join(",  ") ?? "", [finalAnswer]);

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
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {finalValuesText}
        </div>
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
            <span>{t("answer.newProblem")}</span>
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
    <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 4, padding: "0 var(--page-pad-x) 0" }}>
        {steps.map((s) => (
          <span
            key={s.index}
            style={{
              height: 6,
              borderRadius: 99,
              flex: 1,
              background: s.index <= stepIndex ? "var(--acc)" : "var(--trackempty, var(--bor))",
              transition: "background 380ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        ))}
      </div>

      <div style={{ flex: 1, padding: "24px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "0 var(--page-pad-x)", display: "grid", rowGap: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--acc)" }}>
            {t("step.counter", { index: stepIndex + 1, total })}
          </span>
          <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: "24ch" }}>
            {currentStep.title}
          </span>
        </div>
        <p style={{ margin: 0, padding: "0 var(--page-pad-x)", fontSize: 16, lineHeight: 1.6, color: "var(--t2)", maxWidth: "34ch" }}>
          {currentStep.explanation}
        </p>
        {currentStep.latex && (
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
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {currentStep.latex}
          </div>
        )}

        <div style={{ padding: "0 var(--page-pad-x)", display: "flex", flexDirection: "column", gap: 12 }}>
          {currentAnswer.status !== "correct" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{currentStep.check.ask}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                <input
                  type="text"
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
                  disabled={!currentAnswer.input.trim() || currentAnswer.status === "checking"}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    padding: "4px 8px",
                    borderRadius: "var(--radsm)",
                    border: "1px solid var(--warn)",
                    color: "var(--warn)",
                  }}
                >
                  {currentStep.error_code}
                </span>
                <span style={{ fontSize: 12, color: "var(--t3)" }}>{t("step.errorRecorded")}</span>
              </div>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>{currentStep.hint}</span>
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

          <div style={{ display: "flex", gap: 20 }}>
            <button
              type="button"
              onClick={abandonStep}
              style={{ alignSelf: "flex-start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}
            >
              {t("step.abandon")}
            </button>
            {/* HANDOFF (49) §3d: ilişmiş şagird üçün HƏR addımdan çıxış yolu — sonuncu addıma
                qədər gözləmək məcburi deyil. `reveal()` `completed`/`abandoned_at_step`-i çağırış
                anındakı addımdan düzgün hesablayır (bax yuxarı şərh). */}
            <button
              type="button"
              onClick={() => void reveal()}
              disabled={revealing}
              style={{ alignSelf: "flex-start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer", opacity: revealing ? 0.6 : 1 }}
            >
              {t("step.showAnswer")}
            </button>
          </div>
        </div>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--bor)", padding: "10px var(--page-pad-x) 20px" }}>
        <button
          type="button"
          onClick={advance}
          disabled={revealing}
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
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            opacity: revealing ? 0.6 : 1,
          }}
        >
          <span>{stepIndex >= total - 1 ? (revealing ? t("step.checking") : t("step.showAnswer")) : t("step.next")}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{stepIndex >= total - 1 ? "↓" : "→"}</span>
        </button>
      </div>
    </main>
  );
}
