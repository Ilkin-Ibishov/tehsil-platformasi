import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";
import { buildLayers, runCascade } from "@/lib/cascade/run";
import { persistSolution } from "@/lib/cascade/persist";
import { finalizeOcrCapture, rejectOcrCapture } from "@/lib/cascade/ocr-capture";
import { checkInviteCode, logEvent } from "@/lib/cascade/guards";
import { sumCostUsd } from "@/lib/cost";
import type { Transcript } from "@/lib/cascade/types";

// POST /api/solve/finish — ClickUp 86eykj7x2 / ADR-020.
//
// `/api/solve/transcribe`-in cütüdür. Şəkil GÖRMÜR — yalnız Qat 1-in (ARTIQ təsdiqlənmiş və
// ya edilməmiş) transkripsiyasını qəbul edir və Qat 2-5-i işlədir. Klient bunu iki halda çağırır:
//   1. Təsdiq ekranı görünən KİMİ, fonda (şagird HƏLƏ oxumaqdadır) — nikbin öncədən başlatma.
//   2. Şagird mətni DÜZƏLDİB təsdiqləyəndə — YENİ sorğu, düzəldilmiş `canonical` ilə.
// Bu ikisinin İKİSİ DƏ eyni endpoint-dir; fərq YALNIZ klientin göndərdiyi `canonical`-dadır.
// "Fon prosesi dayandırılsın" tələbi (ClickUp 86eykj7x2) klient tərəfində `AbortController`
// ilə həll olunur (`kamera/page.tsx`) — server bunu bilmir, sadəcə AbortSignal-a hörmət edir.
type Body = {
  device_id?: unknown;
  invite_code?: unknown;
  locale?: unknown;
  attempt_id?: unknown;
  capture_id?: unknown;
  rejected?: unknown;
  // Klientin `/transcribe`-dən aldığı meta — `solve.cascade` hadisəsinin
  // `transcribe_*` sahələrini doldurmaq üçün (HANDOFF-84-də Cowork-a bildirilən sxem).
  // Server BURADA transkripsiyanın ÖZÜNÜ TƏKRAR hesablamır, yalnız artıq bilinən ədədləri
  // hadisəyə ötürür — güvən sərhədi `cost_usd`/`latency_ms` üçün aşağıdır (yalnız
  // TELEMETRİYA, DB yazısına təsir etmir).
  transcribe_meta?: {
    cache_hit?: unknown;
    cost_usd?: unknown;
    latency_ms?: unknown;
  };
  transcript?: {
    canonical?: unknown;
    subject?: unknown;
    grade?: unknown;
    topic_code?: unknown;
    problem_type?: unknown;
    ocr_confidence?: unknown;
    detected_language?: unknown;
    has_figure?: unknown;
  };
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json gözlənilir" }, { status: 400 });
  }

  const deviceId = body.device_id;
  if (typeof deviceId !== "string" || !deviceId) {
    return NextResponse.json({ error: "device_id sahəsi yoxdur" }, { status: 400 });
  }

  const invite = checkInviteCode(body.invite_code);
  if (!invite.ok) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 403 });
  }

  const captureId = typeof body.capture_id === "string" ? body.capture_id : null;

  // ── Rədd yolu: şagird "bu düz deyil, yenidən çəkirəm" deyib ────────────────────────────
  // Heç bir LLM çağırılmır, heç nə yazılmır — YALNIZ korpus qeydi (ClickUp 86eymfg85-in
  // `correction_kind='rejected'` halı). Gündəlik limit SAYILMIR (ADR-007: imtina limitdən
  // kənardır) — burada zatən `attempt_items` yazılmır, yəni limit sayğacı toxunulmur.
  if (body.rejected === true) {
    await rejectOcrCapture(pool, captureId);
    return NextResponse.json({ schema_version: 1, status: "rejected" }, { status: 200 });
  }

  const t = body.transcript;
  if (
    !t ||
    typeof t.canonical !== "string" ||
    typeof t.subject !== "string" ||
    typeof t.grade !== "number" ||
    typeof t.topic_code !== "string"
  ) {
    return NextResponse.json({ error: "transcript sahələri yoxdur" }, { status: 400 });
  }
  const transcript: Transcript = {
    canonical: t.canonical,
    subject: t.subject,
    grade: t.grade,
    topicCode: t.topic_code,
    problemType: typeof t.problem_type === "string" ? t.problem_type : null,
    ocrConfidence: typeof t.ocr_confidence === "string" ? t.ocr_confidence : null,
    detectedLanguage: typeof t.detected_language === "string" ? t.detected_language : null,
    hasFigure: t.has_figure === true,
  };

  const locale = typeof body.locale === "string" && body.locale ? body.locale : "az";
  const sessionId = typeof body.attempt_id === "string" && UUID_RE.test(body.attempt_id) ? body.attempt_id : randomUUID();

  const transcribeCacheHit = body.transcribe_meta?.cache_hit === true;
  const transcribeCostUsd = typeof body.transcribe_meta?.cost_usd === "number" ? body.transcribe_meta.cost_usd : null;
  const transcribeLatencyMs = typeof body.transcribe_meta?.latency_ms === "number" ? body.transcribe_meta.latency_ms : 0;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);
  let solution;
  let declinedLayers: string[];
  try {
    ({ solution, declinedLayers } = await runCascade(buildLayers(pool), {
      transcript,
      locale,
      requestedGrade: transcript.grade,
      requestedSubject: transcript.subject,
      signal: controller.signal,
    }));
  } finally {
    clearTimeout(timeoutId);
  }

  if (!solution) {
    await logEvent(pool, deviceId, sessionId, "solve.cascade", {
      layer: "none",
      declined: declinedLayers.join(","),
      transcribe_cache_hit: transcribeCacheHit,
      transcribe_cost_usd: transcribeCostUsd,
    });
    return NextResponse.json(
      { schema_version: 1, status: "unreadable", reason: "Həll qurula bilmədi, yenidən cəhd et.", declined: declinedLayers },
      { status: 200 }
    );
  }

  const totalCostUsd = sumCostUsd(transcribeCostUsd, solution.costUsd);
  const persisted = await persistSolution({
    pool,
    solution,
    transcript,
    sessionId,
    deviceId,
    studentRef: invite.studentRef,
    requestedSubject: transcript.subject,
    locale,
    totalCostUsd,
  });

  if (!persisted.ok) {
    return NextResponse.json(
      {
        schema_version: 1,
        status: "unreadable",
        reason: persisted.kind === "rejected" ? "Həll yoxlanışdan keçmədi." : "Server xətası, yenidən cəhd et.",
      },
      { status: 200 }
    );
  }

  // `ocr_captures.ocr_final`/`corrected`/`correction_kind`/`edit_distance` BURADA yazılır —
  // `ocr_raw` (Qat 1-in ilk oxunuşu) ARTIQ `/transcribe`-də yazılıb (ClickUp 86eymfg85-in
  // "təsdiqdən ƏVVƏL" tələbi). `transcript.canonical` bu nöqtədə klientin göndərdiyi SON
  // mətndir — düzəliş edilibsə düzəldilmiş, edilməyibsə eyni.
  await finalizeOcrCapture(pool, { captureId, ocrFinal: transcript.canonical, attemptItemId: persisted.itemId });

  await logEvent(pool, deviceId, sessionId, "solve.cascade", {
    layer: solution.layer,
    match_path: solution.matchPath,
    declined: declinedLayers.join(","),
    transcribe_cache_hit: transcribeCacheHit,
    transcribe_cost_usd: transcribeCostUsd,
    transcribe_latency_ms: Math.round(transcribeLatencyMs),
    layer_cost_usd: solution.costUsd,
    layer_latency_ms: Math.round(solution.latencyMs),
    total_cost_usd: totalCostUsd,
    has_figure: transcript.hasFigure,
    ocr_confidence: transcript.ocrConfidence,
  });

  return NextResponse.json(
    {
      schema_version: 1,
      status: "ok",
      canonical: transcript.canonical,
      steps: persisted.steps,
      attempt_id: persisted.sessionId,
      match_path: solution.matchPath,
      verification: { ...persisted.verification, verified_at: new Date().toISOString() },
      meta: {
        cost_usd: totalCostUsd,
        latency_ms: Math.round(transcribeLatencyMs + solution.latencyMs),
        tokens_in: solution.usage?.prompt_tokens ?? null,
        tokens_out: solution.usage?.completion_tokens ?? null,
        leaked: persisted.leaked,
        layer: solution.layer,
      },
    },
    { status: 200 }
  );
}
