import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { checkInviteCode } from "@/lib/cascade/guards";

// GET /api/bank/questions?invite_code=... — ClickUp 86eykhve0.
//
// Bankda 217 `auto_verified` sual var, addımları hazırdır — bu, onları GÖSTƏRƏN yeganə
// endpoint-dir. LLM ÇAĞIRILMIR, xərc SIFIR. Yalnız oxuma — RLS/RPC-təcridinə EHTİYAC YOXDUR
// (`private.*`-a toxunmur, `final_answer`/`check.accept` bu cavabda YOXDUR — ADR-017-nin
// eyni qaydası: son cavab yalnız `/api/attempts/reveal`-dən gəlir).
//
// Dəvət kodu tələb olunur — tətbiqin BÜTÜN digər ekranları (`InviteGate`) eyni giriş
// qapısının arxasındadır, bank UI da eyni modelə tabedir.

type BankQuestionRow = {
  id: string;
  subject: string;
  grade: number;
  topic_code: string;
  preview: string;
};

export async function GET(req: NextRequest) {
  const inviteCode = req.nextUrl.searchParams.get("invite_code");
  if (!checkInviteCode(inviteCode).ok) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 403 });
  }

  // `qt.steps is not null and jsonb_array_length(...) > 0` — `0034`-ün lazy-generation
  // sətirləri (steps hələ yazılmayıb) İSTİSNA edilir, boş həll göstərmək imtinadan pisdir
  // (eyni qayda `web/lib/cascade/bank.ts::hasUsableSteps`-də).
  const { rows } = await pool.query<BankQuestionRow>(
    `select q.id, s.code as subject, q.grade, q.topic_code,
            left(coalesce(qt.stem->'blocks'->0->>'v', ''), 90) as preview
       from questions q
       join subjects s on s.id = q.subject_id
       join question_translations qt on qt.question_id = q.id and qt.lang = 'az'
      where q.superseded_by is null
        and q.deleted_at is null
        and q.review_status in ('auto_verified', 'verified')
        and qt.steps is not null
        and jsonb_array_length(qt.steps) > 0
      order by q.grade, q.topic_code, q.created_at`
  );

  return NextResponse.json({ questions: rows }, { status: 200 });
}
