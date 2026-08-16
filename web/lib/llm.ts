// Provider-agnostik vision LLM çağırışı — OpenAI-uyğun /chat/completions (CLAUDE.md: Gemini
// gemini-3.6-flash, OpenAI-uyğun endpoint). scripts/lib/llm_client.py::call_vision_llm-in
// istehsalat-üçün-lazım-olan hissəsinin TS portu (image ön emalı YOX — klient artıq kəsib
// ≤1600px-ə kiçildib göndərir, ADR-001/S2).
//
// API_KEY YALNIZ SERVERDƏ (CLAUDE.md) — bu modul "use client" DEYİL, App Router route
// handler-lərindən (server-only) çağırılır.
//
// ADR-022: hansı model İSTİFADƏ OLUNDUĞU nəticədə (`LLMResult.model`) qaytarılır — çağıran
// bunu `computeCostUsd`-a ötürməlidir. Bu, `opts.model`in `undefined` qalıb `GEMINI_MODEL`-ə
// düşdüyü halları da əhatə edir; çağıran özü hansı modelin işlədiyini TƏXMİN ETMƏMƏLİDİR.

import { createHash } from "crypto";
import { resolveConnection } from "./models";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
/** Explicit Gemini context cache TTL (seconds). Default Google TTL is 1h. */
const CONTEXT_CACHE_TTL_SEC = 3600;
/** Refresh in-memory entry this many ms before Google TTL expiry. */
const CONTEXT_CACHE_REFRESH_MARGIN_MS = 5 * 60 * 1000;
/** Gemini 3 family minimum for explicit/implicit cache eligibility. */
const CONTEXT_CACHE_MIN_CHARS = 12_000;

type ContextCacheEntry = {
  name: string;
  model: string;
  promptHash: string;
  expiresAtMs: number;
};

let contextCacheEntry: ContextCacheEntry | null = null;
let contextCacheInflight: Promise<string | null> | null = null;

function promptHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 24);
}

/** OpenAI-compat base ends in `/openai`; cachedContents lives on the native v1beta root. */
export function geminiNativeBaseUrl(openaiOrNativeBase: string): string {
  return openaiOrNativeBase.replace(/\/$/, "").replace(/\/openai$/i, "");
}

/**
 * Create or reuse an explicit Gemini `cachedContents` resource for a stable Qat 5
 * system prompt. Returns the resource name (`cachedContents/...`) or null if the
 * prompt is too short / API fails — caller must then send the system message inline.
 *
 * Cache key: `active_model` + prompt hash (COST-LATENCY-SAFE-SEQUENCE addım 2).
 */
export async function ensureGeminiSystemCache(opts: {
  model: string;
  systemPrompt: string;
  apiKey: string;
  baseUrl: string;
  signal?: AbortSignal;
}): Promise<string | null> {
  if (opts.systemPrompt.length < CONTEXT_CACHE_MIN_CHARS) return null;

  const hash = promptHash(opts.systemPrompt);
  const now = Date.now();
  if (
    contextCacheEntry &&
    contextCacheEntry.model === opts.model &&
    contextCacheEntry.promptHash === hash &&
    contextCacheEntry.expiresAtMs > now + CONTEXT_CACHE_REFRESH_MARGIN_MS
  ) {
    return contextCacheEntry.name;
  }

  if (contextCacheInflight) return contextCacheInflight;

  contextCacheInflight = (async () => {
    const nativeBase = geminiNativeBaseUrl(opts.baseUrl);
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
          systemInstruction: { parts: [{ text: opts.systemPrompt }] },
          ttl: `${CONTEXT_CACHE_TTL_SEC}s`,
        }),
        signal: opts.signal,
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.warn(
          `[llm] Gemini cachedContents create failed ${res.status}: ${errBody.slice(0, 200)}`
        );
        return null;
      }
      const body = (await res.json()) as { name?: string; expireTime?: string };
      if (!body.name) return null;
      const expiresAtMs = body.expireTime
        ? Date.parse(body.expireTime)
        : now + CONTEXT_CACHE_TTL_SEC * 1000;
      contextCacheEntry = {
        name: body.name,
        model: opts.model,
        promptHash: hash,
        expiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : now + CONTEXT_CACHE_TTL_SEC * 1000,
      };
      return body.name;
    } catch (err) {
      console.warn("[llm] Gemini cachedContents create error:", err);
      return null;
    } finally {
      contextCacheInflight = null;
    }
  })();

  return contextCacheInflight;
}


// SYSTEM-REVIEW-2026-08-07 §C2 (HANDOFF 41): əvvəllər burada heç bir timeout/abort yox idi —
// işləməsi platformanın defolt kəsmə vaxtına görə TƏSADÜFİ idi. Timeout məsuliyyəti çağırana
// (`/api/solve`) verilib — o, `AbortController`-i ~45 san-da işə salır, `opts.signal` bura
// gəlir, `fetch`-ə ötürülür. Burada AYRICA timeout QURULMUR ki, iki fərqli saat bir-birini
// ötməsin.

export type LLMUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  // OpenRouter və bəzi gateway-lər USD/kredit göndərir. Gemini/OpenAI göndərmir.
  cost?: number;
  cost_usd?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
  thoughts_token_count?: number;
  cached_content_token_count?: number;
};

function finiteNum(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

// Gemini OpenAI-uyğun qatı bəzən camelCase (`promptTokens`) və ya `total_tokens`
// (düşünmə daxil) qaytarır. Çağıranlar yalnız snake_case görsün.
export function normalizeUsage(raw: unknown): LLMUsage | null {
  const u = asRecord(raw);
  if (!u) return null;

  const promptDetails = asRecord(u.prompt_tokens_details) ?? asRecord(u.promptTokensDetails);
  const completionDetails = asRecord(u.completion_tokens_details) ?? asRecord(u.completionTokensDetails);

  const usage: LLMUsage = {
    prompt_tokens: finiteNum(u.prompt_tokens) ?? finiteNum(u.promptTokens),
    completion_tokens: finiteNum(u.completion_tokens) ?? finiteNum(u.completionTokens),
    total_tokens: finiteNum(u.total_tokens) ?? finiteNum(u.totalTokens),
    cost: finiteNum(u.cost),
    cost_usd: finiteNum(u.cost_usd) ?? finiteNum(u.costUsd),
    thoughts_token_count: finiteNum(u.thoughts_token_count) ?? finiteNum(u.thoughtsTokenCount),
    cached_content_token_count: finiteNum(u.cached_content_token_count) ?? finiteNum(u.cachedContentTokenCount),
  };
  const cached = finiteNum(promptDetails?.cached_tokens) ?? finiteNum(promptDetails?.cachedTokens);
  if (cached !== undefined) usage.prompt_tokens_details = { cached_tokens: cached };
  const reasoning = finiteNum(completionDetails?.reasoning_tokens) ?? finiteNum(completionDetails?.reasoningTokens);
  if (reasoning !== undefined) usage.completion_tokens_details = { reasoning_tokens: reasoning };

  if (
    usage.prompt_tokens === undefined &&
    usage.completion_tokens === undefined &&
    usage.total_tokens === undefined &&
    usage.cost === undefined &&
    usage.cost_usd === undefined
  ) {
    return null;
  }
  return usage;
}

export type LLMResult = {
  parsed: unknown | null;
  rawText: string;
  usage: LLMUsage | null;
  latencyMs: number;
  attempts: number;
  // ADR-022: HƏQİQƏTƏN çağırılan model ID-si — `opts.model` verilməyibsə `GEMINI_MODEL`-in
  // öz dəyəridir, çağıran bunu təxmin etmək əvəzinə buradan oxumalıdır.
  model: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gemini OpenAI-uyğun `reasoning_effort`. Qat 1 üçün `none` (düşünməni söndür / minimum);
// Qat 5-ə VERİLMƏMƏLİDİR — COST-LATENCY-SAFE-SEQUENCE addım 1. Gemini 3 Flash-də
// `none` tam sönməyə bilər (Google: 3 modellərdə thinking söndürülə bilmir); o zaman
// API `minimal`-ə map edir və ya rədd edir — ölçüdə `thoughts_token_count` ilə yoxla.
export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high";

// ADR-020 (kaskad): `image*` sahələri artıq OPTIONAL-dır və `model` override edilə bilir.
//   Qat 1 → şəkil VAR, `active_transcribe_model` (0065: gemini-3.7-flash)
//   Qat 5 → şəkil YOX (sırf mətn), bahalı model (`GEMINI_MODEL`)
// Şəkil verilməyəndə `content` massiv deyil, sadə sətir kimi göndərilir — bu, OpenAI-uyğun
// endpointlərdə mətn-yalnız sorğunun standart formasıdır və vision tokeni ödənilmir.
export async function callVisionLLM(opts: {
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  imageMime?: string;
  model?: string;
  signal?: AbortSignal;
  /** Yalnız Qat 1 (transcribe). Qat 5 çağırışına ötürmə. */
  reasoningEffort?: ReasoningEffort;
  /**
   * Qat 5: explicit Gemini context cache for the system prompt.
   * On failure / short prompt, falls back to inline system message (no fake hits).
   */
  useContextCache?: boolean;
}): Promise<LLMResult> {
  const model = opts.model || process.env.GEMINI_MODEL;
  if (!model) {
    throw new Error("GEMINI_MODEL env dəyişəni (və ya opts.model) lazımdır.");
  }
  // ADR-022: TANINAN model üçün registrinin bağlantı env-ləri işlədilir, naməlum model üçün
  // (registridə olmayan, sərbəst-mətn override) `GEMINI_*`-ə geri düşür — çoxprovayderli hal
  // BU ADR-in həcmindən KƏNARDIR, bir provayder daxilində model azadlığı buradadır.
  const connection = resolveConnection(model) ?? {
    baseUrl: process.env.GEMINI_BASE_URL,
    apiKey: process.env.GEMINI_API_KEY,
  };
  const { baseUrl, apiKey } = connection;
  if (!apiKey || !baseUrl) {
    throw new Error(`Model '${model}' üçün bağlantı env-ləri tapılmadı (GEMINI_API_KEY/GEMINI_BASE_URL və ya registrinin öz env-ləri).`);
  }

  const userContent = opts.imageBase64
    ? [
        { type: "text", text: opts.userPrompt },
        { type: "image_url", image_url: { url: `data:${opts.imageMime || "image/jpeg"};base64,${opts.imageBase64}` } },
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

  const messages: Array<{ role: string; content: unknown }> = [];
  // Explicit cache already holds systemInstruction — do not resend (would double-bill).
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
    // OpenAI-compat Gemini: `extra_body.google.cached_content` (native resource name).
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

    // OpenAI-compat may reject extra_body.google.cached_content — fall back once to inline system.
    if (
      usedCache &&
      res.status >= 400 &&
      res.status < 500 &&
      res.status !== 429 &&
      attempt === 1
    ) {
      console.warn(`[llm] cached_content rejected (${res.status}); falling back to inline system`);
      contextCacheEntry = null;
      usedCache = false;
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
    throw new Error(`LLM sorğusu uğursuz oldu: ${res?.status}`);
  }

  const body = await res.json();
  const rawText: string = body.choices?.[0]?.message?.content ?? "";
  // Gemini/OpenAI `usage`-də USD YOXDUR — token sayları var (ADR-028). OpenRouter
  // `usage.cost` göndərir; `normalizeUsage` onu da saxlayır.
  const usage = normalizeUsage(body.usage);

  let parsed: unknown | null = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }

  return { parsed, rawText, usage, latencyMs, attempts, model };
}
