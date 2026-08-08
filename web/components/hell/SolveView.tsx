"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/telemetry";
import { studentAnswerMatches } from "@/lib/verify/answer";
import { reportAttemptProgress } from "@/lib/attempts";

export type SolveStep = {
  index: number;
  title: string;
  explanation: string;
  latex?: string;
  check: { ask: string; accept: string[]; input_kind?: "number" | "expression" | "choice" };
  error_code: string;
  hint: string;
};

export type SolveResult = {
  canonical: string;
  final_answer: { latex: string; values: string[]; choice?: string };
  steps: SolveStep[];
};

type StepAnswerState = {
  input: string;
  status: "idle" | "correct" | "wrong";
  attemptNo: number;
  startedAt: number;
};

// SYSTEM-REVIEW-2026-08-07 §B1: `check.accept` modelin düşündüyü YAZI formalarının siyahısıdır
// (`"0.5"`, `"1/2"`...), amma şagird bunlardan fərqli ekvivalent formada yaza bilər (`"0,5"`,
// `".5"`) — sadə sətir bərabərliyi bunu SƏHV sayardı. `studentAnswerMatches`
// (`web/lib/verify/answer.ts`) həm golden cavabın, həm indi şagird cavabının keçdiyi EYNİ
// normallaşdırma+ədədi ekvivalentlik yolundan istifadə edir (server-də `equationCrossCheck`-in
// işlətdiyi funksiyalar) — nəticə, "choice"/mətn cavablarda normallaşdırılmış sətir bərabərliyinə
// düşür, ədədi cavablarda isə forma fərqinə görə saxta `error_code` yazılmır.
function isCorrect(input: string, accept: string[]): boolean {
  if (!input.trim()) return false;
  return accept.some((a) => studentAnswerMatches(input, a));
}

export function SolveView({ solution, attemptId, onReset }: { solution: SolveResult; attemptId: string; onReset: () => void }) {
  const t = useTranslations("hell");
  const steps = solution.steps;
  const total = steps.length;

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, StepAnswerState>>({});
  const [revealed, setRevealed] = useState(false);
  const [reportedWrong, setReportedWrong] = useState(false);
  const solveStartedAt = useRef(Date.now());
  const shownSteps = useRef<Set<number>>(new Set());

  const currentStep = steps[stepIndex];
  const currentAnswer = answers[stepIndex] ?? { input: "", status: "idle", attemptNo: 0, startedAt: Date.now() };

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

  function submitAnswer() {
    if (!currentStep) return;
    const correct = isCorrect(currentAnswer.input, currentStep.check.accept);
    const attemptNo = currentAnswer.attemptNo + 1;
    const timeOnStepMs = Date.now() - currentAnswer.startedAt;

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
      [stepIndex]: { ...currentAnswer, status: correct ? "correct" : "wrong", attemptNo },
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

  function reveal() {
    setRevealed(true);
    trackEvent("solution.answer_revealed", { at_step: stepIndex + 1, of_total: total });
    const errorsTotal = Object.values(answers).filter((a) => a.status === "wrong").length;
    const durationSec = Math.round((Date.now() - solveStartedAt.current) / 1000);
    trackEvent("solution.completed", {
      steps_total: total,
      errors_total: errorsTotal,
      duration_sec: durationSec,
    });
    reportAttemptProgress({ attemptId, completed: true, abandonedAtStep: null, durationSec });
  }

  function advance() {
    if (stepIndex >= total - 1) {
      reveal();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  const finalValuesText = useMemo(() => solution.final_answer.values.join(",  "), [solution.final_answer.values]);

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
                    if (e.key === "Enter") submitAnswer();
                  }}
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
                  onClick={submitAnswer}
                  disabled={!currentAnswer.input.trim()}
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
                    opacity: currentAnswer.input.trim() ? 1 : 0.5,
                  }}
                >
                  {t("step.check")}
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

          <button
            type="button"
            onClick={abandonStep}
            style={{ alignSelf: "flex-start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}
          >
            {t("step.abandon")}
          </button>
        </div>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--bor)", padding: "10px var(--page-pad-x) 20px" }}>
        <button
          type="button"
          onClick={advance}
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
          }}
        >
          <span>{stepIndex >= total - 1 ? t("step.showAnswer") : t("step.next")}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{stepIndex >= total - 1 ? "↓" : "→"}</span>
        </button>
      </div>
    </main>
  );
}
