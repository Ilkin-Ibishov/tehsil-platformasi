import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSecret } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { action?: string; secret?: string };
    const action = body.action || "login";

    if (action === "logout") {
      const response = NextResponse.json({ ok: true, message: "Admin sessiyasından çıxıldı" });
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    // action === "login"
    const secret = body.secret?.trim();
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Açar daxil edilməyib" }, { status: 400 });
    }

    const isValid = isValidAdminSecret(secret);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Yanlış admin açarı" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, message: "Admin autentifikasiyası uğurludur" });
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: secret,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 gün
    });

    return response;
  } catch (err) {
    console.error("[api/admin/auth] Xəta:", err);
    return NextResponse.json({ ok: false, error: "Autentifikasiya icra edilə bilmədi" }, { status: 500 });
  }
}
