import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { transcribe, imageSha256 } from "@/lib/cascade/transcribe";
import { writeOcrCapture } from "@/lib/cascade/ocr-capture";
import { checkInviteCode, checkCostCeiling, checkDailyLimit, logInviteRedemption } from "@/lib/cascade/guards";

// POST /api/solve/transcribe — ClickUp 86eykj7x2 / ADR-020.
//
// Kaskadın Qat 1-ini TƏK BAŞINA ifşa edir. Səbəb: transkripsiya təsdiq ekranı «Bu məsələni
// oxudum: … Düzdür?» göstərmək üçün TAM həllin (Qat 2-5, bank/LLM) qurtarmasını GÖZLƏYƏ
// BİLMƏZ — həmin ekranın bütün dəyəri "16.8 saniyəlik boş gözləməni MƏNALI məzmunla
// doldurmaq"dır (ADR-014). Bu, ADR-020-nin əvvəlki "iki ardıcıl POST YOX" qərarının
// YENİLƏNMƏSİDİR: o qərar streaming/tək-çağırış güman edirdi, real UI tələbi isə
// klientin Qat 1 bitən kimi (ARTIQ dərhal) məzmun göstərməsini, Qat 2-5-i isə FONDA davam
// etdirməsini tələb edir — bu, YALNIZ iki ayrı sorğu ilə mümkündür (Next.js route
// handler-ləri hazırkı stekdə streaming JSON klienti daşımır).
//
// `ocr_captures.ocr_raw` BURADA yazılır (ClickUp 86eymfg85-in "təsdiqdən ƏVVƏL" tələbi) —
// `web/lib/cascade/ocr-capture.ts`.
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "form-data gözlənilir" }, { status: 400 });
  }

  const image = form.get("image");
  const deviceId = form.get("device_id");
  const inviteCode = form.get("invite_code");
  const grade = Number(form.get("grade") ?? 11);
  const locale = String(form.get("locale") ?? "az");
  const subject = String(form.get("subject") ?? "math");
  const selectedLabel = form.get("selected_label");

  if (!(image instanceof Blob) || image.size === 0) {
    return NextResponse.json({ error: "image sahəsi yoxdur" }, { status: 400 });
  }
  if (typeof deviceId !== "string" || !deviceId) {
    return NextResponse.json({ error: "device_id sahəsi yoxdur" }, { status: 400 });
  }

  const invite = checkInviteCode(inviteCode);
  if (!invite.ok) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 403 });
  }
  await logInviteRedemption(pool, invite.studentRef, deviceId);

  const { blocked: limitBlocked, dailyCount } = await checkDailyLimit(pool, deviceId);
  if (limitBlocked) {
    return NextResponse.json({ error: "limit_reached", daily_count: dailyCount }, { status: 429 });
  }
  const { blocked: costBlocked } = await checkCostCeiling(pool);
  if (costBlocked) {
    return NextResponse.json({ error: "limit_reached", daily_count: dailyCount }, { status: 429 });
  }

  const imageBytes = Buffer.from(await image.arrayBuffer());
  const imageHash = imageSha256(imageBytes);
  const label = typeof selectedLabel === "string" && selectedLabel ? selectedLabel : "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);
  let outcome;
  try {
    outcome = await transcribe({
      pool,
      imageBytes,
      imageMime: image.type || "image/jpeg",
      imageHash,
      selectedLabel: label,
      grade,
      subject,
      locale,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (outcome.kind === "error") {
    return NextResponse.json(
      { schema_version: 1, status: "unreadable", reason: "Server cavab vermədi, yenidən cəhd et." },
      { status: 200 }
    );
  }

  if (outcome.kind === "refusal") {
    // İmtina — DB-yə HEÇ NƏ yazılmır (PHASE-1), gündəlik limit sayğacı ARTMIR (ADR-007).
    // `ocr_captures`-a da yazılmır (bax ocr-capture.ts başlığı — bu sessiyanın qərarı:
    // uğurlu transkripsiyalar üçün korpus, imtinalar əhatə xaricində).
    return NextResponse.json(
      {
        schema_version: 1,
        status: outcome.refusal.status,
        reason: outcome.refusal.reason,
        ...(outcome.refusal.candidates ? { candidates: outcome.refusal.candidates } : {}),
        attempt_id: null,
        match_path: outcome.cacheHit ? "image_cache" : "llm",
      },
      { status: 200 }
    );
  }

  // Uğurlu transkripsiya — `ocr_raw` BURADA, təsdiq ekranı göstərilməzdən ƏVVƏL yazılır.
  // Keş-hitdə DƏ yazılır (eyni şəkil təkrar gəlsə belə, hər çəkiliş öz korpus sətrini alır —
  // `v_ocr_corpus`-un "neçə çəkiliş" statistikası kamera istifadəsini əks etdirməlidir,
  // yalnız unikal şəkilləri yox).
  const captureId = await writeOcrCapture(pool, {
    ocrRaw: outcome.transcript.canonical,
    imageSha256: imageHash,
    model: process.env.TRANSCRIBE_MODEL || process.env.GEMINI_MODEL || null,
    latencyMs: Math.round(outcome.latencyMs),
    costUsd: outcome.costUsd,
  });

  return NextResponse.json(
    {
      schema_version: 1,
      status: "ok",
      capture_id: captureId,
      canonical: outcome.transcript.canonical,
      subject: outcome.transcript.subject,
      grade: outcome.transcript.grade,
      topic_code: outcome.transcript.topicCode,
      problem_type: outcome.transcript.problemType,
      ocr_confidence: outcome.transcript.ocrConfidence,
      detected_language: outcome.transcript.detectedLanguage,
      has_figure: outcome.transcript.hasFigure,
      match_path: outcome.cacheHit ? "image_cache" : "llm",
      meta: { latency_ms: Math.round(outcome.latencyMs), cost_usd: outcome.costUsd },
    },
    { status: 200 }
  );
}
