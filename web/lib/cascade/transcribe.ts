// Kaskad Qat 1 — ŞƏKLİ GÖRƏN YEGANƏ ÇAĞIRIŞ (ClickUp 86eykj7tu, ADR-020).
//
// İki iş görür:
//   1. Transkripsiya — şəkil → maşın forması (`canonical` + subject/grade/topic_code).
//   2. Rədd qapısı — bulanıq şəkil, riyaziyyat olmayan foto, çoxməsələli kadr, kəsilmiş
//      məsələ BURADA tutulur. Bu, xüsusiyyət deyil, qatın ƏSAS DƏYƏRİDİR: buradan keçən
//      zibil sonrakı qatlarda tutulmur, amma pulu ödənilir (ADR-014 §"iki dəfə ödənilir").
//
// Nə ETMİR: həll etmir, addım bölmür, cavab tapmır. Prompt bunu açıq qadağan edir.

import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { loadTranscribeTemplates, renderUserPrompt } from "../prompt";
import { callVisionLLM, type LLMUsage } from "../llm";
import { computeCostUsd } from "../cost";
import { validateTranscript } from "../verify/transcribe-schema";
import { computePHash } from "../phash";
import { getActiveTranscribeModel } from "../models";
import type { Refusal, Transcript, Candidate } from "./types";

// Qat 1 üçün ucuz/sürətli model (ClickUp 86eykqb1c). ADR-023: `getActiveTranscribeModel`
// DB-dən (`public.app_config.active_transcribe_model`) oxuyur, boşdursa `TRANSCRIBE_MODEL`
// env-ə, o da yoxdursa `active_model`/`GEMINI_MODEL`-ə düşür — model seçimi AYRI taskdır
// və AYRI ölçmə tələb edir (OCR düzəliş nisbəti, transkripsiya təsdiq ekranı olmadan
// ölçülə bilmir).

// Şəkil-hash keşi (`0045`, `private.image_hash_cache`) HƏM DƏ Qat 1 üçün işlədilir — taskın
// açıq tələbi: "Şəkil hash-i üzrə qat 1 nəticəsini keşlə".
//
// DİQQƏT — AD SAHƏSİ (namespace): keşin PK-sı `(image_hash, selected_label)`-dir və monolit
// yol ORADA TAM LLM cavabını (steps + final_answer) saxlayır. Transkripsiyanı eyni açara
// yazsaydıq, monolit yol keşdən transkripsiya oxuyub onu "həll" kimi işlədərdi (steps boş,
// final_answer yox → səssiz `unreadable`). Ona görə Qat 1 açarı `t1|` ilə önlüklənir —
// miqrasiya tələb etmir, iki ad sahəsi bir cədvəldə toqquşmadan yaşayır.
function cacheKeyForTranscript(selectedLabel: string): string {
  return `t1|${selectedLabel}`;
}

export type TranscribeOutcome =
  // ADR-023: `model` — HƏQİQƏTƏN çağırılan (və ya keş-hitdə, çağırılACAQ) model ID-si.
  // Çağıran (`ocr_captures` yazısı) bunu birbaşa env-dən oxumaq əvəzinə buradan almalıdır.
  | { kind: "transcript"; transcript: Transcript; costUsd: number | null; latencyMs: number; usage: LLMUsage | null; cacheHit: boolean; imagePhash: string | null; model: string }
  | { kind: "refusal"; refusal: Refusal; costUsd: number | null; latencyMs: number; usage: LLMUsage | null; cacheHit: boolean; imagePhash: string | null; model: string }
  // Model/sxem uğursuzluğu — imtina DEYİL, XƏTA. Klientə "yenidən cəhd et" göstərilir.
  | { kind: "error"; timedOut: boolean };

type RawTranscript = {
  status?: string;
  reason?: string;
  canonical?: string;
  subject?: string;
  grade?: number;
  topic_code?: string;
  problem_type?: string;
  ocr_confidence?: string;
  detected_language?: string;
  has_figure?: boolean;
  candidates?: Candidate[];
};

const REFUSAL_STATUSES = new Set(["unreadable", "not_a_problem", "multiple_problems", "cut_off", "unsupported"]);

// Sxemdən keçmiş xam obyekti daxili tiplərə çevirir. Sxem `status='ok'` halında
// canonical/subject/grade/topic_code-u MƏCBURİ etdiyi üçün burada `!` təhlükəsizdir —
// yenə də müdafiə xətti kimi yoxlanılır (sxem faylı gələcəkdə yumşalarsa səssiz sınmasın).
export function interpretTranscript(raw: RawTranscript): { transcript: Transcript } | { refusal: Refusal } | null {
  const status = raw.status ?? "ok";

  if (status !== "ok") {
    if (!REFUSAL_STATUSES.has(status)) return null;
    const refusal: Refusal = {
      status: status as Refusal["status"],
      reason: typeof raw.reason === "string" ? raw.reason : "",
    };
    // `candidates` YALNIZ `multiple_problems`-də mənalıdır (ADR-007) — digər statuslarda
    // gəlsə ATILIR, çünki klient onu seçim ekranı kimi göstərərdi.
    if (status === "multiple_problems" && Array.isArray(raw.candidates) && raw.candidates.length > 0) {
      refusal.candidates = raw.candidates;
    }
    return { refusal };
  }

  if (!raw.canonical || !raw.subject || typeof raw.grade !== "number" || !raw.topic_code) return null;

  return {
    transcript: {
      canonical: raw.canonical,
      subject: raw.subject,
      grade: raw.grade,
      topicCode: raw.topic_code,
      problemType: raw.problem_type ?? null,
      ocrConfidence: raw.ocr_confidence ?? null,
      detectedLanguage: raw.detected_language ?? null,
      hasFigure: raw.has_figure === true,
    },
  };
}

export function imageSha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function transcribe(opts: {
  pool: Pool;
  imageBytes: Buffer;
  imageMime: string;
  imageHash: string;
  selectedLabel: string;
  grade: number;
  subject: string;
  locale: string;
  signal?: AbortSignal;
}): Promise<TranscribeOutcome> {
  const { pool, imageHash, selectedLabel } = opts;
  const cacheKey = cacheKeyForTranscript(selectedLabel);
  // ADR-023: keş-hit yolunda LLM çağırılmır, amma `model` yenə də DB/env-dən əvvəlcədən
  // oxunur ki, `TranscribeOutcome.model` HƏR iki qolda dolu olsun (OCR korpusunun `model`
  // sütunu izsiz qalmasın).
  const activeTranscribeModel = await getActiveTranscribeModel(pool);

  // ClickUp 86eymfgbv — pHash, best-effort. Deşifrə uğursuz olsa (korlanmış şəkil, dəstəklənməyən
  // format) `null` qalır — axtarış AVTOMATIK sha256-yalnız rejiminə düşür (RPC-nin öz defoltu),
  // axın HEÇ VAXT bunun üstündə BLOKLANMIR.
  const imagePhash = await computePHash(opts.imageBytes).catch((err) => {
    console.error("[cascade/transcribe] pHash hesablama xətası (sha256-yalnız keşə davam edilir):", err);
    return null;
  });

  // --- Keş: eyni foto TƏKRAR gəlsə (bayt-bayt) VƏ ya VİZUAL OXŞAR gəlsə (pHash Hamming ≤5)
  // vision çağırışı ATLANIR. Keş `private`-dədir, yalnız RPC ilə əlçatandır.
  const cached = await pool
    .query<{ reveal_cached_solve: RawTranscript | null }>(
      `select app.reveal_cached_solve($1, $2, $3) as reveal_cached_solve`,
      [imageHash, cacheKey, imagePhash]
    )
    .catch((err) => {
      console.error("[cascade/transcribe] keş oxuma xətası:", err);
      return null;
    });

  const cachedRaw = cached?.rows[0]?.reveal_cached_solve ?? null;
  if (cachedRaw) {
    const interpreted = interpretTranscript(cachedRaw);
    if (interpreted) {
      // Keş-hit: LLM çağırılmadı → xərc 0, gecikmə ~DB round-trip. `usage` `null` qalır ki,
      // token hesabatı saxta rəqəmlə çirklənməsin.
      return "transcript" in interpreted
        ? { kind: "transcript", transcript: interpreted.transcript, costUsd: 0, latencyMs: 0, usage: null, cacheHit: true, imagePhash, model: activeTranscribeModel }
        : { kind: "refusal", refusal: interpreted.refusal, costUsd: 0, latencyMs: 0, usage: null, cacheHit: true, imagePhash, model: activeTranscribeModel };
    }
    console.error("[cascade/transcribe] keşdəki obyekt oxunmadı, LLM-ə keçilir");
  }

  // --- LLM. Sxem pozulsa BİR dəfə təkrar (monolit yolun eyni qaydası).
  const { system, userTemplate } = loadTranscribeTemplates();
  const userPrompt = renderUserPrompt(userTemplate, opts.grade, opts.subject, opts.locale);
  const imageBase64 = opts.imageBytes.toString("base64");
  const model = activeTranscribeModel;

  let raw: RawTranscript | null = null;
  let usage: LLMUsage | null = null;
  let latencyMs = 0;
  let usedModel = model;

  for (let call = 1; call <= 2; call++) {
    if (opts.signal?.aborted) break;
    let result;
    try {
      result = await callVisionLLM({
        systemPrompt: system,
        userPrompt,
        imageBase64,
        imageMime: opts.imageMime,
        model,
        signal: opts.signal,
      });
    } catch (err) {
      if (opts.signal?.aborted) break;
      console.error(`[cascade/transcribe] LLM çağırışı xətası (cəhd ${call}):`, err);
      continue;
    }
    usage = result.usage;
    latencyMs = result.latencyMs;
    usedModel = result.model; // ADR-022: HƏQİQƏTƏN çağırılan model, təxmin yox

    const check = validateTranscript(result.parsed);
    if (check.valid) {
      raw = result.parsed as RawTranscript;
      break;
    }
    console.error(`[cascade/transcribe] sxem etibarsız (cəhd ${call}):`, check.errors, "xam çıxış:", result.rawText);
  }

  if (!raw) return { kind: "error", timedOut: opts.signal?.aborted === true };

  const interpreted = interpretTranscript(raw);
  if (!interpreted) {
    // Sxemdən keçdi, amma məna verə bilmədik (naməlum status, boş canonical) — bu, xam
    // çıxışın loga düşməsi lazım olan haldır, səssiz `unreadable` YOX.
    console.error("[cascade/transcribe] sxem keçdi, məna verilmədi:", JSON.stringify(raw).slice(0, 500));
    return { kind: "error", timedOut: false };
  }

  // Keşə YAZ — imtinalar da keşlənir (qəsdən): eyni bulanıq şəkil təkrar gəlsə ikinci dəfə
  // pul ödəməyə səbəb yoxdur, cavab dəyişməyəcək.
  await pool
    .query(`select app.store_cached_solve($1, $2, $3::jsonb, $4)`, [imageHash, cacheKey, JSON.stringify(raw), imagePhash])
    .catch((err) => console.error("[cascade/transcribe] keş yazı xətası:", err));

  const costUsd = computeCostUsd(usage, usedModel);

  return "transcript" in interpreted
    ? { kind: "transcript", transcript: interpreted.transcript, costUsd, latencyMs, usage, cacheHit: false, imagePhash, model: usedModel }
    : { kind: "refusal", refusal: interpreted.refusal, costUsd, latencyMs, usage, cacheHit: false, imagePhash, model: usedModel };
}
