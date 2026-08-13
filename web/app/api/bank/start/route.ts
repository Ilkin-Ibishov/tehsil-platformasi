import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";
import { checkInviteCode } from "@/lib/cascade/guards";

// POST /api/bank/start — ClickUp 86eykhve0. Şagird bank siyahısından sual seçəndə çağırılır.
// LLM ÇAĞIRILMIR — addımlar `question_translations.steps`-dən OLDUĞU KİMİ oxunur (artıq
// `check.accept`-siz, ADR-017). `SolveView` komponenti bundan sonra kamera axını ilə EYNİ
// (`/api/steps/check`, `/api/attempts/reveal`, `/api/attempts/progress`) — bu endpoint yalnız
// SolveView-un gözlədiyi `attempts`/`attempt_items` cütünü yaradır.
//
// `kind='bank_practice'` (`kind='photo_solve'`-dan FƏRQLİ) — `web/lib/cascade/guards.ts` və
// `web/app/api/solve/route.ts`-in gündəlik limit sorğusu bunu İSTİSNA edir: DAILY_LIMIT-in
// məqsədi LLM xərcini məhdudlaşdırmaqdır, bank sualının LLM xərci SIFIRDIR. `delivered=true`
// isə YAZILIR — Faza 1 qapısının "100+ real həll" metrikası bank təcrübəsini DƏ saymalıdır
// (ClickUp tapşırığının öz sözü: "bu ekran olmadan... metrika yalnız kamera axınından yığılacaq").

type Body = {
  question_id?: unknown;
  device_id?: unknown;
  invite_code?: unknown;
};

type QuestionRow = {
  canonical: string | null;
  steps: unknown;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json gözlənilir" }, { status: 400 });
  }

  const questionId = body.question_id;
  const deviceId = body.device_id;
  if (typeof questionId !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({ error: "question_id/device_id gözlənilir" }, { status: 400 });
  }
  const invite = checkInviteCode(body.invite_code);
  if (!invite.ok) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 403 });
  }

  const { rows } = await pool.query<QuestionRow>(
    `select qt.stem->'blocks'->0->>'v' as canonical, qt.steps as steps
       from questions q
       join question_translations qt on qt.question_id = q.id and qt.lang = 'az'
      where q.id = $1
        and q.superseded_by is null
        and q.deleted_at is null
        and q.review_status in ('auto_verified', 'verified')`,
    [questionId]
  );
  const row = rows[0];
  if (!row || !Array.isArray(row.steps) || row.steps.length === 0) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  const sessionId = randomUUID();
  const itemId = randomUUID();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into attempts (id, device_id, student_ref, kind, started_at, client_created_at)
       values ($1,$2,$3,'bank_practice',now(),now())`,
      [sessionId, deviceId, invite.studentRef]
    );
    await client.query(
      `insert into attempt_items
         (id, attempt_id, question_id, match_path, ocr_source, delivered, steps_total, cost_usd)
       values ($1,$2,$3,'bank','bank',true,$4,0)`,
      [itemId, sessionId, questionId, row.steps.length]
    );
    // `hit_count` — bank sualının BAŞQA bir yolla (kamera keşi) yox, birbaşa özü seçildiyi
    // dəfələrin sayğacı. `attempt_count` isə HƏR iki yolu birləşdirir (questions.attempt_count
    // şərhi, `web/lib/cascade/persist.ts`-in EYNİ konvensiyası).
    await client.query(`update questions set hit_count = hit_count + 1, attempt_count = attempt_count + 1 where id = $1`, [
      questionId,
    ]);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    console.error("[/api/bank/start] DB xətası:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json(
    { attempt_id: sessionId, canonical: row.canonical ?? "", steps: row.steps },
    { status: 200 }
  );
}
