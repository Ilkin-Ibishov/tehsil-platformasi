import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { studentAnswerMatches } from "@/lib/verify/answer";

// POST /api/steps/check — SYSTEM-REVIEW-2026-08-07 §2 (HANDOFF 45): addım yoxlaması serverdə
// olur. `/api/solve` artıq `check.accept`-i şəbəkəyə göndərmir (bax route.ts) — server DB-dəki
// `solutions.payload`-dan (tam LLM çıxışı, heç vaxt gizlədilməyib) oxuyur, §B1-dəki EYNİ
// `studentAnswerMatches`-lə müqayisə edir və faktı `step_events`-ə ÖZÜ yazır (klient hesabatı
// yox — `error_code` indi şagirdin CAVABINA əsaslanır, klientin dediyinə yox).
//
// `error_code`/`hint` BURADA qaytarılmır — onlar sirr deyil, `/api/solve` cavabında artıq
// klientdədir (yalnız `check.accept` və `final_answer` gizlədilib).

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
  step_index?: unknown;
  answer?: unknown;
};

type StoredStep = {
  check?: { accept?: string[] };
  error_code?: string;
};

type StoredPayload = {
  steps?: StoredStep[];
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

  const { rows } = await pool.query<{ payload: StoredPayload }>(
    `select s.payload
       from attempts a
       join solutions s on s.id = a.solution_id
      where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }

  const steps = rows[0].payload.steps ?? [];
  const step = steps[stepIndex as number];
  if (!step || !Array.isArray(step.check?.accept)) {
    return NextResponse.json({ error: "step_not_found" }, { status: 400 });
  }

  const accept = step.check.accept;
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
