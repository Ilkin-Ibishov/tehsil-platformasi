// Provider-agnostik vision LLM çağırışı — OpenAI-uyğun /chat/completions (CLAUDE.md: Gemini
// gemini-3.6-flash, OpenAI-uyğun endpoint). scripts/lib/llm_client.py::call_vision_llm-in
// istehsalat-üçün-lazım-olan hissəsinin TS portu (image ön emalı YOX — klient artıq kəsib
// ≤1600px-ə kiçildib göndərir, ADR-001/S2).
//
// API_KEY YALNIZ SERVERDƏ (CLAUDE.md) — bu modul "use client" DEYİL, App Router route
// handler-lərindən (server-only) çağırılır.

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

export type LLMUsage = { prompt_tokens?: number; completion_tokens?: number };

export type LLMResult = {
  parsed: unknown | null;
  rawText: string;
  usage: LLMUsage | null;
  latencyMs: number;
  attempts: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callVisionLLM(opts: {
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
  imageMime: string;
}): Promise<LLMResult> {
  const model = process.env.GEMINI_MODEL;
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_BASE_URL;
  if (!model || !apiKey || !baseUrl) {
    throw new Error("GEMINI_MODEL, GEMINI_API_KEY, GEMINI_BASE_URL env dəyişənləri lazımdır.");
  }

  const payload = {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: opts.systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: opts.userPrompt },
          { type: "image_url", image_url: { url: `data:${opts.imageMime};base64,${opts.imageBase64}` } },
        ],
      },
    ],
  };

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  let attempts = 0;
  let latencyMs = 0;
  let res: Response | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attempts = attempt;
    const started = performance.now();
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    latencyMs = performance.now() - started;

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
  const usage: LLMUsage | null = body.usage ?? null;

  let parsed: unknown | null = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }

  return { parsed, rawText, usage, latencyMs, attempts };
}
