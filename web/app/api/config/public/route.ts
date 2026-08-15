import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getBoolConfig } from "@/lib/app-config";

// GET /api/config/public — 2026-08-15, Ilkin-in tapşırığı ("hər şey Vercel env olmasın").
//
// `NEXT_PUBLIC_*` env-lər Next.js-də BUILD VAXTI klient bundle-ına yapışdırılır — DB-dən
// redeploy-suz dəyişən bir dəyəri klientə çatdırmağın YEGANƏ yolu, klientin özünün onu
// RUNTIME-da soruşmasıdır. Bu endpoint məhz bunun üçündür: `web/app/kamera/page.tsx`
// mount olanda bunu çağırır, `NEXT_PUBLIC_CASCADE_ENABLED`-in əvəzinə keçir (bax
// `web/lib/app-config.ts`).
//
// Yalnız QEYRI-HƏSSAS UI feature flag-ləri qaytarılır — dəvət kodu/RLS TƏLƏB OLUNMUR
// (`active_model` kimi qiymət/xərc məlumatı BURADA YOXDUR).
export async function GET() {
  const cascadeUiEnabled = await getBoolConfig(pool, "cascade_ui_enabled", "NEXT_PUBLIC_CASCADE_ENABLED");
  return NextResponse.json({ cascade_ui_enabled: cascadeUiEnabled }, { status: 200 });
}
