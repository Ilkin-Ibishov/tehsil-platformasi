import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { validateStepIndex } from "@/lib/verify/step-check";
import { resolveStepPass } from "@/lib/verify/step-pass";

// POST /api/steps/pass — ClickUp 86eyn28kn. Orta addımda ilişmə çıxışı.
// Final cavabı AÇMIR (`/api/attempts/reveal` YOX). `error_code` server `question_translations`
// addımından oxunur — klient göndərmir. Keçid yalnız bu addımda `is_correct=false` sətri
// olanda (ən azı bir səhv cəhd). İpucu serverdə yoxdur; klient onu ayrıca tələb edir.

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
  step_index?: unknown;
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
  if (typeof attemptId !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({ error: "attempt_id/device_id gözlənilir" }, { status: 400 });
  }
  const stepIndex = validateStepIndex(body.step_index);
  if (stepIndex === null) {
    return NextResponse.json({ error: "step_index gözlənilir" }, { status: 400 });
  }

  const { rows } = await pool.query<{
    error_code: string | null;
    max_index: number | null;
    has_wrong: boolean;
    already_correct: boolean;
    last_wrong_answer: string | null;
  }>(
    `select
       (
         select elem ->> 'error_code'
           from question_translations qt, jsonb_array_elements(qt.steps) elem
          where qt.question_id = ai.question_id and qt.lang = 'az'
            and (elem ->> 'index')::int = $3
       ) as error_code,
       (
         select max((elem ->> 'index')::int)
           from question_translations qt, jsonb_array_elements(qt.steps) elem
          where qt.question_id = ai.question_id and qt.lang = 'az'
       ) as max_index,
       exists (
         select 1 from step_events se
          where se.attempt_id = a.id and se.step_index = $3 and se.is_correct = false
       ) as has_wrong,
       exists (
         select 1 from step_events se
          where se.attempt_id = a.id and se.step_index = $3 and se.is_correct = true
       ) as already_correct,
       (
         select se.given_answer
           from step_events se
          where se.attempt_id = a.id and se.step_index = $3 and se.is_correct = false
          order by se.created_at desc nulls last
          limit 1
       ) as last_wrong_answer
      from attempt_items ai
      join attempts a on a.id = ai.attempt_id
     where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId, stepIndex],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }

  const row = rows[0];
  if (row.error_code == null || row.max_index == null) {
    return NextResponse.json({ error: "step_not_found" }, { status: 400 });
  }

  const gate = resolveStepPass({
    isLastStep: stepIndex === row.max_index,
    alreadyCorrect: row.already_correct,
    hasWrongAttempt: row.has_wrong,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 400 });
  }

  const givenAnswer = typeof row.last_wrong_answer === "string" ? row.last_wrong_answer : "";

  try {
    const { rows: countRows } = await pool.query<{ c: number }>(
      `select count(*)::int as c from step_events where attempt_id = $1 and step_index = $2`,
      [attemptId, stepIndex],
    );
    const attemptsCount = (countRows[0]?.c ?? 0) + 1;
    await pool.query(
      `insert into step_events (attempt_id, step_index, error_code, attempts_count, given_answer, is_correct)
       values ($1,$2,$3,$4,$5,false)`,
      [attemptId, stepIndex, row.error_code, attemptsCount, givenAnswer],
    );
  } catch (err) {
    console.error("[/api/steps/pass] step_events yazı xətası:", err);
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
