import { NextRequest, NextResponse } from "next/server";
import { checkInviteCode, checkInviteAvailableForDevice } from "@/lib/cascade/guards";
import { pool } from "@/lib/db";

// POST /api/invite/check
//
// 1) Dəvət kodunun etibarlılığını yoxlayır (`checkInviteCode`).
// 2) Tək-istifadəçi (Single-Person) qaydası: kodun başqa cihaz tərəfindən istifadə edilib-edilmədiyini yoxlayır.
//    Əgər başqa cihaz artıq bu kodu götürübsə 409 status kodu ilə "invite_already_used" qaytarır.

type Body = { invite_code?: unknown; device_id?: unknown };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json gözlənilir" }, { status: 400 });
  }

  const codeCheck = checkInviteCode(body.invite_code);
  if (!codeCheck.ok) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 403 });
  }

  const deviceId = typeof body.device_id === "string" ? body.device_id : undefined;
  const avail = await checkInviteAvailableForDevice(pool, codeCheck.studentRef, deviceId);
  if (!avail.available) {
    return NextResponse.json({ error: "invite_already_used" }, { status: 409 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
