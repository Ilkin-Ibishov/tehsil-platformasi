import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { studentAnswerMatches } from "@/lib/verify/answer";

// POST /api/attempts/transfer/check — S6 (HANDOFF 56 §1). `/api/attempts/transfer`-in verdiyi
// `transfer_problem_id`-nin cavabını EYNİ `studentAnswerMatches`-lə yoxlayır (§B1-dəki eyni
// normallaşdırma — `step.check`/final answer ilə tutarlı) və nəticəni ORİJİNAL `attempts`
// sətrinə (`attempt_id`) yazır, `transfer_correct`. Yeni cəhd sətri YARADILMIR — bu, S4/S5-dəki
// kimi ayrıca "cəhd" deyil, mövcud attempt-in davamıdır (DATA-MODEL.md: sahə `attempts`-dədir).

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
  transfer_problem_id?: unknown;
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
  const transferProblemId = body.transfer_problem_id;
  const answer = body.answer;

  if (typeof attemptId !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({ error: "attempt_id/device_id gözlənilir" }, { status: 400 });
  }
  if (typeof transferProblemId !== "string") {
    return NextResponse.json({ error: "transfer_problem_id gözlənilir" }, { status: 400 });
  }
  if (typeof answer !== "string") {
    return NextResponse.json({ error: "answer gözlənilir" }, { status: 400 });
  }

  const { rows: attemptRows } = await pool.query(
    `select id from attempts where id = $1 and device_id = $2`,
    [attemptId, deviceId]
  );
  if (attemptRows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }

  const { rows: solutionRows } = await pool.query<{ values: string[] }>(
    `select s.payload->'final_answer'->'values' as values
       from solutions s
      where s.problem_id = $1
      order by s.created_at desc
      limit 1`,
    [transferProblemId]
  );
  if (solutionRows.length === 0 || !Array.isArray(solutionRows[0].values) || solutionRows[0].values.length === 0) {
    return NextResponse.json({ error: "transfer_problem_not_found" }, { status: 404 });
  }

  const accept = solutionRows[0].values;
  const correct = accept.some((a) => studentAnswerMatches(answer, a));

  await pool.query(`update attempts set transfer_correct = $2 where id = $1 and device_id = $3`, [
    attemptId,
    correct,
    deviceId,
  ]);

  return NextResponse.json({ correct }, { status: 200 });
}
