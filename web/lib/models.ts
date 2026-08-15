// Model registrisi — ADR-022. Qiymət MODELİN ÖZÜ ilə eyni obyektdə yaşayır ki, `GEMINI_
// MODEL`/`TRANSCRIBE_MODEL` dəyişəndə qiymət env-ini yeniləməyi UNUTMAQ struktur olaraq
// mümkün olmasın (86eymrm8j auditinin aşkarladığı risk — "0 yazma" YOX, "SƏSSİZ YANLIŞ
// model üçün YANLIŞ qiymət" idi, daha təhlükəli sinifdir).
//
// Model SEÇİMİ özü AZAD qalır (`GEMINI_MODEL` istənilən sətir ola bilər, registridə
// olmasa belə çağırış keçir) — registri MƏCBURİYYƏT deyil, TANINAN modellər üçün
// sıfır-konfiqurasiya rahatlığıdır. Naməlum model üçün qiymət `null` (bilinmir) qalır,
// TA Kİ operator `MODEL_<SLUG>_PRICE_*_PER_1M` təyin etməyincə — açar MODELİN ÖZ
// ID-sindən hesablanır, ona görə yanlış modelin qiymətini "təsadüfən" oxumaq mümkün deyil.

export type ProviderId = "gemini";

export type ModelConfig = {
  id: string;
  provider: ProviderId;
  // Provayderin bağlantı env-ləri — eyni provayderin bütün modelləri paylaşır (OpenAI-uyğun
  // endpoint-lərdə model adı sorğu gövdəsində dəyişir, URL/açar dəyişmir).
  baseUrlEnv: string;
  apiKeyEnv: string;
  // KODDA yaşayan defolt qiymət — modeldən AYRILA BİLMƏZ. `docs/decisions/ADR-022...`-də
  // qeyd olunan mənbələrlə doğrulanıb (2026-08-14).
  defaultPriceInputPer1M: number;
  defaultPriceOutputPer1M: number;
};

// Tanınan modellər — yeni model əlavə etmək REGİSTRİYƏ məcburi DEYİL (qiymət override
// env-i ilə də işləyir), amma tanınan model üçün sıfır-konfiqurasiya təmin edir.
//
// QİYMƏT DÜZƏLİŞİ (2026-08-14, Google-un rəsmi qiymət səhifəsi — ai.google.dev/gemini-api/
// docs/pricing — birbaşa yoxlanıldı): `gemini-3.6-flash` VƏ `gemini-3.7-flash` HAZIRDA
// (2026-12-31-ə QƏDƏR) EYNİ giriş qiymətindədir — $0.75/$3.75, YOX $1.50/$7.50 (bu ədədlər
// `web/.env.example`-in köhnə nümunə dəyərləri idi, HƏMİN vaxt üçün YANLIŞ idi). **DİQQƏT —
// 2027-01-01-dən qiymət İKİQAT olur ($1.50/$7.50).** Bu tarixdən sonra aşağıdakı defolt
// dəyərləri yeniləmək lazımdır (və ya `MODEL_*_PRICE_*_PER_1M` env override-ı ilə əvvəlcədən
// keçid etmək) — kod özü tarix-əsaslı dəyişiklik ETMİR, bu, gələcək bir sessiyanın işidir.
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

// "gemini-3.6-flash" → "MODEL_GEMINI_3_6_FLASH_PRICE_INPUT_PER_1M". Deterministikdir —
// eyni model ID HƏMİŞƏ eyni açara düşür, ona görə iki modelin qiyməti QARIŞA BİLMƏZ.
export function priceEnvKey(modelId: string, direction: "INPUT" | "OUTPUT"): string {
  const slug = modelId.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return `MODEL_${slug}_PRICE_${direction}_PER_1M`;
}

export type ResolvedPrice = { inputPer1M: number; outputPer1M: number };

// Qiyməti tapır: əvvəlcə model-spesifik env override (istənilən model üçün işləyir,
// registridə olmasa belə), sonra registrinin defolt dəyəri. İkisi də yoxdursa `null` —
// `86eymrm8j`-dəki eyni "0 yazma, sükutla düz sayma" prinsipi.
export function resolvePrice(modelId: string): ResolvedPrice | null {
  const inputOverride = process.env[priceEnvKey(modelId, "INPUT")];
  const outputOverride = process.env[priceEnvKey(modelId, "OUTPUT")];
  const cfg = REGISTRY[modelId];

  const inputPer1M = inputOverride ? Number(inputOverride) : cfg?.defaultPriceInputPer1M;
  const outputPer1M = outputOverride ? Number(outputOverride) : cfg?.defaultPriceOutputPer1M;

  if (inputPer1M === undefined || outputPer1M === undefined || Number.isNaN(inputPer1M) || Number.isNaN(outputPer1M)) {
    return null;
  }
  return { inputPer1M, outputPer1M };
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
