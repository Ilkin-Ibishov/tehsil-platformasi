import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/steps/shown — S-tapşırığı (2026-08-14, HANDOFF 104): hər addım ekrana çıxanda
// klient BURAYA bir "damğa" göndərir (`step.shown` telemetriya hadisəsinin YANINDA, ona
// ƏVƏZ YOX). `public.step_views.shown_at` server `now()`-udur — klient saatına ETİBAR
// EDİLMİR. `public.v_step_timing` bu sətirlərdən `lead()` pəncərə funksiyası ilə hər addımın
// müddətini (növbəti addımın `shown_at`-ına qədər) hesablayır.
//
// Telemetriya kimi: HEÇ VAXT axını bloklamır, uğursuzluq sükutla udulur (loga düşür).
type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
  step_index?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();
    const attemptId = body.attempt_id;
    const deviceId = body.device_id;
    const stepIndex = body.step_index;

    if (typeof attemptId !== "string" || typeof deviceId !== "string" || !Number.isInteger(stepIndex)) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    await pool.query(
      `insert into public.step_views (attempt_id, step_index)
       select a.id, $3
         from attempts a
        where a.id = $1 and a.device_id = $2`,
      [attemptId, deviceId, stepIndex]
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[/api/steps/shown] xəta:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
