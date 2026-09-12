import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin/auth";
import { pool } from "@/lib/db";
import { createSignedCaptureUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isAuthorized = await verifyAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "İcazəsiz giriş (Unauthorized)" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get("report_id");
  const attemptId = searchParams.get("attempt_id");

  try {
    // 1. Forensik Tədqiqat Detalları (Şəkil + Transkripsiya + Həll)
    if (reportId || attemptId) {
      let capturePath: string | null = null;
      let ocrFinal: string | null = null;
      let stem: string | null = null;
      let stepsJson: unknown = null;
      let reportDesc = "";
      let createdAt = "";

      if (reportId) {
        const repRes = await pool.query<{
          description: string;
          created_at: string;
          attempt_id: string | null;
        }>(`select description, created_at, attempt_id from public.bug_reports where id = $1`, [reportId]);
        if (repRes.rows[0]) {
          reportDesc = repRes.rows[0].description;
          createdAt = repRes.rows[0].created_at;
        }
      }

      const effectiveAttemptId = attemptId || (reportId ? (await pool.query<{ attempt_id: string }>(`select attempt_id from public.bug_reports where id = $1`, [reportId])).rows[0]?.attempt_id : null);

      if (effectiveAttemptId) {
        // ocr_captures məlumatı
        const ocrRes = await pool.query<{ storage_path: string; ocr_final: string }>(
          `select storage_path, ocr_final from public.ocr_captures where attempt_item_id = $1 or id = $1 limit 1`,
          [effectiveAttemptId]
        );
        if (ocrRes.rows[0]) {
          capturePath = ocrRes.rows[0].storage_path;
          ocrFinal = ocrRes.rows[0].ocr_final;
        }

        // attempt_items və həll addımları
        const itemRes = await pool.query<{
          stem: unknown;
          payload: unknown;
        }>(`
          select qt.stem, s.payload
          from public.attempt_items ai
          left join public.questions q on q.id = ai.question_id
          left join public.question_translations qt on qt.question_id = q.id and qt.lang = 'az'
          left join public.solutions s on s.id = ai.solution_id
          where ai.id = $1 or ai.attempt_id = $1
          limit 1
        `, [effectiveAttemptId]);

        if (itemRes.rows[0]) {
          const rawStem = itemRes.rows[0].stem;
          stem = typeof rawStem === "object" && rawStem !== null ? JSON.stringify(rawStem) : String(rawStem || "");
          stepsJson = itemRes.rows[0].payload;
        }
      }

      // Təhlükəsiz Signed URL generasiyası (15 dəqiqəlik)
      let signedImageUrl: string | null = null;
      if (capturePath) {
        signedImageUrl = await createSignedCaptureUrl(capturePath, 900);
      }

      return NextResponse.json({
        ok: true,
        data: {
          reportId,
          attemptId: effectiveAttemptId,
          description: reportDesc,
          createdAt,
          signedImageUrl,
          ocrFinal,
          stem,
          steps: stepsJson,
        },
      });
    }

    // 2. Ümumi Şikayətlər Siyahısı
    const reportsRes = await pool.query<{
      id: string;
      device_id: string | null;
      attempt_id: string | null;
      route: string | null;
      description: string;
      created_at: string;
    }>(`
      select id, device_id, attempt_id, route, description, created_at
      from public.bug_reports
      order by created_at desc
      limit 50
    `);

    const reports = reportsRes.rows.map((r) => ({
      id: r.id,
      deviceId: r.device_id ? `${r.device_id.slice(0, 8)}...` : null,
      attemptId: r.attempt_id,
      route: r.route || "/kamera",
      description: r.description,
      createdAt: r.created_at,
      hasCapture: !!r.attempt_id,
    }));

    return NextResponse.json({ ok: true, data: { reports } });
  } catch (err) {
    console.error("[api/admin/reports] Xəta:", err);
    return NextResponse.json({ ok: false, error: "Şikayətlər oxuna bilmədi" }, { status: 500 });
  }
}
