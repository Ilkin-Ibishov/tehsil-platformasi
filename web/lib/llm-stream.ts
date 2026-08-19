// Qat 5 OpenAI-compat SSE streaming — separate from `llm.ts` so cache/telemetry
// edits there do not wipe this path (COST-LATENCY-SAFE-SEQUENCE addım 5).
//
// When an explicit Gemini cache is available, prefer native `streamGenerateContent`
// so `usageMetadata.cachedContentTokenCount` is reported (OpenAI-compat often omits it).

import { resolveConnection } from "./models";
import {
  callVisionLLM,
  ensureGeminiSystemCache,
  geminiNativeBaseUrl,
  normalizeUsage,
  usageFromGeminiNativeMetadata,
  cachedTokensFromUsage,
  type LLMResult,
  type LLMUsage,
} from "./llm";

function logStreamCache(event: string, detail: Record<string, unknown>) {
  console.warn(`[llm-stream] context_cache ${event}`, detail);
}

/**
 * Accumulates `delta.content`, calls `onDelta` with the full text so far after
 * each chunk, returns the same shape as `callVisionLLM`. Falls back to
 * non-stream `callVisionLLM` if the provider rejects `stream: true` or returns
 * a non-SSE body.
 */
export async function streamVisionLLM(opts: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  signal?: AbortSignal;
  useContextCache?: boolean;
  onDelta?: (accumulated: string) => void;
}): Promise<LLMResult> {
  const model = opts.model || process.env.GEMINI_MODEL;
  if (!model) {
    throw new Error("GEMINI_MODEL env dəyişəni (və ya opts.model) lazımdır.");
  }
  const connection = resolveConnection(model) ?? {
    baseUrl: process.env.GEMINI_BASE_URL,
    apiKey: process.env.GEMINI_API_KEY,
  };
  const { baseUrl, apiKey } = connection;
  if (!apiKey || !baseUrl) {
    throw new Error(
      `Model '${model}' üçün bağlantı env-ləri tapılmadı (GEMINI_API_KEY/GEMINI_BASE_URL və ya registrinin öz env-ləri).`
    );
  }

  let cachedContentName: string | null = null;
  if (opts.useContextCache) {
    cachedContentName = await ensureGeminiSystemCache({
      model,
      systemPrompt: opts.systemPrompt,
      apiKey,
      baseUrl,
      signal: opts.signal,
    });
  }

  if (cachedContentName) {
    const native = await streamNativeWithCache({
      model,
      apiKey,
      baseUrl,
      cachedContentName,
      userPrompt: opts.userPrompt,
      signal: opts.signal,
      onDelta: opts.onDelta,
    });
    if (native) return native;
    // Fall through to OpenAI-compat stream + extra_body, then inline.
  }

  const messages: Array<{ role: string; content: unknown }> = [];
  if (!cachedContentName) {
    messages.push({ role: "system", content: opts.systemPrompt });
  }
  messages.push({ role: "user", content: opts.userPrompt });

  const payload: Record<string, unknown> = {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    stream: true,
    // Without this, Gemini/OpenAI-compat SSE chunks omit `usage` → Qat 5 cost/tokens stay null.
    stream_options: { include_usage: true },
    messages,
  };
  if (cachedContentName) {
    payload.extra_body = { google: { cached_content: cachedContentName } };
  }

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const started = performance.now();
  let usedCache = Boolean(cachedContentName);

  async function postStream(body: Record<string, unknown>): Promise<Response> {
    return fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  }

  let res = await postStream(payload);
  if (usedCache && res.status >= 400 && res.status < 500 && res.status !== 429) {
    logStreamCache("skip", {
      reason: "openai_extra_body_rejected",
      model,
      status: res.status,
    });
    usedCache = false;
    cachedContentName = null;
    delete payload.extra_body;
    payload.messages = [
      { role: "system", content: opts.systemPrompt },
      { role: "user", content: opts.userPrompt },
    ];
    res = await postStream(payload);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("text/event-stream")) {
    if (!res.ok) {
      return callVisionLLM({
        systemPrompt: opts.systemPrompt,
        userPrompt: opts.userPrompt,
        model,
        signal: opts.signal,
        useContextCache: opts.useContextCache,
      });
    }
    const body = await res.json();
    const rawText: string = body.choices?.[0]?.message?.content ?? "";
    const usage = normalizeUsage(body.usage);
    opts.onDelta?.(rawText);
    let parsed: unknown | null = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
    return {
      parsed,
      rawText,
      usage,
      latencyMs: performance.now() - started,
      attempts: 1,
      model,
      fallbackUsed: false,
      fallbackFrom: null,
    };
  }

  const reader = res.body?.getReader();
  if (!reader) {
    return callVisionLLM({
      systemPrompt: opts.systemPrompt,
      userPrompt: opts.userPrompt,
      model,
      signal: opts.signal,
      useContextCache: opts.useContextCache,
    });
  }

  const decoder = new TextDecoder();
  let lineBuf = "";
  let rawText = "";
  let usage: LLMUsage | null = null;

  const ingestSseLine = (rawLine: string) => {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    let chunk: {
      choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
      usage?: unknown;
    };
    try {
      chunk = JSON.parse(data) as typeof chunk;
    } catch {
      return;
    }
    const delta = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.message?.content ?? "";
    if (delta) {
      rawText += delta;
      opts.onDelta?.(rawText);
    }
    // Final include_usage chunk often has empty choices; do not require delta.
    if (chunk.usage) {
      const next = normalizeUsage(chunk.usage);
      if (next) usage = next;
    }
  };

  const flushLineBuf = (flushTail: boolean) => {
    const lines = lineBuf.split("\n");
    lineBuf = flushTail ? "" : (lines.pop() ?? "");
    for (const rawLine of lines) ingestSseLine(rawLine);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuf += decoder.decode(value, { stream: true });
    flushLineBuf(false);
  }
  lineBuf += decoder.decode();
  flushLineBuf(true);

  if (usedCache && cachedTokensFromUsage(usage) == null) {
    logStreamCache("warn", {
      reason: "usage_missing_cached_tokens",
      path: "openai_sse",
      model,
      usage,
    });
  }

  const latencyMs = performance.now() - started;
  let parsed: unknown | null = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }
  return { parsed, rawText, usage, latencyMs, attempts: 1, model, fallbackUsed: false, fallbackFrom: null };
}

async function streamNativeWithCache(opts: {
  model: string;
  apiKey: string;
  baseUrl: string;
  cachedContentName: string;
  userPrompt: string;
  signal?: AbortSignal;
  onDelta?: (accumulated: string) => void;
}): Promise<LLMResult | null> {
  const nativeBase = geminiNativeBaseUrl(opts.baseUrl);
  if (!/^https?:\/\//i.test(nativeBase)) return null;
  const url = `${nativeBase}/models/${opts.model}:streamGenerateContent?alt=sse`;
  const started = performance.now();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": opts.apiKey,
      },
      body: JSON.stringify({
        cachedContent: opts.cachedContentName,
        contents: [{ role: "user", parts: [{ text: opts.userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      signal: opts.signal,
    });
  } catch (err) {
    logStreamCache("skip", {
      reason: "native_generate_failed",
      model: opts.model,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    logStreamCache("skip", {
      reason: "native_generate_failed",
      model: opts.model,
      status: res.status,
      err: errBody.slice(0, 240),
    });
    return null;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    logStreamCache("skip", {
      reason: "native_generate_failed",
      model: opts.model,
      detail: "empty_body",
    });
    return null;
  }

  const decoder = new TextDecoder();
  let lineBuf = "";
  let rawText = "";
  let usage: LLMUsage | null = null;

  const ingest = (rawLine: string) => {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    let chunk: {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: unknown;
    };
    try {
      chunk = JSON.parse(data) as typeof chunk;
    } catch {
      return;
    }
    const piece =
      chunk.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (piece) {
      rawText += piece;
      opts.onDelta?.(rawText);
    }
    if (chunk.usageMetadata) {
      const next = usageFromGeminiNativeMetadata(chunk.usageMetadata);
      if (next) usage = next;
    }
  };

  const flush = (flushTail: boolean) => {
    const lines = lineBuf.split("\n");
    lineBuf = flushTail ? "" : (lines.pop() ?? "");
    for (const rawLine of lines) ingest(rawLine);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuf += decoder.decode(value, { stream: true });
    flush(false);
  }
  lineBuf += decoder.decode();
  flush(true);

  if (cachedTokensFromUsage(usage) == null) {
    logStreamCache("warn", {
      reason: "usage_missing_cached_tokens",
      path: "native_streamGenerateContent",
      model: opts.model,
      cache: opts.cachedContentName,
      usage,
    });
  }

  let parsed: unknown | null = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }
  return {
    parsed,
    rawText,
    usage,
    latencyMs: performance.now() - started,
    attempts: 1,
    model: opts.model,
    fallbackUsed: false,
    fallbackFrom: null,
  };
}
