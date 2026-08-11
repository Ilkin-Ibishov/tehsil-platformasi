import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { validateStepIndex, resolveStepCheck } from "@/lib/verify/step-check";

// POST /api/steps/check — SYSTEM-REVIEW-2026-08-07 §2 (HANDOFF 45): addım yoxlaması serverdə
// olur. Server `question_translations.steps`-dən (public, `error_code`/addım mətni üçün) və
// `private.step_answers`-dən (`reveal_step_answer` RPC-si ilə, HANDOFF 71) oxuyur, §B1-dəki
// EYNİ `studentAnswerMatches`-lə müqayisə edir və faktı `step_events`-ə ÖZÜ yazır (klient
// hesabatı yox — `error_code` indi şagirdin CAVABINA əsaslanır, klientin dediyinə yox).
//
// `error_code`/`hint` BURADA qaytarılmır — onlar sirr deyil, `/api/solve` cavabında artıq
// klientdədir (yalnız `check.accept` və `final_answer` gizlədilib).
//
// HANDOFF (73) — BLOKLAYICI DÜZƏLİŞ: `step_index` İNDİ birbaşa STEP-SCHEMA `index`
// sahəsidir (klient `SolveStep.index`-i geri göndərir, massiv MÖVQEYİ YOX). Əvvəlki versiya
// massiv mövqeyini `private.step_answers`-in saxladığı `index`-ə "körpüləyirdi"
// (`steps[stepIndex].index`) — bu körpü `question_translations`-un dil fallback zəncirinə
// (`ru → az → tr → en`) görə SƏSSİZ SINIRDI: client bir dildə render edir, server başqa dildən
// oxuyur, iki tərcümənin `steps[]` sırası/uzunluğu FƏRQLİ ola bilər. Körpü tamamilə silinib —
// açar birbaşa `index` ilə axtarılır, tapılmasa AÇIQ `400` qaytarılır (səssiz `false` YOX).
//
// HANDOFF (79) / gate-78: `reveal_step_answer` `app` sxeminə köçüb (bax
// `attempts/reveal/route.ts`-in şərhi) — `anon`/`authenticated`-in `SECURITY DEFINER`
// funksiyaları birbaşa REST-dən çağıra bilməsi qarşısı alınıb.

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
  step_index?: unknown;
  answer?: unknown;
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
  const answer = body.answer;

  if (typeof attemptId !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({ error: "attempt_id/device_id gözlənilir" }, { status: 400 });
  }
  const stepIndex = validateStepIndex(body.step_index);
  if (stepIndex === null) {
    // STEP-SCHEMA: steps[].index minimum 1 — massiv mövqeyi (0-based) ARTIQ QƏBUL EDİLMİR.
    return NextResponse.json({ error: "step_index gözlənilir" }, { status: 400 });
  }
  if (typeof answer !== "string") {
    return NextResponse.json({ error: "answer gözlənilir" }, { status: 400 });
  }

  const { rows } = await pool.query<{ item_id: string; question_id: string; error_code: string | null }>(
    `select ai.id as item_id, ai.question_id,
            (
              select elem ->> 'error_code'
                from question_translations qt, jsonb_array_elements(qt.steps) elem
               where qt.question_id = ai.question_id and qt.lang = 'az'
                 and (elem ->> 'index')::int = $3
            ) as error_code
       from attempt_items ai
       join attempts a on a.id = ai.attempt_id
      where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId, stepIndex]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }

  const { item_id: itemId, question_id: questionId, error_code: errorCode } = rows[0];

  const { rows: answerRows } = await pool.query<{ reveal_step_answer: { accept?: string[]; input_kind?: string } | null }>(
    `select app.reveal_step_answer($1, $2, 'verify', $3) as reveal_step_answer`,
    [questionId, stepIndex, itemId]
  );
  // Açıq validasiya (HANDOFF 73): açar tapılmadıqda AÇIQ 400, səssiz `{correct:false}` YOX —
  // əks halda naməlum/səhv `step_index` şagirdə "səhv cavab" kimi göstərilə bilərdi.
  const result = resolveStepCheck(answerRows[0]?.reveal_step_answer, answer);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const correct = result.correct;

  try {
    const { rows: countRows } = await pool.query<{ c: number }>(
      `select count(*)::int as c from step_events where attempt_id = $1 and step_index = $2`,
      [attemptId, stepIndex]
    );
    const attemptsCount = (countRows[0]?.c ?? 0) + 1;
    await pool.query(
      `insert into step_events (attempt_id, step_index, error_code, attempts_count)
       values ($1,$2,$3,$4)`,
      [attemptId, stepIndex, correct ? null : errorCode, attemptsCount]
    );
  } catch (err) {
    // step_events yalnız ölçmədir — yazı uğursuz olsa da şagird cavabı almalıdır.
    console.error("[/api/steps/check] step_events yazı xətası:", err);
  }

  return NextResponse.json({ correct }, { status: 200 });
}
