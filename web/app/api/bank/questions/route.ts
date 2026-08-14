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
//
// UX audit tapıntısı (2026-08-14) — İKİ düzəliş:
//   1. `topic_title` — Cowork-un `public.topic_codes.title_az`-ı (0051) LEFT JOIN edilir.
//      Tapılmasa `null` qalır, klient bu halda XAM `topic_code`-a geri dönür (heç vaxt boş
//      ekran görünmür) — amma indi 5 bank-matchable mövzunun HAMISI title_az daşıyır.
//   2. `order by` — əvvəllər `q.created_at` idi, bu, TƏSADÜFİ görünən sıra verirdi (46-55
//      demək olar eyni sualı SEÇMƏK üçün heç bir məntiqli əsas yox idi). İndi
//      `fingerprint_digits`-in BİRİNCİ ədədinə görə RİYAZİ artan sıra.

type BankQuestionRow = {
  id: string;
  subject: string;
  grade: number;
  topic_code: string;
  topic_title: string | null;
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
    `select q.id, s.code as subject, q.grade, q.topic_code, tc.title_az as topic_title,
            left(coalesce(qt.stem->'blocks'->0->>'v', ''), 90) as preview
       from questions q
       join subjects s on s.id = q.subject_id
       join question_translations qt on qt.question_id = q.id and qt.lang = 'az'
       left join public.topic_codes tc on tc.code = q.topic_code
      where q.superseded_by is null
        and q.deleted_at is null
        and q.review_status in ('auto_verified', 'verified')
        and qt.steps is not null
        and jsonb_array_length(qt.steps) > 0
      order by q.grade, q.topic_code,
               nullif(split_part(q.fingerprint_digits, ',', 1), '')::numeric nulls last,
               q.fingerprint_digits,
               q.created_at`
  );

  return NextResponse.json({ questions: rows }, { status: 200 });
}
