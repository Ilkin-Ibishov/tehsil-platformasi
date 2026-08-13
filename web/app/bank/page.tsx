"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trackEvent, getDeviceId } from "@/lib/telemetry";
import { InviteGate, getStoredInviteCode, clearStoredInviteCode } from "@/components/kamera/InviteGate";
import { SolveView, type SolveResult } from "@/components/hell/SolveView";

// ClickUp 86eykhve0 — bank UI. Bankda 217 `auto_verified` sual var, addımları hazırdır, amma
// bu ekrandan ƏVVƏL onları göstərən HEÇ BİR yer yox idi (yeganə giriş kamera idi). LLM
// ÇAĞIRILMIR — `/api/bank/questions` siyahını, `/api/bank/start` seçilmiş sualın addımlarını
// `question_translations.steps`-dən OLDUĞU KİMİ qaytarır, sonra kamera axını ilə EYNİ
// `SolveView` işə düşür (`/api/steps/check`, `/api/attempts/reveal` dəyişmədən işləyir).

type BankQuestion = { id: string; subject: string; grade: number; topic_code: string; preview: string };
type Stage = "invite" | "loading" | "topics" | "questions" | "starting" | "solved" | "error";
type TopicGroup = { subject: string; grade: number; topicCode: string; questions: BankQuestion[] };

export default function BankPage() {
  const t = useTranslations("bank");
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(() => (getStoredInviteCode() ? "loading" : "invite"));
  const [inviteCode, setInviteCode] = useState<string | null>(() => getStoredInviteCode());
  const [questions, setQuestions] = useState<BankQuestion[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicGroup | null>(null);
  const [solution, setSolution] = useState<SolveResult | null>(null);
  const [solutionAttemptId, setSolutionAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (stage !== "loading" || !inviteCode) return;
    let cancelled = false;
    fetch(`/api/bank/questions?invite_code=${encodeURIComponent(inviteCode)}`)
      .then((res) => {
        if (res.status === 403) {
          clearStoredInviteCode();
          if (!cancelled) setStage("invite");
          return null;
        }
        return res.ok ? res.json() : Promise.reject(new Error(`http_${res.status}`));
      })
      .then((body) => {
        if (cancelled || !body) return;
        setQuestions(body.questions ?? []);
        trackEvent("bank.list_loaded", { count: body.questions?.length ?? 0 });
        setStage("topics");
      })
      .catch(() => {
        if (!cancelled) setStage("error");
      });
    return () => {
      cancelled = true;
    };
  }, [stage, inviteCode]);

  const topicGroups = useMemo<TopicGroup[]>(() => {
    if (!questions) return [];
    const map = new Map<string, TopicGroup>();
    for (const q of questions) {
      const key = `${q.subject}|${q.grade}|${q.topic_code}`;
      const existing = map.get(key);
      if (existing) existing.questions.push(q);
      else map.set(key, { subject: q.subject, grade: q.grade, topicCode: q.topic_code, questions: [q] });
    }
    return [...map.values()].sort((a, b) => a.grade - b.grade || a.topicCode.localeCompare(b.topicCode));
  }, [questions]);

  async function startQuestion(question: BankQuestion) {
    setStage("starting");
    trackEvent("bank.question_selected", { question_id: question.id, topic_code: question.topic_code, grade: question.grade });
    try {
      const res = await fetch("/api/bank/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: question.id, device_id: getDeviceId(), invite_code: inviteCode ?? "" }),
      });
      if (res.status === 403) {
        clearStoredInviteCode();
        setStage("invite");
        return;
      }
      if (!res.ok) {
        setStage("error");
        return;
      }
      const body = await res.json();
      setSolution({ canonical: body.canonical, steps: body.steps });
      setSolutionAttemptId(body.attempt_id);
      setStage("solved");
    } catch {
      setStage("error");
    }
  }

  function backToTopics() {
    setSelectedTopic(null);
    setSolution(null);
    setSolutionAttemptId(null);
    setStage("topics");
  }

  if (stage === "invite") {
    return (
      <InviteGate
        onCode={(code) => {
          setInviteCode(code);
          setStage("loading");
        }}
      />
    );
  }

  if (stage === "loading" || stage === "starting") {
    return (
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px var(--page-pad-x)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t3)" }}>
          {t("loading")}
        </span>
      </main>
    );
  }

  if (stage === "error") {
    return (
      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: "24px var(--page-pad-x)" }}>
        <h1 style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", margin: 0 }}>
          {t("errorTitle")}
        </h1>
        <button
          type="button"
          onClick={() => setStage("loading")}
          style={{ alignSelf: "flex-start", minHeight: "var(--tap)", padding: "0 22px", border: "none", borderRadius: "var(--rad)", background: "var(--acc)", color: "var(--accink)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          {t("errorRetry")}
        </button>
      </main>
    );
  }

  if (stage === "solved" && solution && solutionAttemptId) {
    return <SolveView solution={solution} attemptId={solutionAttemptId} onReset={backToTopics} resetLabel={t("backToTopics")} />;
  }

  if (stage === "questions" && selectedTopic) {
    return (
      <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "24px var(--page-pad-x)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <button
            type="button"
            onClick={() => setStage("topics")}
            style={{ border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer", padding: 0 }}
          >
            ← {t("backToTopics")}
          </button>
        </div>
        <h1 style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", margin: 0 }}>
          {selectedTopic.topicCode}
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {selectedTopic.questions.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => startQuestion(q)}
              style={{
                textAlign: "left",
                minHeight: "var(--tap)",
                padding: "12px 16px",
                border: "1px solid var(--bor)",
                borderRadius: "var(--rad)",
                background: "var(--sur)",
                color: "var(--t1)",
                fontFamily: "inherit",
                fontSize: 14,
                lineHeight: 1.5,
                cursor: "pointer",
              }}
            >
              {q.preview}
            </button>
          ))}
        </div>
      </main>
    );
  }

  // stage === "topics"
  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "24px var(--page-pad-x)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{ border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer", padding: 0 }}
        >
          ← {t("backHome")}
        </button>
      </div>
      <h1 style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: "var(--hsize)", margin: 0 }}>
        {t("title")}
      </h1>
      {topicGroups.length === 0 ? (
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)", margin: 0 }}>{t("empty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topicGroups.map((g) => (
            <button
              key={`${g.subject}|${g.grade}|${g.topicCode}`}
              type="button"
              onClick={() => {
                setSelectedTopic(g);
                setStage("questions");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                minHeight: "var(--tap)",
                padding: "12px 16px",
                border: "1px solid var(--bor)",
                borderRadius: "var(--rad)",
                background: "var(--sur)",
                color: "var(--t1)",
                fontFamily: "inherit",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "grid", rowGap: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{g.topicCode}</span>
                <span style={{ fontSize: 12, color: "var(--t3)" }}>{t("gradeLabel", { grade: g.grade })}</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--t2)" }}>{g.questions.length}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
