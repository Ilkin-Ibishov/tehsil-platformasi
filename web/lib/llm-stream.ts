// Qat 5 OpenAI-compat SSE streaming — separate from `llm.ts` so cache/telemetry
// edits there do not wipe this path (COST-LATENCY-SAFE-SEQUENCE addım 5).

import { resolveConnection } from "./models";
import {
  callVisionLLM,
  ensureGeminiSystemCache,
  normalizeUsage,
  type LLMResult,
  type LLMUsage,
} from "./llm";

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
    console.warn(`[llm-stream] cached_content rejected (${res.status}); falling back to inline system`);
    usedCache = false;
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    lineBuf += decoder.decode(value, { stream: true });
    const lines = lineBuf.split("\n");
    lineBuf = lines.pop() ?? "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let chunk: {
        choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
        usage?: unknown;
      };
      try {
        chunk = JSON.parse(data) as typeof chunk;
      } catch {
        continue;
      }
      const delta = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.message?.content ?? "";
      if (delta) {
        rawText += delta;
        opts.onDelta?.(rawText);
      }
      if (chunk.usage) usage = normalizeUsage(chunk.usage);
    }
  }

  const latencyMs = performance.now() - started;
  let parsed: unknown | null = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }
  return { parsed, rawText, usage, latencyMs, attempts: 1, model };
}
