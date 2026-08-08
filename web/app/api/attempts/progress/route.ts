import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/attempts/progress — SYSTEM-REVIEW-2026-08-07 §A1: `attempts.completed`
// klientdən yazılır (server yalnız `delivered`-i /api/solve INSERT-də yazır). İki hal:
// - S4 son addımdan sonra "Cavabı göstər" → completed=true, duration_sec dolur.
// - İstifadəçi son addıma çatmadan səhifəni tərk edir → completed=false qalır,
//   abandoned_at_step dolur ("harada itiririk?" sualının cavabı).
// Telemetriya kimi: cavab HƏMİŞƏ 200, xəta istifadəçiyə çatmır, server loguna yazılır.

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

    // `completed = completed or $3` — bir dəfə true olandan sonra geriyə false yazılmasın
    // (məs. "yeni sual çək"ə keçidin unmount-cleanup-u eyni sətrə gecikmiş abandon göndərsə).
    await pool.query(
      `update attempts
         set completed = completed or $3,
             abandoned_at_step = coalesce($4, abandoned_at_step),
             duration_sec = coalesce($5, duration_sec)
       where id = $1 and device_id = $2`,
      [attemptId, deviceId, completed, abandonedAtStep, durationSec]
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[/api/attempts/progress] xəta:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
