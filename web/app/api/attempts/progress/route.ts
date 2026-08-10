import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/attempts/progress — SYSTEM-REVIEW-2026-08-07 §A1: klientdən yazılır (server
// yalnız `delivered`-i `/api/solve` INSERT-də yazır). İki hal:
// - S4 son addımdan sonra "Cavabı göstər" → tam tamamlanma, `steps_revealed = steps_total`.
// - İstifadəçi son addıma çatmadan səhifəni tərk edir → `steps_revealed` göndərilən
//   `abandoned_at_step`-ə qədər artır ("harada itiririk?" sualının cavabı).
// Telemetriya kimi: cavab HƏMİŞƏ 200, xəta istifadəçiyə çatmır, server loguna yazılır.
//
// ADR-019 §2.6: `attempts.completed`/`abandoned_at_step`/`duration_sec` YOXDUR —
// `attempt_items.steps_revealed`/`steps_total`/`time_ms`-ə köçüb (design.md §9). Bir-bir
// qarşılıq yoxdur: "tamamlandı" indi `steps_revealed = steps_total` HESABLANMIŞ vəziyyətdir.

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
  completed?: unknown;
  abandoned_at_step?: unknown;
  duration_sec?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();
    const attemptId = body.attempt_id;
    const deviceId = body.device_id;
    if (typeof attemptId !== "string" || typeof deviceId !== "string") {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const completed = body.completed === true;
    const abandonedAtStep = Number.isInteger(body.abandoned_at_step) ? (body.abandoned_at_step as number) : null;
    const durationSec = typeof body.duration_sec === "number" && Number.isFinite(body.duration_sec)
      ? Math.round(body.duration_sec)
      : null;
    const timeMs = durationSec !== null ? durationSec * 1000 : null;

    // `greatest(steps_revealed, ...)` — bir dəfə irəli gedəndən sonra geriyə düşməsin
    // (məs. "yeni sual çək"ə keçidin unmount-cleanup-u eyni sətrə gecikmiş abandon göndərsə),
    // köhnə `completed = completed or $3` qaydası ilə eyni monotonluq təminatı.
    await pool.query(
      `update attempt_items ai
          set steps_revealed = case when $3 then ai.steps_total
                                     else greatest(ai.steps_revealed, coalesce($4, ai.steps_revealed))
                                end,
              time_ms = coalesce($5, ai.time_ms)
         from attempts a
        where ai.attempt_id = a.id and a.id = $1 and a.device_id = $2`,
      [attemptId, deviceId, completed, abandonedAtStep, timeMs]
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[/api/attempts/progress] xəta:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
