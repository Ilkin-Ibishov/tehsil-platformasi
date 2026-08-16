import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { pool } from "@/lib/db";
import { buildLayers, runCascade } from "@/lib/cascade/run";
import { persistSolution } from "@/lib/cascade/persist";
import { finalizeOcrCapture, rejectOcrCapture } from "@/lib/cascade/ocr-capture";
import { checkInviteCode, logEvent } from "@/lib/cascade/guards";
import { sumCostUsd, billableOutputTokens } from "@/lib/cost";
import type { PublicStep, Transcript } from "@/lib/cascade/types";
import { soakGate } from "@/lib/soak/gate";
import { attemptKindFor, llmAbortMs, usesSoakAdapter, type SoakMode } from "@/lib/soak/mode";
import { SoakTransportError } from "@/lib/soak/adapter";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

// POST /api/solve/finish — ClickUp 86eykj7x2 / ADR-020 + COST-LATENCY addım 5 NDJSON.
type Body = {
  device_id?: unknown;
  invite_code?: unknown;
  locale?: unknown;
  attempt_id?: unknown;
  capture_id?: unknown;
  rejected?: unknown;
  transcribe_meta?: {
    cache_hit?: unknown;
    cost_usd?: unknown;
    latency_ms?: unknown;
    storage_ms?: unknown;
    db_ms?: unknown;
    route_total_ms?: unknown;
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
type FinishPayload = Record<string, unknown>;

function wantsNdjson(req: NextRequest): boolean {
  return (req.headers.get("accept") ?? "").includes("application/x-ndjson");
}

// Safari/WebKit holds streamed bodies until ~1024 bytes arrive (Next.js streaming guide).
// Tiny first `step` lines alone never clear that gate on phone, so preview looks like a
// full ~20s wait. Pad once at open so later NDJSON lines can flush progressively.
// Documented: docs/COST-LATENCY-SAFE-SEQUENCE.md § addım 5.
const NDJSON_FLUSH_PAD_BYTES = 2048;

function ndjsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-store, no-transform",
    // Nginx / some reverse proxies; Vercel forwards it. Chunked transfer is implicit
    // for a streaming Response body (do not set Transfer-Encoding manually).
    "X-Accel-Buffering": "no",
  };
}

function ndjsonFlushPadChunk(encoder: TextEncoder): Uint8Array {
  // Valid NDJSON line the client ignores (`type: "pad"`). Spaces fill byte budget.
  const prefix = '{"type":"pad","_":"';
  const suffix = '"}\n';
  const fill = Math.max(0, NDJSON_FLUSH_PAD_BYTES - prefix.length - suffix.length);
  return encoder.encode(`${prefix}${" ".repeat(fill)}${suffix}`);
}

function layerCachedTokensOf(solution: {
  usage?: {
    prompt_tokens_details?: { cached_tokens?: number | null };
    cached_content_token_count?: number | null;
  } | null;
}): number | null {
  return (
    solution.usage?.prompt_tokens_details?.cached_tokens ??
    solution.usage?.cached_content_token_count ??
    null
  );
}

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

  if (body.rejected === true) {
    await rejectOcrCapture(pool, captureId);
    return NextResponse.json({ schema_version: 1, status: "rejected" }, { status: 200 });
  }

  const soak = await soakGate(pool, invite.studentRef);
  if (!soak.ok) {
    return NextResponse.json({ error: soak.error }, { status: soak.status });
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
  const transcribeStorageMs = typeof body.transcribe_meta?.storage_ms === "number" ? body.transcribe_meta.storage_ms : null;
  const transcribeDbMs = typeof body.transcribe_meta?.db_ms === "number" ? body.transcribe_meta.db_ms : null;
  const transcribeRouteTotalMs =
    typeof body.transcribe_meta?.route_total_ms === "number" ? body.transcribe_meta.route_total_ms : null;

  const coreArgs = {
    deviceId,
    studentRef: invite.studentRef,
    soakMode: soak.mode,
    transcript,
    locale,
    sessionId,
    captureId,
    transcribeCacheHit,
    transcribeCostUsd,
    transcribeLatencyMs,
    transcribeStorageMs,
    transcribeDbMs,
    transcribeRouteTotalMs,
  };

  if (!wantsNdjson(req)) {
    try {
      return NextResponse.json(await runFinishCore(coreArgs), { status: 200 });
    } catch (err) {
      if (err instanceof SoakTransportError) {
        const error = err.reason === "auth" ? "soak_auth_expired" : "soak_unavailable";
        return NextResponse.json({ error }, { status: 503 });
      }
      throw err;
    }
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writeLine = (obj: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };
      try {
        // First bytes leave immediately — before Qat 5 work — so proxies/WebKit start
        // delivering; step lines that follow are no longer stuck behind a 1KB buffer.
        writeLine({ type: "open" });
        controller.enqueue(ndjsonFlushPadChunk(encoder));

        const payload = await runFinishCore({
          ...coreArgs,
          onPublicStep: (step) => {
            try {
              writeLine({ type: "step", step });
            } catch (err) {
              console.error("[finish] step enqueue failed:", err);
            }
          },
        });
        writeLine({ type: "final", ...payload });
      } catch (err) {
        if (err instanceof SoakTransportError) {
          const error = err.reason === "auth" ? "soak_auth_expired" : "soak_unavailable";
          writeLine({ type: "final", schema_version: 1, status: "unreadable", error, reason: "Soak əlçatan deyil." });
        } else {
          console.error("[finish] stream error:", err);
          writeLine({
            type: "final",
            schema_version: 1,
            status: "unreadable",
            reason: "Server xətası, yenidən cəhd et.",
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* closed */
        }
      }
    },
  });

  return new Response(readable, { status: 200, headers: ndjsonHeaders() });
}

async function runFinishCore(opts: {
  deviceId: string;
  studentRef: string;
  soakMode: SoakMode;
  transcript: Transcript;
  locale: string;
  sessionId: string;
  captureId: string | null;
  transcribeCacheHit: boolean;
  transcribeCostUsd: number | null;
  transcribeLatencyMs: number;
  transcribeStorageMs: number | null;
  transcribeDbMs: number | null;
  transcribeRouteTotalMs: number | null;
  onPublicStep?: (step: PublicStep) => void;
}): Promise<FinishPayload> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), llmAbortMs(opts.soakMode));
  let solution;
  let declinedLayers: string[];
  try {
    ({ solution, declinedLayers } = await runCascade(buildLayers(pool), {
      transcript: opts.transcript,
      locale: opts.locale,
      requestedGrade: opts.transcript.grade,
      requestedSubject: opts.transcript.subject,
      signal: controller.signal,
      useSoakAdapter: usesSoakAdapter(opts.soakMode),
      onPublicStep: opts.onPublicStep,
    }));
  } finally {
    clearTimeout(timeoutId);
  }

  const {
    deviceId,
    sessionId,
    transcript,
    transcribeCacheHit,
    transcribeCostUsd,
    transcribeLatencyMs,
    transcribeStorageMs,
    transcribeDbMs,
    transcribeRouteTotalMs,
    soakMode,
  } = opts;

  if (!solution) {
    await logEvent(pool, deviceId, sessionId, "solve.cascade", {
      layer: "none",
      declined: declinedLayers.join(","),
      transcribe_cache_hit: transcribeCacheHit,
      transcribe_cost_usd: transcribeCostUsd,
      transcribe_latency_ms: Math.round(transcribeLatencyMs),
      transcribe_storage_ms: transcribeStorageMs,
      transcribe_db_ms: transcribeDbMs,
      transcribe_route_total_ms: transcribeRouteTotalMs,
      persist_ok: false,
    });
    return {
      schema_version: 1,
      status: "unreadable",
      reason: "Həll qurula bilmədi, yenidən cəhd et.",
      declined: declinedLayers,
      meta: {
        cost_usd: transcribeCostUsd,
        latency_ms: Math.round(transcribeLatencyMs),
        layer_cost_usd: null,
      },
    };
  }

  const totalCostUsd = sumCostUsd(transcribeCostUsd, solution.costUsd);
  const persisted = await persistSolution({
    pool,
    solution,
    transcript,
    sessionId,
    deviceId,
    studentRef: opts.studentRef,
    requestedSubject: transcript.subject,
    locale: opts.locale,
    totalCostUsd,
    attemptKind: attemptKindFor(soakMode),
  });

  if (!persisted.ok) {
    await logEvent(pool, deviceId, sessionId, "solve.cascade", {
      layer: solution.layer,
      match_path: solution.matchPath,
      declined: declinedLayers.join(","),
      transcribe_cache_hit: transcribeCacheHit,
      transcribe_cost_usd: transcribeCostUsd,
      transcribe_latency_ms: Math.round(transcribeLatencyMs),
      transcribe_storage_ms: transcribeStorageMs,
      transcribe_db_ms: transcribeDbMs,
      transcribe_route_total_ms: transcribeRouteTotalMs,
      layer_cost_usd: solution.costUsd,
      layer_latency_ms: Math.round(solution.latencyMs),
      total_cost_usd: totalCostUsd,
      has_figure: transcript.hasFigure,
      ocr_confidence: transcript.ocrConfidence,
      attempt_kind: attemptKindFor(soakMode),
      soak_provider: soakMode.kind === "student" ? null : soakMode.kind,
      persist_ok: false,
      persist_kind: persisted.kind,
    });
    return {
      schema_version: 1,
      status: "unreadable",
      reason: persisted.kind === "rejected" ? "Həll yoxlanışdan keçmədi." : "Server xətası, yenidən cəhd et.",
      meta: {
        cost_usd: totalCostUsd,
        latency_ms: Math.round(transcribeLatencyMs + solution.latencyMs),
        layer_cost_usd: solution.costUsd,
        layer_latency_ms: Math.round(solution.latencyMs),
        layer: solution.layer,
      },
    };
  }

  await finalizeOcrCapture(pool, {
    captureId: opts.captureId,
    ocrFinal: transcript.canonical,
    attemptItemId: persisted.itemId,
  });

  const layerCachedTokens = layerCachedTokensOf(solution);

  await logEvent(pool, deviceId, sessionId, "solve.cascade", {
    layer: solution.layer,
    match_path: solution.matchPath,
    declined: declinedLayers.join(","),
    transcribe_cache_hit: transcribeCacheHit,
    transcribe_cost_usd: transcribeCostUsd,
    transcribe_latency_ms: Math.round(transcribeLatencyMs),
    transcribe_storage_ms: transcribeStorageMs,
    transcribe_db_ms: transcribeDbMs,
    transcribe_route_total_ms: transcribeRouteTotalMs,
    layer_cost_usd: solution.costUsd,
    layer_latency_ms: Math.round(solution.latencyMs),
    total_cost_usd: totalCostUsd,
    has_figure: transcript.hasFigure,
    ocr_confidence: transcript.ocrConfidence,
    attempt_kind: attemptKindFor(soakMode),
    soak_provider: soakMode.kind === "student" ? null : soakMode.kind,
    persist_ok: true,
    cached_tokens: layerCachedTokens,
  });

  return {
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
      tokens_out: billableOutputTokens(solution.usage),
      cached_tokens: layerCachedTokens,
      layer_cost_usd: solution.costUsd,
      layer_latency_ms: Math.round(solution.latencyMs),
      leaked: persisted.leaked,
      layer: solution.layer,
    },
  };
}
