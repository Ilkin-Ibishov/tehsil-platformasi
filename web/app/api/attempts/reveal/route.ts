import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/attempts/reveal — SYSTEM-REVIEW §2 (HANDOFF 45): `final_answer` `/api/solve`
// cavabında YOXDUR (bax route.ts) — şagird "Cavabı göstər"ə basanda BURADAN alınır.
// Ayrıca endpoint, `/api/steps/check`-in bir hissəsi DEYİL: SolveView-da "buraxıram" son
// addımda da `reveal()`-ə aparır (son addımı düz cavablandırmadan) — final_answer bu yolla
// da əlçatan olmalıdır, addım-yoxlamasının nəticəsindən asılı olmadan.

type Body = {
  attempt_id?: unknown;
  device_id?: unknown;
};

type StoredPayload = {
  final_answer?: { latex: string; values: string[]; choice?: string };
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

  const { rows } = await pool.query<{ payload: StoredPayload }>(
    `select s.payload
       from attempts a
       join solutions s on s.id = a.solution_id
      where a.id = $1 and a.device_id = $2`,
    [attemptId, deviceId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }

  const finalAnswer = rows[0].payload.final_answer;
  if (!finalAnswer) {
    return NextResponse.json({ error: "final_answer_missing" }, { status: 404 });
  }

  return NextResponse.json({ final_answer: finalAnswer }, { status: 200 });
}
