import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin/auth";
import { getAdminAnalyticsData } from "@/lib/admin/analytics";
import type { TimeRange, EnvironmentKind } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isAuthorized = await verifyAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "İcazəsiz giriş (Unauthorized)" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") || "7d") as TimeRange;
  const kind = (searchParams.get("kind") || "all") as EnvironmentKind;

  try {
    const data = await getAdminAnalyticsData({ range, kind });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[api/admin/analytics/overview] Xəta:", err);
    return NextResponse.json({ ok: false, error: "Analitika məlumatları oxuna bilmədi" }, { status: 500 });
  }
}
