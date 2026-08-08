import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/attempts/transfer — S6 (HANDOFF 56 §1): "eynisini sən həll et". Yeni LLM çağırışı
// YOXDUR — `problems` cədvəlindən EYNİ `topic_code`-lu BAŞQA məsələ seçilir (keşi də sınayır).
//
// ADR-003 §"Test ekranındakı suallar öz formulasiyamız olmalıdır": `problem_type='formula'`-ya
// MƏHDUDLAŞDIRILIB. `word_problem` üçün `canonical` DİM mətninin özüdür (§D1) — başqa şagirdə
// geri göstərmək elə ADR-003-ün qadağan etdiyi şeydir, yalnız fərqli koddan. Riyazi ifadə isə
// "zəif qorunur" (ADR-003), təkrar göstərmək təhlükəsizdir.
//
// Sual mətni `problems.canonical`-dan YOX, `solutions.payload.canonical`-dan oxunur — §D1
// düzəlişindən sonra `problems.canonical` boşalacaq, `payload` isə hələ toxunulmayıb.

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
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

  const { rows: originRows } = await pool.query<{ topic_code: string | null; problem_id: string }>(
    `select p.topic_code, p.id as problem_id
       from attempts a
       join problems p on p.id = a.problem_id
      where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId]
  );
  if (originRows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }
  const { topic_code: topicCode, problem_id: originProblemId } = originRows[0];
  if (!topicCode) {
    return NextResponse.json({ error: "no_transfer_available" }, { status: 404 });
  }

  const { rows: candidateRows } = await pool.query<{ problem_id: string; canonical: string }>(
    `select p.id as problem_id, s.payload->>'canonical' as canonical
       from problems p
       join solutions s on s.problem_id = p.id
      where p.topic_code = $1
        and p.problem_type = 'formula'
        and p.id != $2
        and s.payload->'final_answer'->'values' is not null
        and jsonb_array_length(s.payload->'final_answer'->'values') > 0
      order by random()
      limit 1`,
    [topicCode, originProblemId]
  );
  if (candidateRows.length === 0) {
    return NextResponse.json({ error: "no_transfer_available" }, { status: 404 });
  }

  const candidate = candidateRows[0];
  return NextResponse.json(
    { transfer_problem_id: candidate.problem_id, canonical: candidate.canonical },
    { status: 200 }
  );
}
