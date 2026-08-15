import { NextRequest, NextResponse } from "next/server";
import { checkInviteCode } from "@/lib/cascade/guards";

// POST /api/invite/check — ClickUp 86eymrm6g.
//
// InviteGate əvvəl istənilən qeyri-boş sətri localStorage-a yazıb irəli aparırdı; real
// yoxlama yalnız sonrakı API-də (kamera: /api/solve 403, bank: /api/bank/questions 403)
// baş verirdi. Bank yolunda 403 səssiz boş formaya qayıdırdı.
//
// Bu endpoint YALNIZ `checkInviteCode` işlədir — DB yox, `invite_redemptions` yox.
// Redeem hələ də ilk həqiqi toxunuşdadır (`/api/solve` və ya `/api/solve/transcribe`).

type Body = { invite_code?: unknown };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json gözlənilir" }, { status: 400 });
  }

  if (!checkInviteCode(body.invite_code).ok) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 403 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
