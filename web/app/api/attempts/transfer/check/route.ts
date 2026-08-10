import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { studentAnswerMatches } from "@/lib/verify/answer";

// POST /api/attempts/transfer/check — S6 (HANDOFF 56 §1). `/api/attempts/transfer`-in verdiyi
// `transfer_problem_id`-nin cavabını EYNİ `studentAnswerMatches`-lə yoxlayır (§B1-dəki eyni
// normallaşdırma — `step.check`/final answer ilə tutarlı) və nəticəni ORİJİNAL `attempt_items`
// sətrinə (`transfer_correct`) yazır. Yeni cəhd sətri YARADILMIR — bu, S4/S5-dəki kimi ayrıca
// "cəhd" deyil, mövcud item-in davamıdır (design.md §9: `transfer_correct` `attempt_items`-dədir).
//
// HANDOFF (71): cavab dəyəri `reveal_answer(q,'verify',null)` ilə oxunur — `ai=null`, çünki bu
// sorğu MƏNBƏ item-ə deyil, TRANSFER sualının öz açarına aiddir, hələ ona bağlı item yoxdur.

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
  transfer_problem_id?: unknown;
  answer?: unknown;
};

type RevealResult = {
  answer: { values?: string[] };
} | null;

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json gözlənilir" }, { status: 400 });
  }

  const attemptId = body.attempt_id;
  const deviceId = body.device_id;
  const transferQuestionId = body.transfer_problem_id;
  const answer = body.answer;

  if (typeof attemptId !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({ error: "attempt_id/device_id gözlənilir" }, { status: 400 });
  }
  if (typeof transferQuestionId !== "string") {
    return NextResponse.json({ error: "transfer_problem_id gözlənilir" }, { status: 400 });
  }
  if (typeof answer !== "string") {
    return NextResponse.json({ error: "answer gözlənilir" }, { status: 400 });
  }

  const { rows: itemRows } = await pool.query<{ item_id: string }>(
    `select ai.id as item_id
       from attempt_items ai
       join attempts a on a.id = ai.attempt_id
      where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId]
  );
  if (itemRows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }
  const { item_id: itemId } = itemRows[0];

  const { rows: revealRows } = await pool.query<{ reveal_answer: RevealResult }>(
    `select reveal_answer($1, 'verify', null) as reveal_answer`,
    [transferQuestionId]
  );
  const revealed = revealRows[0]?.reveal_answer;
  const values = revealed?.answer?.values;
  if (!Array.isArray(values) || values.length === 0) {
    return NextResponse.json({ error: "transfer_problem_not_found" }, { status: 404 });
  }

  const correct = values.some((a) => studentAnswerMatches(answer, a));

  await pool.query(`update attempt_items set transfer_correct = $2 where id = $1`, [itemId, correct]);

  return NextResponse.json({ correct }, { status: 200 });
}
