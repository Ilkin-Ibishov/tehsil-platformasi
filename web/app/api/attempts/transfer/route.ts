import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/attempts/transfer — S6 (HANDOFF 56 §1): "eynisini sən həll et". Yeni LLM çağırışı
// YOXDUR — `questions` cədvəlindən EYNİ `topic_code`-lu BAŞQA sual seçilir (keşi də sınayır).
//
// ADR-003 §"Test ekranındakı suallar öz formulasiyamız olmalıdır": `problem_type='formula'`-ya
// MƏHDUDLAŞDIRILIB — bu sütun `questions`-a `problems`-dan olduğu kimi köçüb (ADR-018 §1b),
// dəyişməyib. `word_problem`-un `canonical`-ı DİM mətninin özüdür (§D1) — başqa şagirdə
// geri göstərmək elə ADR-003-ün qadağan etdiyi şeydir, yalnız fərqli koddan.
//
// ADR-019 §2.4: sual mətni `question_translations.stem`-dən oxunur (tək-blok formatı,
// `0017`/`/api/solve`-un saxladığı EYNİ struktur). `final_answer.values is not null`
// mövcudluq filtri (köhnə) DÜŞÜB — `private` sxeminə bu sorğudan toxunmaq mümkün deyil,
// əvəzinə `qt.verified=true` işlədilir (praktiki ekvivalent, bax ADR-019 §2.4 qeydi).

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

  const { rows: originRows } = await pool.query<{ topic_code: string | null; question_id: string }>(
    `select q.topic_code, q.id as question_id
       from attempt_items ai
       join attempts a on a.id = ai.attempt_id
       join questions q on q.id = ai.question_id
      where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId]
  );
  if (originRows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }
  const { topic_code: topicCode, question_id: originQuestionId } = originRows[0];
  if (!topicCode) {
    return NextResponse.json({ error: "no_transfer_available" }, { status: 404 });
  }

  const { rows: candidateRows } = await pool.query<{ question_id: string; canonical: string | null }>(
    `select q.id as question_id, qt.stem -> 'blocks' -> 0 ->> 'v' as canonical
       from questions q
       join question_translations qt on qt.question_id = q.id and qt.lang = 'az'
      where q.topic_code = $1
        and q.problem_type = 'formula'
        and q.id != $2
        and qt.verified = true
      order by random()
      limit 1`,
    [topicCode, originQuestionId]
  );
  if (candidateRows.length === 0 || !candidateRows[0].canonical) {
    return NextResponse.json({ error: "no_transfer_available" }, { status: 404 });
  }

  const candidate = candidateRows[0];
  return NextResponse.json(
    { transfer_problem_id: candidate.question_id, canonical: candidate.canonical },
    { status: 200 }
  );
}
