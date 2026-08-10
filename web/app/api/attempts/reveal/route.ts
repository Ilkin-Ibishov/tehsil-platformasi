import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/attempts/reveal — SYSTEM-REVIEW §2 (HANDOFF 45): `final_answer` `/api/solve`
// cavabında YOXDUR (bax route.ts) — şagird "Cavabı göstər"ə basanda BURADAN alınır.
// Ayrıca endpoint, `/api/steps/check`-in bir hissəsi DEYİL: SolveView-da "buraxıram" son
// addımda da `reveal()`-ə aparır (son addımı düz cavablandırmadan) — final_answer bu yolla
// da əlçatan olmalıdır, addım-yoxlamasının nəticəsindən asılı olmadan.
//
// HANDOFF (71): `private.question_answers`-ə birbaşa `JOIN`-la toxunmaq artıq mümkün deyil
// (`app_runtime`-in `private`-ə GRANT-ı yoxdur) — `reveal_answer(q, purpose, ai)` RPC-si
// ilə oxunur, `purpose='reveal'` (bu, QƏSDƏN göstərmə axınıdır, `'verify'` YOX), hər çağırış
// `private.answer_access_log`-a yazılır.

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
};

type RevealResult = {
  answer: { latex: string; values: string[]; choice?: string };
  validator: string;
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
  if (typeof attemptId !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({ error: "attempt_id/device_id gözlənilir" }, { status: 400 });
  }

  const { rows } = await pool.query<{ item_id: string; question_id: string }>(
    `select ai.id as item_id, ai.question_id
       from attempt_items ai
       join attempts a on a.id = ai.attempt_id
      where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }

  const { item_id: itemId, question_id: questionId } = rows[0];
  const { rows: revealRows } = await pool.query<{ reveal_answer: RevealResult }>(
    `select reveal_answer($1, 'reveal', $2) as reveal_answer`,
    [questionId, itemId]
  );
  const revealed = revealRows[0]?.reveal_answer;
  if (!revealed || !revealed.answer) {
    return NextResponse.json({ error: "final_answer_missing" }, { status: 404 });
  }

  return NextResponse.json({ final_answer: revealed.answer }, { status: 200 });
}
