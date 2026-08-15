// Model registrisi — ADR-022 / ADR-027. Qiymət MODELİN ÖZÜ ilə eyni obyektdə yaşayır
// və YALNIZ buradadır: Vercel/env qiymət oxumur (86eymrm8j — env unudulanda cost_usd
// NULL; env köhnələndə isə səssizcə YANLIŞ rəqəm).
//
// Gemini Developer API USD qaytarmır — `chat/completions` `usage` yalnız token sayıdır,
// `models.get` token limitidir, qiymət kataloqu yoxdur (ADR-027). `cost_usd` = token ×
// bu registri.
//
// Model SEÇİMİ azad qalır (registridə olmasa belə çağırış keçir). Naməlum model üçün
// qiymət `null` qalır — yeni modelə qiymət YALNIZ bu fayla sətir əlavə etməklə gəlir.

export type ProviderId = "gemini";

export type ModelConfig = {
  id: string;
  provider: ProviderId;
  // Provayderin bağlantı env-ləri — eyni provayderin bütün modelləri paylaşır (OpenAI-uyğun
  // endpoint-lərdə model adı sorğu gövdəsində dəyişir, URL/açar dəyişmir).
  baseUrlEnv: string;
  apiKeyEnv: string;
  // KODDA yaşayan qiymət — modeldən AYRILA BİLMƏZ. Mənbə: ai.google.dev/gemini-api/docs/pricing.
  defaultPriceInputPer1M: number;
  defaultPriceOutputPer1M: number;
};

// Tanınan modellər. Naməlum ID üçün `resolvePrice` `null` qaytarır — env ilə doldurulmur.
//
// QİYMƏT DÜZƏLİŞİ (2026-08-14, Google rəsmi səhifə): `gemini-3.6-flash` və
// `gemini-3.7-flash` 2026-12-31-ə qədər eyni tarifdədir. 2027-01-01-dən Google
// ikiqat edir — o vaxt BU FAYLI yenilə; kod tarixə görə özü dəyişmir.
const REGISTRY: Record<string, ModelConfig> = {
  "gemini-3.6-flash": {
    id: "gemini-3.6-flash",
    provider: "gemini",
    baseUrlEnv: "GEMINI_BASE_URL",
    apiKeyEnv: "GEMINI_API_KEY",
    defaultPriceInputPer1M: 0.75, // 2026-12-31-ə qədər. Sonra 1.50.
    defaultPriceOutputPer1M: 3.75, // 2026-12-31-ə qədər. Sonra 7.50.
  },
  // Eyni provayder (Gemini-nin OpenAI-uyğun endpoint-i), HAZIRDA eyni qiymət — ADR-022-nin
  // "eyni provayder daxilində model versiyaları arasında rahat keçid" məqsədinin BİRİNCİ
  // real nümunəsi. `GEMINI_MODEL=gemini-3.7-flash` təyin etmək kifayətdir, qiymət avtomatik
  // düzgün olacaq.
  "gemini-3.7-flash": {
    id: "gemini-3.7-flash",
    provider: "gemini",
    baseUrlEnv: "GEMINI_BASE_URL",
    apiKeyEnv: "GEMINI_API_KEY",
    defaultPriceInputPer1M: 0.75, // 2026-12-31-ə qədər. Sonra 1.50.
    defaultPriceOutputPer1M: 3.75, // 2026-12-31-ə qədər. Sonra 7.50.
  },
  // ClickUp 86eykqb1c — Qat 1 (şəkil→transkripsiya). Vision var, mühakimə yoxdur.
  // Qiymət: ai.google.dev/gemini-api/docs/pricing (2026-08-15, birbaşa yoxlanıldı).
  "gemini-3.1-flash-lite": {
    id: "gemini-3.1-flash-lite",
    provider: "gemini",
    baseUrlEnv: "GEMINI_BASE_URL",
    apiKeyEnv: "GEMINI_API_KEY",
    defaultPriceInputPer1M: 0.25,
    defaultPriceOutputPer1M: 1.5,
  },
};

export function getModelConfig(modelId: string): ModelConfig | null {
  return REGISTRY[modelId] ?? null;
}

export function listKnownModelIds(): string[] {
  return Object.keys(REGISTRY);
}

export type ResolvedPrice = { inputPer1M: number; outputPer1M: number };

// Yalnız registri. Env oxunmur (ADR-027). Naməlum model → `null`, 0 YOX
// (`86eymrm8j` — bilinməyəni sıfır yazmaq tavanı yalan edər).
export function resolvePrice(modelId: string): ResolvedPrice | null {
  const cfg = REGISTRY[modelId];
  if (!cfg) return null;
  return {
    inputPer1M: cfg.defaultPriceInputPer1M,
    outputPer1M: cfg.defaultPriceOutputPer1M,
  };
}

export type ResolvedConnection = { baseUrl: string; apiKey: string };

// Yalnız TANINAN model üçün işləyir (bağlantı env-ləri registridən gəlir — naməlum model
// üçün hansı provayderə müraciət ediləcəyi bilinmir, bu, ADR-022-nin HƏLL ETMƏDİYİ
// çoxprovayderli hal, `web/lib/llm.ts` bu halda GEMINI_* env-lərinə geri düşür).
export function resolveConnection(modelId: string): ResolvedConnection | null {
  const cfg = REGISTRY[modelId];
  if (!cfg) return null;
  const baseUrl = process.env[cfg.baseUrlEnv];
  const apiKey = process.env[cfg.apiKeyEnv];
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

// ── ADR-023: aktiv model DB-dən (redeploy-suz) ───────────────────────────────────────────
//
// `public.app_config` (`0056`) — Ilkin-in tapşırığı: model seçimi Vercel env-dən (manual +
// redeploy) asılı olmasın. `app_runtime`-ın YALNIZ SELECT-i var (gate-78 dərsi) — yazı
// birbaşa SQL-lə (Claude Code/Cowork) və ya gələcək admin RPC-lə olur, BU MODUL yazmır.
//
// `readConfigValue` `web/lib/app-config.ts`-ə köçürüldü (2026-08-15) — kaskad feature
// flag-ləri (bax `getBoolConfig`) EYNİ mexanizmi paylaşsın deyə, iki ayrı DB-oxuma
// implementasiyası olmasın.
import { readConfigValue } from "./app-config";

type PoolLike = { query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }> };

// `GEMINI_MODEL`-i əvəz edir — DB `active_model` sətri boş/yoxdursa env-ə geri düşür.
export async function getActiveModel(pool: PoolLike): Promise<string> {
  const fromDb = await readConfigValue(pool, "active_model");
  return fromDb || process.env.GEMINI_MODEL || "";
}

// `TRANSCRIBE_MODEL || GEMINI_MODEL` zəncirini əvəz edir — DB `active_transcribe_model`
// boşdursa `getActiveModel`-ə (yəni DB-nin özünün `active_model`-inə, sonra env-ə) düşür.
export async function getActiveTranscribeModel(pool: PoolLike): Promise<string> {
  const fromDb = await readConfigValue(pool, "active_transcribe_model");
  if (fromDb) return fromDb;
  const envOverride = process.env.TRANSCRIBE_MODEL;
  if (envOverride) return envOverride;
  return getActiveModel(pool);
}
