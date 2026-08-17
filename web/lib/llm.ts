// Provider-agnostik vision LLM ça??r??? ? OpenAI-uy?un /chat/completions (CLAUDE.md: Gemini
// gemini-3.6-flash, OpenAI-uy?un endpoint). scripts/lib/llm_client.py::call_vision_llm-in
// istehsalat-üçün-laz?m-olan hiss?sinin TS portu (image ön emal? YOX ? klient art?q k?sib
// ?1600px-? kiçildib gönd?rir, ADR-001/S2).
//
// API_KEY YALNIZ SERVERD? (CLAUDE.md) ? bu modul "use client" DEY?L, App Router route
// handler-l?rind?n (server-only) ça??r?l?r.
//
// ADR-022: hans? model ?ST?FAD? OLUNDU?U n?tic?d? (`LLMResult.model`) qaytar?l?r ? ça??ran
// bunu `computeCostUsd`-a ötürm?lidir. Bu, `opts.model`in `undefined` qal?b `GEMINI_MODEL`-?
// dü?düyü hallar? da ?hat? edir; ça??ran özü hans? modelin i?l?diyini T?XM?N ETM?M?L?D?R.

import { createHash } from "crypto";
import { resolveConnection } from "./models";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
/** Explicit Gemini context cache TTL (seconds). Default Google TTL is 1h. */
const CONTEXT_CACHE_TTL_SEC = 3600;
/** Refresh in-memory entry this many ms before Google TTL expiry. */
const CONTEXT_CACHE_REFRESH_MARGIN_MS = 5 * 60 * 1000;
/**
 * Pre-gate before `cachedContents.create`. Gemini 3.x needs ?4096 tokens;
 * char count is only a cheap filter (Latin/az ? 2.5?4 chars/token).
 */
const CONTEXT_CACHE_MIN_CHARS = 12_000;

function finiteNum(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

type ContextCacheEntry = {
  name: string;
  model: string;
  promptHash: string;
  expiresAtMs: number;
  /** From create `usageMetadata.totalTokenCount` when Google returns it. */
  cachedTokenCount: number | null;
};

/** Warm process memory: one entry per `model:promptHash` (topic prompts differ). */
const contextCacheEntries = new Map<string, ContextCacheEntry>();
/** In-flight creates keyed by `model:promptHash` ? never share across different prompts. */
const contextCacheInflight = new Map<string, Promise<string | null>>();

export type ContextCacheSkipReason =
  | "short_prompt"
  | "create_http_error"
  | "create_needs_contents"
  | "create_too_few_tokens"
  | "create_no_name"
  | "create_throw"
  | "native_generate_failed"
  | "openai_extra_body_rejected"
  | "usage_missing_cached_tokens";

function logContextCache(event: string, detail: Record<string, unknown>) {
  console.warn(`[llm] context_cache ${event}`, detail);
}

function promptHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 24);
}

/** OpenAI-compat base ends in `/openai`; cachedContents lives on the native v1beta root. */
export function geminiNativeBaseUrl(openaiOrNativeBase: string): string {
  return openaiOrNativeBase.replace(/\/$/, "").replace(/\/openai$/i, "");
}

function classifyCreateFailure(status: number, errBody: string): ContextCacheSkipReason {
  const lower = errBody.toLowerCase();
  if (/at least one content|must have.*content/i.test(errBody)) return "create_needs_contents";
  if (/minimum token|too (small|few|short)|token count/i.test(lower)) return "create_too_few_tokens";
  if (status >= 400) return "create_http_error";
  return "create_http_error";
}

/**
 * Create or reuse an explicit Gemini `cachedContents` resource for a stable Qat 5
 * system prompt. Returns the resource name (`cachedContents/...`) or null if the
 * prompt is too short / API fails ? caller must then send the system message inline.
 *
 * Cache key: `active_model` + prompt hash (COST-LATENCY-SAFE-SEQUENCE add?m 2).
 *
 * Developer/Vertex APIs have rejected systemInstruction-only creates
 * ("CachedContent must have at least one content"). Store the prompt as `contents[]`.
 */
export async function ensureGeminiSystemCache(opts: {
  model: string;
  systemPrompt: string;
  apiKey: string;
  baseUrl: string;
  signal?: AbortSignal;
}): Promise<string | null> {
  if (opts.systemPrompt.length < CONTEXT_CACHE_MIN_CHARS) {
    logContextCache("skip", {
      reason: "short_prompt",
      model: opts.model,
      chars: opts.systemPrompt.length,
      minChars: CONTEXT_CACHE_MIN_CHARS,
    });
    return null;
  }

  const hash = promptHash(opts.systemPrompt);
  const inflightKey = `${opts.model}:${hash}`;
  const now = Date.now();
  const warm = contextCacheEntries.get(inflightKey);
  if (warm && warm.expiresAtMs > now + CONTEXT_CACHE_REFRESH_MARGIN_MS) {
    return warm.name;
  }

  const existing = contextCacheInflight.get(inflightKey);
  if (existing) return existing;

  const createPromise = (async () => {
    const nativeBase = geminiNativeBaseUrl(opts.baseUrl);
    if (!/^https?:\/\//i.test(nativeBase)) {
      logContextCache("skip", {
        reason: "create_throw",
        model: opts.model,
        detail: "native_base_not_absolute",
        baseUrlLen: opts.baseUrl.length,
      });
      return null;
    }
    const url = `${nativeBase}/cachedContents`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": opts.apiKey,
        },
        body: JSON.stringify({
          model: `models/${opts.model}`,
          displayName: `qat5-sys-${opts.model}-${hash}`,
          // contents[] ? not systemInstruction alone (create_needs_contents on older/strict APIs).
          contents: [{ role: "user", parts: [{ text: opts.systemPrompt }] }],
          ttl: `${CONTEXT_CACHE_TTL_SEC}s`,
        }),
        signal: opts.signal,
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        logContextCache("skip", {
          reason: classifyCreateFailure(res.status, errBody),
          model: opts.model,
          chars: opts.systemPrompt.length,
          status: res.status,
          err: errBody.slice(0, 240),
        });
        return null;
      }
      const body = (await res.json()) as {
        name?: string;
        expireTime?: string;
        usageMetadata?: { totalTokenCount?: number; total_token_count?: number };
      };
      if (!body.name) {
        logContextCache("skip", {
          reason: "create_no_name",
          model: opts.model,
        });
        return null;
      }
      const expiresAtMs = body.expireTime
        ? Date.parse(body.expireTime)
        : now + CONTEXT_CACHE_TTL_SEC * 1000;
      const cachedTokenCount =
        finiteNum(body.usageMetadata?.totalTokenCount) ??
        finiteNum(body.usageMetadata?.total_token_count) ??
        null;
      contextCacheEntries.set(inflightKey, {
        name: body.name,
        model: opts.model,
        promptHash: hash,
        expiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : now + CONTEXT_CACHE_TTL_SEC * 1000,
        cachedTokenCount,
      });
      logContextCache("created", {
        model: opts.model,
        name: body.name,
        chars: opts.systemPrompt.length,
        cachedTokenCount,
      });
      return body.name;
    } catch (err) {
      logContextCache("skip", {
        reason: "create_throw",
        model: opts.model,
        err: err instanceof Error ? err.message : String(err),
      });
      return null;
    } finally {
      contextCacheInflight.delete(inflightKey);
    }
  })();

  contextCacheInflight.set(inflightKey, createPromise);
  return createPromise;
}

// SYSTEM-REVIEW-2026-08-07 §C2 (HANDOFF 41): ?vv?ll?r burada heç bir timeout/abort yox idi ?
// i?l?m?si platforman?n defolt k?sm? vaxt?na gör? T?SADÜF? idi. Timeout m?suliyy?ti ça??rana
// (`/api/solve`) verilib ? o, `AbortController`-i ~45 san-da i?? sal?r, `opts.signal` bura
// g?lir, `fetch`-? ötürülür. Burada AYRICA timeout QURULMUR ki, iki f?rqli saat bir-birini
// ötm?sin.

export type LLMUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  // OpenRouter v? b?zi gateway-l?r USD/kredit gönd?rir. Gemini/OpenAI gönd?rmir.
  cost?: number;
  cost_usd?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
  thoughts_token_count?: number;
  cached_content_token_count?: number;
};

/** Map native `usageMetadata` (generateContent / stream) into OpenAI-shaped LLMUsage. */
export function usageFromGeminiNativeMetadata(raw: unknown): LLMUsage | null {
  const u = asRecord(raw);
  if (!u) return null;
  const prompt =
    finiteNum(u.promptTokenCount) ?? finiteNum(u.prompt_token_count);
  const completion =
    finiteNum(u.candidatesTokenCount) ?? finiteNum(u.candidates_token_count);
  const total = finiteNum(u.totalTokenCount) ?? finiteNum(u.total_token_count);
  const thoughts =
    finiteNum(u.thoughtsTokenCount) ?? finiteNum(u.thoughts_token_count);
  const cached =
    finiteNum(u.cachedContentTokenCount) ??
    finiteNum(u.cached_content_token_count) ??
    finiteNum(u.totalCachedTokens) ??
    finiteNum(u.total_cached_tokens);
  if (
    prompt === undefined &&
    completion === undefined &&
    total === undefined &&
    cached === undefined
  ) {
    return null;
  }
  const usage: LLMUsage = {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: total,
    thoughts_token_count: thoughts,
  };
  if (cached !== undefined) {
    usage.cached_content_token_count = cached;
    usage.prompt_tokens_details = { cached_tokens: cached };
  }
  return usage;
}

// Gemini OpenAI-uy?un qat? b?z?n camelCase (`promptTokens`) v? ya `total_tokens`
// (dü?ünm? daxil) qaytar?r. Ça??ranlar yaln?z snake_case görsün.
// Also: Google docs name implicit hits as `usage.total_cached_tokens`.
export function normalizeUsage(raw: unknown): LLMUsage | null {
  const u = asRecord(raw);
  if (!u) return null;

  // Native metadata sometimes lands on the OpenAI-compat `usage` object as-is.
  const fromNative = usageFromGeminiNativeMetadata(u);
  if (
    fromNative &&
    (finiteNum(u.promptTokenCount) !== undefined ||
      finiteNum(u.cachedContentTokenCount) !== undefined ||
      finiteNum(u.candidatesTokenCount) !== undefined)
  ) {
    // Prefer native mapping when native keys are present; still merge OpenAI fields below
    // only if native left gaps ? but for pure native metadata, return early.
    if (finiteNum(u.prompt_tokens) === undefined && finiteNum(u.promptTokens) === undefined) {
      return fromNative;
    }
  }

  const promptDetails = asRecord(u.prompt_tokens_details) ?? asRecord(u.promptTokensDetails);
  const completionDetails = asRecord(u.completion_tokens_details) ?? asRecord(u.completionTokensDetails);

  const cachedFromTop =
    finiteNum(u.cached_content_token_count) ??
    finiteNum(u.cachedContentTokenCount) ??
    finiteNum(u.total_cached_tokens) ??
    finiteNum(u.totalCachedTokens);
  const cachedFromDetails =
    finiteNum(promptDetails?.cached_tokens) ?? finiteNum(promptDetails?.cachedTokens);
  const cached = cachedFromDetails ?? cachedFromTop;

  const usage: LLMUsage = {
    prompt_tokens: finiteNum(u.prompt_tokens) ?? finiteNum(u.promptTokens),
    completion_tokens: finiteNum(u.completion_tokens) ?? finiteNum(u.completionTokens),
    total_tokens: finiteNum(u.total_tokens) ?? finiteNum(u.totalTokens),
    cost: finiteNum(u.cost),
    cost_usd: finiteNum(u.cost_usd) ?? finiteNum(u.costUsd),
    thoughts_token_count: finiteNum(u.thoughts_token_count) ?? finiteNum(u.thoughtsTokenCount),
    cached_content_token_count: cachedFromTop ?? cachedFromDetails,
  };
  if (cached !== undefined) usage.prompt_tokens_details = { cached_tokens: cached };
  const reasoning = finiteNum(completionDetails?.reasoning_tokens) ?? finiteNum(completionDetails?.reasoningTokens);
  if (reasoning !== undefined) usage.completion_tokens_details = { reasoning_tokens: reasoning };

  if (
    usage.prompt_tokens === undefined &&
    usage.completion_tokens === undefined &&
    usage.total_tokens === undefined &&
    usage.cost === undefined &&
    usage.cost_usd === undefined &&
    cached === undefined
  ) {
    return null;
  }
  return usage;
}

export function cachedTokensFromUsage(usage: LLMUsage | null | undefined): number | null {
  if (!usage) return null;
  return (
    usage.prompt_tokens_details?.cached_tokens ??
    usage.cached_content_token_count ??
    null
  );
}

export type LLMResult = {
  parsed: unknown | null;
  rawText: string;
  usage: LLMUsage | null;
  latencyMs: number;
  attempts: number;
  // ADR-022: H?Q?Q?T?N ça??r?lan model ID-si ? `opts.model` verilm?yibs? `GEMINI_MODEL`-in
  // öz d?y?ridir, ça??ran bunu t?xmin etm?k ?v?zin? buradan oxumal?d?r.
  model: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonContent(rawText: string): unknown | null {
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

/**
 * Prefer native generateContent when an explicit cache name is available ?
 * OpenAI-compat often omits cached token fields even when the cache is used.
 * Does not invent hits: only returns usage Google puts in usageMetadata.
 */
async function generateWithCachedContent(opts: {
  model: string;
  apiKey: string;
  baseUrl: string;
  cachedContentName: string;
  userPrompt: string;
  signal?: AbortSignal;
}): Promise<{ rawText: string; usage: LLMUsage | null; latencyMs: number } | null> {
  const nativeBase = geminiNativeBaseUrl(opts.baseUrl);
  if (!/^https?:\/\//i.test(nativeBase)) return null;
  const url = `${nativeBase}/models/${opts.model}:generateContent`;
  const started = performance.now();
  try {
    const res = await fetch(url, {
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
    const latencyMs = performance.now() - started;
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      logContextCache("skip", {
        reason: "native_generate_failed",
        model: opts.model,
        status: res.status,
        err: errBody.slice(0, 240),
      });
      return null;
    }
    const body = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: unknown;
    };
    const rawText =
      body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const usage = usageFromGeminiNativeMetadata(body.usageMetadata);
    if (cachedTokensFromUsage(usage) == null) {
      logContextCache("warn", {
        reason: "usage_missing_cached_tokens",
        path: "native_generateContent",
        model: opts.model,
        cache: opts.cachedContentName,
        usage,
      });
    }
    return { rawText, usage, latencyMs };
  } catch (err) {
    logContextCache("skip", {
      reason: "native_generate_failed",
      model: opts.model,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// Gemini OpenAI-uy?un `reasoning_effort`. Qat 1 üçün `none` (dü?ünm?ni söndür / minimum);
// Qat 5-? VER?LM?M?L?D?R ? COST-LATENCY-SAFE-SEQUENCE add?m 1. Gemini 3 Flash-d?
// `none` tam sönm?y? bil?r (Google: 3 modell?rd? thinking söndürül? bilmir); o zaman
// API `minimal`-? map edir v? ya r?dd edir ? ölçüd? `thoughts_token_count` il? yoxla.
export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high";

// ADR-020 (kaskad): `image*` sah?l?ri art?q OPTIONAL-d?r v? `model` override edil? bilir.
//   Qat 1 ? ??kil VAR, `active_transcribe_model` (0065: gemini-3.7-flash)
//   Qat 5 ? ??kil YOX (s?rf m?tn), bahal? model (`GEMINI_MODEL`)
// ??kil verilm?y?nd? `content` massiv deyil, sad? s?tir kimi gönd?rilir ? bu, OpenAI-uy?un
// endpointl?rd? m?tn-yaln?z sor?unun standart formas?d?r v? vision tokeni öd?nilmir.
export async function callVisionLLM(opts: {
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  imageMime?: string;
  model?: string;
  signal?: AbortSignal;
  /** Yaln?z Qat 1 (transcribe). Qat 5 ça??r???na ötürm?. */
  reasoningEffort?: ReasoningEffort;
  /**
   * Qat 5: explicit Gemini context cache for the system prompt.
   * On failure / short prompt, falls back to inline system message (no fake hits).
   */
  useContextCache?: boolean;
}): Promise<LLMResult> {
  const model = opts.model || process.env.GEMINI_MODEL;
  if (!model) {
    throw new Error("GEMINI_MODEL env d?yi??ni (v? ya opts.model) laz?md?r.");
  }
  // ADR-022: TANINAN model üçün registrinin ba?lant? env-l?ri i?l?dilir, nam?lum model üçün
  // (registrid? olmayan, s?rb?st-m?tn override) `GEMINI_*`-? geri dü?ür ? çoxprovayderli hal
  // BU ADR-in h?cmind?n K?NARDIR, bir provayder daxilind? model azadl??? buradad?r.
  const connection = resolveConnection(model) ?? {
    baseUrl: process.env.GEMINI_BASE_URL,
    apiKey: process.env.GEMINI_API_KEY,
  };
  const { baseUrl, apiKey } = connection;
  if (!apiKey || !baseUrl) {
    throw new Error(
      `Model '${model}' üçün ba?lant? env-l?ri tap?lmad? (GEMINI_API_KEY/GEMINI_BASE_URL v? ya registrinin öz env-l?ri).`
    );
  }

  const userContent = opts.imageBase64
    ? [
        { type: "text", text: opts.userPrompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${opts.imageMime || "image/jpeg"};base64,${opts.imageBase64}`,
          },
        },
      ]
    : opts.userPrompt;

  let cachedContentName: string | null = null;
  if (opts.useContextCache && !opts.imageBase64) {
    cachedContentName = await ensureGeminiSystemCache({
      model,
      systemPrompt: opts.systemPrompt,
      apiKey,
      baseUrl,
      signal: opts.signal,
    });
  }

  // Prefer native generateContent when cache is wired ? reliable cachedContentTokenCount.
  if (cachedContentName && typeof opts.userPrompt === "string" && !opts.imageBase64) {
    const native = await generateWithCachedContent({
      model,
      apiKey,
      baseUrl,
      cachedContentName,
      userPrompt: opts.userPrompt,
      signal: opts.signal,
    });
    if (native) {
      return {
        parsed: parseJsonContent(native.rawText),
        rawText: native.rawText,
        usage: native.usage,
        latencyMs: native.latencyMs,
        attempts: 1,
        model,
      };
    }
    // Fall through to OpenAI-compat + extra_body, then inline.
  }

  const messages: Array<{ role: string; content: unknown }> = [];
  // Explicit cache already holds the system prefix ? do not resend (would double-bill).
  if (!cachedContentName) {
    messages.push({ role: "system", content: opts.systemPrompt });
  }
  messages.push({ role: "user", content: userContent });

  const payload: Record<string, unknown> = {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages,
  };
  if (opts.reasoningEffort !== undefined) {
    payload.reasoning_effort = opts.reasoningEffort;
  }
  if (cachedContentName) {
    // OpenAI-compat Gemini REST: extra_body.google.cached_content (see ai.google.dev openai docs).
    payload.extra_body = { google: { cached_content: cachedContentName } };
  }

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  let attempts = 0;
  let latencyMs = 0;
  let res: Response | null = null;
  let usedCache = Boolean(cachedContentName);

  async function postOnce(body: Record<string, unknown>): Promise<Response> {
    return fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attempts = attempt;
    const started = performance.now();
    res = await postOnce(payload);
    latencyMs = performance.now() - started;

    // OpenAI-compat may reject extra_body.google.cached_content ? fall back once to inline system.
    if (
      usedCache &&
      res.status >= 400 &&
      res.status < 500 &&
      res.status !== 429 &&
      attempt === 1
    ) {
      logContextCache("skip", {
        reason: "openai_extra_body_rejected",
        model,
        status: res.status,
      });
      if (cachedContentName) {
        contextCacheEntries.delete(`${model}:${promptHash(opts.systemPrompt)}`);
      }
      usedCache = false;
      cachedContentName = null;
      delete payload.extra_body;
      payload.messages = [
        { role: "system", content: opts.systemPrompt },
        { role: "user", content: userContent },
      ];
      continue;
    }

    if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    throw new Error(`LLM sor?usu u?ursuz oldu: ${res?.status}`);
  }

  const body = await res.json();
  const rawText: string = body.choices?.[0]?.message?.content ?? "";
  // Gemini/OpenAI `usage`-d? USD YOXDUR ? token saylar? var (ADR-028). OpenRouter
  // `usage.cost` gönd?rir; `normalizeUsage` onu da saxlay?r.
  const usage = normalizeUsage(body.usage);
  if (usedCache && cachedTokensFromUsage(usage) == null) {
    logContextCache("warn", {
      reason: "usage_missing_cached_tokens",
      path: "openai_chat_completions",
      model,
      usage,
    });
  }

  return {
    parsed: parseJsonContent(rawText),
    rawText,
    usage,
    latencyMs,
    attempts,
    model,
  };
}
