// ChatGPT web avtomat servisi — OpenAI-uyğun DEYİL (ADR-029, PHASE-2 S0).
// `POST /chat` `{ text, image }` → `{ response: string }`. Açar yalnız
// `SOAK_LLM_BASE_URL` / `SOAK_LLM_API_KEY` env-dədir — repo-ya düşmür.
//
// Şagird `callVisionLLM` bu faylı import etmir.

import type { LLMResult } from "../llm";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 2000;
const HEALTH_TTL_MS = 15_000;

export class SoakTransportError extends Error {
  constructor(
    message: string,
    readonly reason: "unhealthy" | "auth" | "http",
    readonly status?: number
  ) {
    super(message);
    this.name = "SoakTransportError";
  }
}

export function isRetryableSoakStatus(status: number, errorCode?: string): boolean {
  if (errorCode === "AUTH_EXPIRED" || errorCode === "UNAUTHORIZED") return false;
  if (status === 401) return false;
  return RETRYABLE_STATUS.has(status);
}

function stripFence(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fence ? fence[1] : text).trim();
}

// ChatGPT `json_object` vermir — hashtag, hasar, əlavə cümlə ola bilər.
export function extractJsonFromSoakResponse(text: string): unknown | null {
  const stripped = stripFence(text).replace(/^(?:#+\s.*\n)+/, "").trim();
  const start = stripped.indexOf("{");
  if (start < 0) return null;
  const slice = stripped.slice(start);
  try {
    return JSON.parse(slice) as unknown;
  } catch {
    const end = slice.lastIndexOf("}");
    if (end <= 0) return null;
    try {
      return JSON.parse(slice.slice(0, end + 1)) as unknown;
    } catch {
      return null;
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function soakConnection(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env.SOAK_LLM_BASE_URL;
  const apiKey = process.env.SOAK_LLM_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

type CachedHealth = { at: number; ok: true } | { at: number; ok: false; reason: "unhealthy" | "auth" };
let healthCache: CachedHealth | null = null;

export async function checkSoakHealth(signal?: AbortSignal): Promise<{ ok: true } | { ok: false; reason: "unhealthy" | "auth" }> {
  const now = Date.now();
  if (healthCache && now - healthCache.at < HEALTH_TTL_MS) {
    return healthCache.ok ? { ok: true } : { ok: false, reason: healthCache.reason };
  }
  const conn = soakConnection();
  if (!conn) return { ok: false, reason: "unhealthy" };

  let res: Response;
  try {
    res = await fetch(`${conn.baseUrl}/health`, { method: "GET", signal });
  } catch {
    healthCache = { at: now, ok: false, reason: "unhealthy" };
    return { ok: false, reason: "unhealthy" };
  }
  if (!res.ok) {
    healthCache = { at: now, ok: false, reason: "unhealthy" };
    return { ok: false, reason: "unhealthy" };
  }
  const body = (await res.json().catch(() => null)) as {
    status?: unknown;
    browser?: { healthy?: unknown; authMode?: unknown };
  } | null;
  const authMode = body?.browser?.authMode;
  if (authMode !== "cookie") {
    healthCache = { at: now, ok: false, reason: "auth" };
    return { ok: false, reason: "auth" };
  }
  if (body?.status !== "healthy" || body?.browser?.healthy !== true) {
    healthCache = { at: now, ok: false, reason: "unhealthy" };
    return { ok: false, reason: "unhealthy" };
  }
  healthCache = { at: now, ok: true };
  return { ok: true };
}

export async function callSoakChat(opts: {
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  imageMime?: string;
  signal?: AbortSignal;
}): Promise<LLMResult> {
  const conn = soakConnection();
  if (!conn) {
    throw new SoakTransportError("SOAK_LLM_BASE_URL/SOAK_LLM_API_KEY yoxdur", "unhealthy");
  }

  const text = `${opts.systemPrompt}\n\n${opts.userPrompt}`;
  const payload: Record<string, unknown> = { text, attachTextAsFile: true };
  if (opts.imageBase64) {
    const mime = opts.imageMime || "image/jpeg";
    payload.image = `data:${mime};base64,${opts.imageBase64}`;
  }

  let attempts = 0;
  let latencyMs = 0;
  let res: Response | null = null;
  let errorCode: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attempts = attempt;
    if (opts.signal?.aborted) break;
    const started = performance.now();
    res = await fetch(`${conn.baseUrl}/chat`, {
      method: "POST",
      headers: { "x-api-key": conn.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: opts.signal,
    });
    latencyMs = performance.now() - started;

    if (res.ok) break;

    const errBody = (await res.json().catch(() => null)) as { errorCode?: unknown } | null;
    errorCode = typeof errBody?.errorCode === "string" ? errBody.errorCode : undefined;
    if (errorCode === "AUTH_EXPIRED" || res.status === 401) {
      throw new SoakTransportError("soak auth expired", "auth", res.status);
    }
    if (isRetryableSoakStatus(res.status, errorCode) && attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    throw new SoakTransportError(`soak LLM ${res?.status ?? "no-response"}`, "http", res?.status);
  }

  const body = (await res.json()) as { response?: unknown };
  const rawText = typeof body.response === "string" ? body.response : "";
  const parsed = extractJsonFromSoakResponse(rawText);

  return {
    parsed,
    rawText,
    usage: null,
    latencyMs,
    attempts,
    model: "chatgpt_web",
  };
}
