import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { studentAnswerMatches } from "@/lib/verify/answer";

// POST /api/steps/check — SYSTEM-REVIEW-2026-08-07 §2 (HANDOFF 45): addım yoxlaması serverdə
// olur. Server `question_translations.steps`-dən (public, `error_code`/addım mətni üçün) və
// `private.step_answers`-dən (`reveal_step_answer` RPC-si ilə, HANDOFF 71) oxuyur, §B1-dəki
// EYNİ `studentAnswerMatches`-lə müqayisə edir və faktı `step_events`-ə ÖZÜ yazır (klient
// hesabatı yox — `error_code` indi şagirdin CAVABINA əsaslanır, klientin dediyinə yox).
//
// `error_code`/`hint` BURADA qaytarılmır — onlar sirr deyil, `/api/solve` cavabında artıq
// klientdədir (yalnız `check.accept` və `final_answer` gizlədilib).
//
// ADR-019 §2.2: `stepIndex` klientdən MASSİV MÖVQEYİ (0-based) kimi gəlir — `/api/solve`-in
// qaytardığı `steps[]` sırası ilə EYNİ sıradır `question_translations.steps` (`0017`/solve
// route-u eyni array-i saxlayır). `private.step_answers.step_index` isə STEP-SCHEMA-nın
// `index` SAHƏSİDİR (1-based, məcburi ardıcıl DEYİL) — bu iki rəqəm EYNİ OLMAYA BİLƏR, ona
// görə əvvəlcə massiv mövqeyi ilə addımı tapıb, SONRA onun öz `index`-i ilə RPC çağırılır.

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
  step_index?: unknown;
  answer?: unknown;
};

type StoredStep = {
  index?: number;
  error_code?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json gözlənilir" }, { status: 400 });
  }

  const attemptId = body.attempt_id;
  const deviceId = body.device_id;
  const stepIndex = body.step_index;
  const answer = body.answer;

  if (typeof attemptId !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({ error: "attempt_id/device_id gözlənilir" }, { status: 400 });
  }
  if (!Number.isInteger(stepIndex) || (stepIndex as number) < 0) {
    return NextResponse.json({ error: "step_index gözlənilir" }, { status: 400 });
  }
  if (typeof answer !== "string") {
    return NextResponse.json({ error: "answer gözlənilir" }, { status: 400 });
  }

  const { rows } = await pool.query<{ item_id: string; question_id: string; steps: StoredStep[] }>(
    `select ai.id as item_id, ai.question_id, qt.steps
       from attempt_items ai
       join attempts a on a.id = ai.attempt_id
       join question_translations qt on qt.question_id = ai.question_id and qt.lang = 'az'
      where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }

  const { item_id: itemId, question_id: questionId, steps } = rows[0];
  const step = steps[stepIndex as number];
  if (!step || typeof step.index !== "number") {
    return NextResponse.json({ error: "step_not_found" }, { status: 400 });
  }

  const { rows: answerRows } = await pool.query<{ reveal_step_answer: { accept?: string[]; input_kind?: string } | null }>(
    `select reveal_step_answer($1, $2, 'verify', $3) as reveal_step_answer`,
    [questionId, step.index, itemId]
  );
  const revealed = answerRows[0]?.reveal_step_answer;
  if (!revealed || !Array.isArray(revealed.accept)) {
    return NextResponse.json({ error: "step_not_found" }, { status: 400 });
  }

  const accept = revealed.accept;
  const correct = accept.some((a) => studentAnswerMatches(answer, a));

  try {
    const { rows: countRows } = await pool.query<{ c: number }>(
      `select count(*)::int as c from step_events where attempt_id = $1 and step_index = $2`,
      [attemptId, stepIndex]
    );
    const attemptsCount = (countRows[0]?.c ?? 0) + 1;
    await pool.query(
      `insert into step_events (attempt_id, step_index, error_code, attempts_count)
       values ($1,$2,$3,$4)`,
      [attemptId, stepIndex, correct ? null : step.error_code ?? null, attemptsCount]
    );
  } catch (err) {
    // step_events yalnız ölçmədir — yazı uğursuz olsa da şagird cavabı almalıdır.
    console.error("[/api/steps/check] step_events yazı xətası:", err);
  }

  return NextResponse.json({ correct }, { status: 200 });
}
