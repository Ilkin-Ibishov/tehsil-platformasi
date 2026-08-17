import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
import { pool } from "@/lib/db";
import { loadPromptTemplates, renderUserPrompt, UnsupportedSubjectError } from "@/lib/prompt";
import { callVisionLLM } from "@/lib/llm";
import { computeCostUsd, sumCostUsd, billableOutputTokens, sumTokens } from "@/lib/cost";
import { getActiveModel } from "@/lib/models";
import { getBoolConfig } from "@/lib/app-config";
import { validateStep, STEP_SCHEMA_VERSION } from "@/lib/verify/schema";
import { verifyFinalAnswer } from "@/lib/verify/answer";
import { detectLeak } from "@/lib/verify/leak";
import { transcribe, imageSha256 } from "@/lib/cascade/transcribe";
import { buildLayers, runCascade } from "@/lib/cascade/run";
import { persistSolution } from "@/lib/cascade/persist";
import { computePHash } from "@/lib/phash";
import { writeOcrCapture, reserveCaptureId } from "@/lib/cascade/ocr-capture";
import { uploadCaptureImages } from "@/lib/storage";
import { isSoakInvite } from "@/lib/soak/mode";

// POST /api/solve — S3 (docs/PHASE-1.md). Server qaydaları:
// 1. verified=false həll istifadəçiyə göstərilmir → status:"unreadable".
// 2. Sxemə uyğun deyilsə bir dəfə təkrar cəhd, yenə olmasa unreadable. Xam çıxış server loguna.
// 3. Şəkil saxlanılmır — yalnız questions/question_translations/private.*/attempts/attempt_items yazılır.
// 4. selected_label verilibsə, yalnız o məsələ həll edilir.
//
// Dəvət kodu + gündəlik limit (30) — ADR-012: paylaşılan sirr (env), device_id üzrə limit.
//
// SYSTEM-REVIEW §C2 (HANDOFF 41): `maxDuration` YOX idi, latensiya 16.8 san — defolta çox
// yaxın, işləməsi TƏSADÜFƏ görə idi. İndi Vercel-ə 60 san büdcə verilir, LLM çağırışı özü
// ~45 san-da `AbortController`-lə kəsilir (15 san DB yazısı/cavab üçün buffer).
//
// ADR-019 §2.1: `problems`/`solutions`/`attempts` → `questions`/`question_translations`/
// `private.*` (`reveal_*`/`store_*` RPC-ləri, HANDOFF 71) / `attempts`(sessiya)+`attempt_items`.
// Bir solve indi İKİ sətir yazır (sessiya + item) — köhnə tək-sətir `attempts` INSERT-i YOXDUR.

const DAILY_LIMIT = 30;
export const maxDuration = 60;
const LLM_TIMEOUT_MS = 45_000;

// ADR-020 / ClickUp 86eykj7tu — kaskad interfeysi. **DEFOLT SÖNÜKDÜR.**
//
// Niyə bayraq arxasında: `ADR-014` bu memarlıq dəyişikliyi üçün ÖNCƏDƏN QEYD EDİLMİŞ ölçmə
// qapısı təyin edib (10 kəsilmiş şəkil, dəqiqlik ≥8/10, hallüsinasiya 0, xərc AZALSIN,
// triaj ≤6 san) və açıq yazıb: "Şərtlərin hamısı ödənilmirsə tək çağırış qalır. Ölçülmədən
// qərar verilmir." Həmin ölçmə real DİM şəkilləri + golden-set tələb edir — kod yazmaqla
// əvəz edilə bilməz. Eyni intizam HANDOFF 82-də qri-şkala üçün tətbiq edilib (defolt sönük,
// A/B təsdiqlənmədən açılmır).
//
// `CASCADE_ENABLED=1` → kaskad. Təyin edilməyibsə mövcud monolit yol, BAYT-BAYT dəyişməz.
// 2026-08-15: DB-yə köçürüldü (`public.app_config.cascade_enabled`, `ADR-023`-ün EYNİ nümunəsi
// — Ilkin-in tapşırığı, "hər şey env olmasın") — env DƏYƏRİ hələ də fallback kimi işləyir,
// DB sətri VARSA onu üstün tutur. Modul səviyyəsindən request-daxili oxumaya keçdi, çünki
// DB sorğusu asinxrondur (bax `POST`-un başında `getBoolConfig(...)`).

type StepSchemaOutput = {
  status?: string;
  reason?: string;
  canonical?: string;
  problem_type?: string;
  subject?: string;
  grade?: number;
  topic_code?: string;
  final_answer?: { latex: string; values: string[]; choice?: string };
  steps?: {
    index?: number;
    explanation?: string;
    error_code?: string;
    check?: { ask?: string; accept?: string[]; input_kind?: string };
  }[];
  [key: string]: unknown;
};

function normalizeCanonical(canonical: string): string {
  return canonical.trim().toLowerCase().replace(/\s+/g, " ");
}

function canonicalHash(canonical: string): string {
  return createHash("sha256").update(normalizeCanonical(canonical)).digest("hex");
}

function numericFingerprint(canonical: string): string {
  return (canonical.match(/\d+(\.\d+)?/g) ?? []).join(",");
}

// STEP-SCHEMA `check.accept` `private.step_answers`-ə köçür — public `steps` ondan
// AYRILIR (ADR-017/design.md §6: "check obyekti yalnız ask və input_kind saxlayır").
function stripAccept(steps: NonNullable<StepSchemaOutput["steps"]>) {
  return steps.map((step) => {
    const checkRest = { ...step.check } as Record<string, unknown>;
    delete checkRest.accept;
    return { ...step, check: checkRest };
  });
}

// `store_step_answers(q, rows)` gözlədiyi forma: [{step_index, accept, input_kind}, ...],
// yalnız `check.accept` olan addımlar üçün (design.md §7 — `0018`-dəki funksiya imzası).
function buildStepAnswerRows(steps: NonNullable<StepSchemaOutput["steps"]>) {
  return steps
    .filter((step) => Array.isArray(step.check?.accept) && typeof step.index === "number")
    .map((step) => ({
      step_index: step.index,
      accept: step.check!.accept,
      input_kind: step.check?.input_kind ?? "number",
    }));
}

// Telemetriya yazısı HEÇ VAXT axını bloklamamalıdır — `events` cədvəli ölçmədir, məhsul
// deyil. Uğursuzluq `console.error`-a düşür (HANDOFF 81-in `invite_redemption_failed`
// dərsi: səssiz uduş qəbuledilməzdir, amma şagirdin həllini də udmamalıdır).
async function logEvent(
  deviceId: string,
  attemptId: string | null,
  name: string,
  props: Record<string, unknown>
): Promise<void> {
  await pool
    .query(
      `insert into events (event_id, device_id, attempt_id, name, props)
       values ($1,$2,$3,$4,$5)`,
      [randomUUID(), deviceId, attemptId, name, JSON.stringify(props)]
    )
    .catch((err) => console.error(`[/api/solve] ${name} telemetriya xətası:`, err));
}

// S1 (86eymwght) / ADR-024 — hər iki monolit budaq (kaskad-daxili və köhnə tək-çağırışlı)
// eyni upload+insert ardıcıllığını paylaşır: id əvvəlcədən ayrılır (Storage path üçün),
// crop+raw yüklənir, sonra ocr_captures sətri storage sahələri ilə yazılır. Best-effort —
// xəta axını BLOKLAMIR (`writeOcrCapture`/`uploadCaptureImages`-in özləri artıq belədir).
async function captureAndStore(
  pool: import("pg").Pool,
  opts: {
    cropBytes: Buffer;
    cropMime: string;
    rawBytes: Buffer | null;
    rawMime: string | null;
    ocrRaw: string;
    imageSha256: string;
    imagePhash: string | null;
    model: string | null;
    latencyMs: number | null;
    costUsd: number | null;
  }
): Promise<void> {
  const captureId = reserveCaptureId();
  const uploaded = await uploadCaptureImages({
    idHint: captureId,
    cropBytes: opts.cropBytes,
    cropMime: opts.cropMime,
    rawBytes: opts.rawBytes,
    rawMime: opts.rawMime,
  });
  await writeOcrCapture(pool, {
    id: captureId,
    ocrRaw: opts.ocrRaw,
    imageSha256: opts.imageSha256,
    imagePhash: opts.imagePhash,
    model: opts.model,
    latencyMs: opts.latencyMs,
    costUsd: opts.costUsd,
    storagePath: uploaded?.storagePath ?? null,
    width: uploaded?.width ?? null,
    height: uploaded?.height ?? null,
    bytes: uploaded?.bytes ?? null,
  });
}

export async function POST(req: NextRequest) {
  const cascadeEnabled = await getBoolConfig(pool, "cascade_enabled", "CASCADE_ENABLED");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "form-data gözlənilir" }, { status: 400 });
  }

  const image = form.get("image");
  const imageRaw = form.get("image_raw"); // S1 (86eymwght) — orijinal kəsilməmiş kadr, ADR-024
  const deviceId = form.get("device_id");
  const clientAttemptId = form.get("attempt_id");
  const inviteCode = form.get("invite_code");
  const grade = Number(form.get("grade") ?? 11);
  const locale = String(form.get("locale") ?? "az");
  const subject = String(form.get("subject") ?? "math");
  const selectedLabel = form.get("selected_label");

  if (!(image instanceof Blob) || image.size === 0) {
    return NextResponse.json({ error: "image sahəsi yoxdur" }, { status: 400 });
  }
  if (typeof deviceId !== "string" || !deviceId) {
    return NextResponse.json({ error: "device_id sahəsi yoxdur" }, { status: 400 });
  }

  // 1) Dəvət kodu — SYSTEM-REVIEW §A3 (HANDOFF 41): əvvəllər TƏK paylaşılan sirr idi
  // (ADR-012), indi hər şagirdə FƏRDİ kod (`ilkin-01`...`ilkin-20`, `INVITE_CODES`-də vergüllə
  // ayrılıb) — kodun özü `student_ref` kimi yazılır, retensiya bunun üzrə hesablanır
  // (`device_id` ITP-yə görə sıfırlana bilir, retensiya qapısını sındırır — bax A3).
  const validInviteCodes = new Set(
    (process.env.INVITE_CODES ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
  );
  if (validInviteCodes.size === 0) {
    console.error("[/api/solve] INVITE_CODES env dəyişəni təyin edilməyib");
    return NextResponse.json({ error: "server konfiqurasiyası tamamlanmayıb" }, { status: 500 });
  }
  if (typeof inviteCode !== "string" || !validInviteCodes.has(inviteCode)) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 403 });
  }
  const studentRef = inviteCode;

  if (isSoakInvite(studentRef)) {
    return NextResponse.json({ error: "soak_use_cascade" }, { status: 503 });
  }

  // 1b) Dəvət açılışı (HANDOFF 81/82, S4/S5) — kodun bu (kod, cihaz) cütündə İLK dəfə
  // görüldüyünü qeyd edir. PK `(code, device_id)`-dir (0033) — `ON CONFLICT (code,
  // device_id) DO NOTHING`: EYNİ kodun EYNİ cihazdan TƏKRAR göndərilməsi no-op-dur, amma
  // FƏRQLİ cihaz (brauzer datası silinib/yeni telefon) HƏR ZAMAN öz sətrini alır — 0032-nin
  // tək-`code` PK-sı bunu udurdu, D1 retensiyasını yalan edirdi (0033-ün şərhi).
  // `invite_redeemed` YALNIZ həqiqi ilk sətirdə atılır.
  //
  // Bura sükutla uduldan xəta İMKANSIZ olmalıdır: insert uğursuz olsa (məs. `app_runtime`
  // grant-ı yenidən qırılsa, gate-78/T1 kimi), dəvət datası boş qalar və bu YALNIZ kohort
  // bitəndən sonra görünərdi. `console.error`-dan ƏLAVƏ `events`-ə `invite_redemption_failed`
  // yazılır ki, real-vaxt siqnal olsun — özü də uğursuz olsa belə axını BLOKLAMIR.
  try {
    const { rows: redemptionRows } = await pool.query<{ inserted: boolean }>(
      `insert into invite_redemptions (code, device_id)
       values ($1, $2)
       on conflict (code, device_id) do nothing
       returning true as inserted`,
      [inviteCode, deviceId]
    );
    if (redemptionRows.length > 0) {
      await pool
        .query(
          `insert into events (event_id, device_id, attempt_id, name, props)
           values ($1,$2,$3,'invite_redeemed',$4)`,
          [randomUUID(), deviceId, null, JSON.stringify({ code: inviteCode })]
        )
        .catch((err) => console.error("[/api/solve] invite_redeemed telemetriya xətası:", err));
    }
  } catch (err) {
    // Qeydiyyat yalnız ölçmədir — yazı uğursuz olsa da şagird həll almalıdır, amma
    // SƏSSİZ deyil: events-ə siqnal, o da uğursuz olsa console.error-a düşür.
    console.error("[/api/solve] invite_redemptions yazı xətası:", err);
    await pool
      .query(
        `insert into events (event_id, device_id, attempt_id, name, props)
         values ($1,$2,$3,'invite_redemption_failed',$4)`,
        [
          randomUUID(),
          deviceId,
          null,
          JSON.stringify({ code: inviteCode, error: err instanceof Error ? err.message : String(err) }),
        ]
      )
      .catch((eventErr) => console.error("[/api/solve] invite_redemption_failed telemetriya xətası:", eventErr));
  }

  // 2) Gündəlik limit — YALNIZ çatdırılmış (delivered=true) həllər sayılır (S5 invariantı).
  // `delivered`/`created_at` indi `attempt_items`-dədir (ADR-018 §3a), `device_id` sessiya
  // cədvəlində (`attempts`) qalır — JOIN lazımdır.
  //
  // `a.kind = 'photo_solve'` — ClickUp 86eykhve0 (bank UI): DAILY_LIMIT-in STATED məqsədi
  // LLM xərcini məhdudlaşdırmaqdır (SYSTEM-REVIEW §C1). Bank sualları (`kind='bank_practice'`,
  // `web/app/api/bank/start/route.ts`) SIFIR LLM xərci daşıyır — eyni sayğaca qatmaq bank
  // təcrübəsini kamera büdcəsindən ÇALARDI. `web/lib/cascade/guards.ts::checkDailyLimit`-lə
  // EYNİ filtr (monolit "bayt-bayt dəyişməz" qaydasına pHash-lə EYNİ sinif istisna —
  // sayğacın öz STATED məqsədini düzəldir, davranışı özbaşına genişləndirmir).
  const { rows: limitRows } = await pool.query(
    `select count(*)::int as c
       from attempt_items ai
       join attempts a on a.id = ai.attempt_id
      where a.device_id = $1 and ai.delivered = true and a.kind = 'photo_solve'
        and ai.created_at >= date_trunc('day', now())`,
    [deviceId]
  );
  const dailyCount = limitRows[0]?.c ?? 0;
  if (dailyCount >= DAILY_LIMIT) {
    await pool
      .query(
        `insert into events (event_id, device_id, attempt_id, name, props)
         values ($1,$2,$3,'limit.blocked',$4)`,
        [randomUUID(), deviceId, typeof clientAttemptId === "string" ? clientAttemptId : null, JSON.stringify({ daily_count: dailyCount })]
      )
      .catch((err) => console.error("[/api/solve] limit.blocked telemetriya xətası:", err));
    return NextResponse.json({ error: "limit_reached", daily_count: dailyCount }, { status: 429 });
  }

  // 2b) Qlobal gündəlik xərc tavanı (SYSTEM-REVIEW §C1) — device_id limitindən AYRI: dəvət kodu
  // paylaşılan sirrdir, device_id sıfırlana bilir, yəni tək cihazlıq limit sızmış koda qarşı
  // qorumur. `DAILY_COST_CEILING_USD` təyin edilməyibsə tavan yoxdur (dev defolt).
  //
  // `cost_usd` `attempt_items`-dən oxunur, `question_translations`-dan YOX (`0023`) —
  // LLM HƏR solve-da çağırılır (keş-hit/miss fərq etmir), amma `question_translations`
  // yalnız keş-miss-də YENİ sətir alır (`(question_id,lang)` PK-si ikinci 'az' tərcüməsinə
  // icazə vermir). `question_translations.cost_usd`-a güvənsək, keş-hit sorğularının xərci
  // heç yerdə görünməzdi və tavan səssizcə az hesablanardı.
  const dailyCeiling = Number(process.env.DAILY_COST_CEILING_USD);
  if (Number.isFinite(dailyCeiling) && dailyCeiling > 0) {
    const { rows: costRows } = await pool.query(
      `select coalesce(sum(cost_usd), 0)::float8 as total from attempt_items
       where created_at >= date_trunc('day', now())`
    );
    const dailyCostUsd = costRows[0]?.total ?? 0;
    if (dailyCostUsd >= dailyCeiling) {
      await pool
        .query(
          `insert into events (event_id, device_id, attempt_id, name, props)
           values ($1,$2,$3,'cost.ceiling_hit',$4)`,
          [randomUUID(), deviceId, typeof clientAttemptId === "string" ? clientAttemptId : null, JSON.stringify({ daily_cost_usd: dailyCostUsd, ceiling_usd: dailyCeiling })]
        )
        .catch((err) => console.error("[/api/solve] cost.ceiling_hit telemetriya xətası:", err));
      return NextResponse.json({ error: "limit_reached", daily_count: dailyCount }, { status: 429 });
    }
  }

  // Klient telemetriya ID-si (aşağıda sessiya PK-sı kimi işlədilir) — kaskad yolu da onu
  // istifadə etdiyi üçün BURADA, budaqlanmadan ƏVVƏL hesablanır.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const sessionId = typeof clientAttemptId === "string" && UUID_RE.test(clientAttemptId) ? clientAttemptId : randomUUID();

  // ══════════════════════════════════════════════════════════════════════════════════════
  // 3-KASKAD) ADR-020 yolu — Qat 1 (transkripsiya) → Qat 2 (bank) → Qat 5 (mətn LLM).
  // Defolt SÖNÜKDÜR (bax `CASCADE_ENABLED` şərhi). Bu budaq `return` edir, yəni aşağıdaki
  // monolit yol bayraq sönükdə BAYT-BAYT dəyişməz qalır.
  // ══════════════════════════════════════════════════════════════════════════════════════
  if (cascadeEnabled) {
    const cascadeBytes = Buffer.from(await image.arrayBuffer());
    const cascadeHash = imageSha256(cascadeBytes);
    const label = typeof selectedLabel === "string" && selectedLabel ? selectedLabel : "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    try {
      // ── Qat 1 — ŞƏKLİ GÖRƏN YEGANƏ ÇAĞIRIŞ ───────────────────────────────────────────
      const t1 = await transcribe({
        pool,
        imageBytes: cascadeBytes,
        imageMime: image.type || "image/jpeg",
        imageHash: cascadeHash,
        selectedLabel: label,
        grade,
        subject,
        locale,
        signal: controller.signal,
      });

      if (t1.kind === "error") {
        if (t1.timedOut) {
          await logEvent(deviceId, sessionId, "solve.timeout", { timeout_ms: LLM_TIMEOUT_MS, stage: "transcribe" });
        }
        return NextResponse.json(
          { schema_version: STEP_SCHEMA_VERSION, status: "unreadable", reason: "Server cavab vermədi, yenidən cəhd et." },
          { status: 200 }
        );
      }

      // Qat 1-in rədd qapısı. DB-yə HEÇ NƏ yazılmır (PHASE-1: yalnız çatdırılmış həll düşür),
      // gündəlik limit SAYĞACI da artmır (ADR-007: imtina/seçim limitdən sayılmır).
      // Bahalı Qat 5 çağırışı ÜMUMİYYƏTLƏ icra olunmur — ADR-014-ün "iki dəfə ödənilir"
      // problemi məhz burada həll olunur.
      if (t1.kind === "refusal") {
        await logEvent(deviceId, sessionId, "solve.cascade", {
          layer: "transcribe_refusal",
          status: t1.refusal.status,
          transcribe_cache_hit: t1.cacheHit,
          transcribe_cost_usd: t1.costUsd,
          transcribe_latency_ms: Math.round(t1.latencyMs),
        });
        return NextResponse.json(
          {
            schema_version: STEP_SCHEMA_VERSION,
            status: t1.refusal.status,
            reason: t1.refusal.reason,
            ...(t1.refusal.candidates ? { candidates: t1.refusal.candidates } : {}),
            attempt_id: null,
            match_path: t1.cacheHit ? "image_cache" : "llm",
          },
          { status: 200 }
        );
      }

      // S1 (86eymwght) — uğurlu transkripsiya, ADR-024. `image_raw` bura da (kaskad-daxili
      // monolit budaq) çatır — `/api/solve/transcribe`-in eyni davranışı, imtinalar YOX.
      await captureAndStore(pool, {
        cropBytes: cascadeBytes,
        cropMime: image.type || "image/jpeg",
        rawBytes: imageRaw instanceof Blob && imageRaw.size > 0 ? Buffer.from(await imageRaw.arrayBuffer()) : null,
        rawMime: imageRaw instanceof Blob ? imageRaw.type || "image/jpeg" : null,
        ocrRaw: t1.transcript.canonical,
        imageSha256: cascadeHash,
        imagePhash: t1.imagePhash,
        model: t1.model || null,
        latencyMs: Math.round(t1.latencyMs),
        costUsd: t1.costUsd,
      }).catch((err) => console.error("[/api/solve] capture/storage xətası (kaskad budağı):", err));

      // ── Qat 2..5 — şəkil ARTIQ YOXDUR, yalnız mətn ────────────────────────────────────
      let solution;
      let declinedLayers: string[];
      try {
        ({ solution, declinedLayers } = await runCascade(buildLayers(pool), {
          transcript: t1.transcript,
          locale,
          requestedGrade: grade,
          requestedSubject: subject,
          signal: controller.signal,
          strictSubject: await getBoolConfig(pool, "prompt_strict_subject", "PROMPT_STRICT_SUBJECT"),
          logEvent: (name, props) => logEvent(deviceId, sessionId, name, props),
        }));
      } catch (err) {
        if (err instanceof UnsupportedSubjectError) {
          return NextResponse.json(
            { schema_version: STEP_SCHEMA_VERSION, status: "unsupported", reason: "Bu fənn hələ dəstəklənmir." },
            { status: 200 }
          );
        }
        throw err;
      }

      if (!solution) {
        await logEvent(deviceId, sessionId, "solve.cascade", {
          layer: "none",
          declined: declinedLayers.join(","),
          transcribe_cache_hit: t1.cacheHit,
          transcribe_cost_usd: t1.costUsd,
        });
        return NextResponse.json(
          { schema_version: STEP_SCHEMA_VERSION, status: "unreadable", reason: "Həll qurula bilmədi, yenidən cəhd et." },
          { status: 200 }
        );
      }

      const totalCostUsd = sumCostUsd(t1.costUsd, solution.costUsd);
      const persisted = await persistSolution({
        pool,
        solution,
        transcript: t1.transcript,
        sessionId,
        deviceId,
        studentRef,
        requestedSubject: subject,
        locale,
        totalCostUsd,
      });

      if (!persisted.ok) {
        return NextResponse.json(
          {
            schema_version: STEP_SCHEMA_VERSION,
            status: "unreadable",
            reason:
              persisted.kind === "rejected"
                ? "Həll yoxlanışdan keçmədi."
                : "Server xətası, yenidən cəhd et.",
          },
          { status: 200 }
        );
      }

      // Qat paylanması — taskın açıq tələbi ("hansı qatın cavab verdiyini events-ə yaz").
      // Ölçülməsə hansı qata investisiya etmək lazım olduğu heç vaxt bilinməyəcək.
      await logEvent(deviceId, sessionId, "solve.cascade", {
        layer: solution.layer,
        match_path: solution.matchPath,
        declined: declinedLayers.join(","),
        transcribe_cache_hit: t1.cacheHit,
        transcribe_cost_usd: t1.costUsd,
        transcribe_latency_ms: Math.round(t1.latencyMs),
        layer_cost_usd: solution.costUsd,
        layer_latency_ms: Math.round(solution.latencyMs),
        total_cost_usd: totalCostUsd,
        has_figure: t1.transcript.hasFigure,
        ocr_confidence: t1.transcript.ocrConfidence,
      });

      return NextResponse.json(
        {
          schema_version: STEP_SCHEMA_VERSION,
          status: "ok",
          // `canonical` klientə QAYTARILIR — transkripsiya təsdiq ekranının (ClickUp
          // 86eykj7x2) girişi budur. O task UI-ı əlavə edəndə server tərəfi HAZIRDIR.
          canonical: t1.transcript.canonical,
          subject: t1.transcript.subject,
          grade: t1.transcript.grade,
          topic_code: t1.transcript.topicCode,
          ...(t1.transcript.problemType ? { problem_type: t1.transcript.problemType } : {}),
          ...(t1.transcript.ocrConfidence ? { ocr_confidence: t1.transcript.ocrConfidence } : {}),
          ...(t1.transcript.detectedLanguage ? { detected_language: t1.transcript.detectedLanguage } : {}),
          // `final_answer` və `check.accept` ŞƏBƏKƏYƏ DÜŞMÜR (SYSTEM-REVIEW §2) — addım
          // yoxlaması `/api/steps/check`, son cavab `/api/attempts/reveal`-dədir.
          steps: persisted.steps,
          attempt_id: persisted.sessionId,
          match_path: solution.matchPath,
          verification: { ...persisted.verification, verified_at: new Date().toISOString() },
          meta: {
            latency_ms: Math.round(t1.latencyMs + solution.latencyMs),
            cost_usd: totalCostUsd,
            tokens_in: sumTokens(t1.usage?.prompt_tokens, solution.usage?.prompt_tokens),
            tokens_out: sumTokens(billableOutputTokens(t1.usage), billableOutputTokens(solution.usage)),
            attempts: 1,
            leaked: persisted.leaked,
            layer: solution.layer,
          },
        },
        { status: 200 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 3) Prompt — TƏK MƏNBƏ prompts/solve-step.md-dən (ADR-012).
  const loaded = loadPromptTemplates({ subject });
  if (loaded.fallbackUsed) {
    await logEvent(deviceId, sessionId, "prompt.subject_fallback", {
      requested_subject: loaded.requestedSubject,
      used_subject: "math",
    });
    if (await getBoolConfig(pool, "prompt_strict_subject", "PROMPT_STRICT_SUBJECT")) {
      return NextResponse.json(
        { schema_version: STEP_SCHEMA_VERSION, status: "unsupported", reason: "Bu fənn hələ dəstəklənmir." },
        { status: 200 }
      );
    }
  }
  const { system, userTemplate } = loaded;
  let userPrompt = renderUserPrompt(userTemplate, grade, subject, locale);
  if (typeof selectedLabel === "string" && selectedLabel) {
    userPrompt += `\n\nYalnız "${selectedLabel}" etiketli/nömrəli məsələni həll et, kadrdakı digərlərini görməzdən gəl.`;
  }

  const imageBytes = Buffer.from(await image.arrayBuffer());
  const imageHash = createHash("sha256").update(imageBytes).digest("hex");
  const imageBase64 = imageBytes.toString("base64");
  const imageMime = image.type || "image/jpeg";
  // Eyni foto (byte-byte) selected_label-a görə FƏRQLİ nəticə verə bilər (çoxməsələli
  // kadrda aşkarlama-yalnız vs. seçilmiş məsələnin həlli) — keş açarı hər ikisini əhatə edir.
  const cacheKey = typeof selectedLabel === "string" && selectedLabel ? selectedLabel : "";

  // ClickUp 86eymfgbv (pHash) — ADR-020-nin "monolit bayt-bayt dəyişməz qalır" qaydasına
  // QƏSDƏN İSTİSNA: bu qayda kaskad SPLİTİNİN (CASCADE_ENABLED) risk idarəsi üçün idi, pHash
  // isə HAZIRKI YEGANƏ CANLI yolun (bu route) öz keş dəyərini artırır — kaskad hələ bayraq
  // arxasındadır, ona görə bura toxunmasaydıq tapşırığın "ən yüksək ROI" faydası HEÇ VAXT
  // real istifadəçiyə çatmazdı. Dəyişiklik ƏLAVƏLİDİR (yeni parametr, defolt NULL) — sxem
  // pozulmur, `reveal`/`store` RPC-ləri geriyə-uyğundur (bax `0054`/`0055`).
  const imagePhash = await computePHash(imageBytes).catch((err) => {
    console.error("[/api/solve] pHash hesablama xətası (sha256-yalnız keşə davam edilir):", err);
    return null;
  });

  let parsed: StepSchemaOutput | null = null;
  let usage = null;
  let latencyMs = 0;
  let attempts = 0;
  let cacheHit = false;
  let timedOut = false;
  // ADR-023: model artıq DB-dən (`public.app_config.active_model`) oxunur, redeploy tələb
  // etmir — `getActiveModel` sadəcə DB sətri yoxdursa/DB əlçatmazdırsa `GEMINI_MODEL`-ə düşür.
  const activeModel = await getActiveModel(pool);
  let usedModel = activeModel; // ADR-022: HƏQİQƏTƏN çağırılan model

  // Şəkil-hash keşi (HANDOFF 81, ClickUp): eyni şəkil TƏKRAR gəlsə (şəbəkə xətasından sonra
  // retry, ikiqat toxunma) VƏ ya VİZUAL OXŞAR gəlsə (pHash Hamming ≤5, ClickUp 86eymfgbv)
  // real LLM çağırışı ATLANIR. Keş `private` sxemində, YALNIZ bu 2 RPC ilə əlçatandır
  // (bax `0045`-in şərhi) — cavab burada saxlanır, adi `SELECT`-lə YOX.
  const { rows: cacheRows } = await pool.query<{ reveal_cached_solve: StepSchemaOutput | null }>(
    `select app.reveal_cached_solve($1, $2, $3) as reveal_cached_solve`,
    [imageHash, cacheKey, imagePhash]
  );
  if (cacheRows[0]?.reveal_cached_solve) {
    parsed = cacheRows[0].reveal_cached_solve;
    cacheHit = true;
  } else {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), LLM_TIMEOUT_MS);
    try {
      for (let call = 1; call <= 2; call++) {
        if (timeoutController.signal.aborted) break;
        let result;
        try {
          result = await callVisionLLM({ systemPrompt: system, userPrompt, imageBase64, imageMime, model: activeModel, signal: timeoutController.signal });
        } catch (err) {
          if (timeoutController.signal.aborted) break;
          console.error(`[/api/solve] LLM çağırışı xətası (cəhd ${call}):`, err);
          continue;
        }
        usage = result.usage;
        latencyMs = result.latencyMs;
        attempts = result.attempts;
        usedModel = result.model;

        const check = validateStep(result.parsed);
        if (check.valid) {
          parsed = result.parsed as StepSchemaOutput;
          break;
        }
        console.error(`[/api/solve] sxem etibarsız (cəhd ${call}):`, check.errors, "xam çıxış:", result.rawText);
      }
    } finally {
      clearTimeout(timeoutId);
    }
    timedOut = timeoutController.signal.aborted;

    if (parsed) {
      await pool
        .query(`select app.store_cached_solve($1, $2, $3::jsonb, $4)`, [imageHash, cacheKey, JSON.stringify(parsed), imagePhash])
        .catch((err) => console.error("[/api/solve] image_hash_cache yazı xətası:", err));
    }
  }

  if (!parsed) {
    if (timedOut) {
      await pool
        .query(
          `insert into events (event_id, device_id, attempt_id, name, props)
           values ($1,$2,$3,'solve.timeout',$4)`,
          [randomUUID(), deviceId, typeof clientAttemptId === "string" ? clientAttemptId : null, JSON.stringify({ timeout_ms: LLM_TIMEOUT_MS })]
        )
        .catch((err) => console.error("[/api/solve] solve.timeout telemetriya xətası:", err));
      return NextResponse.json(
        { schema_version: STEP_SCHEMA_VERSION, status: "unreadable", reason: "Server cavab vermədi, yenidən cəhd et." },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { schema_version: STEP_SCHEMA_VERSION, status: "unreadable", reason: "Server xətası, yenidən cəhd et." },
      { status: 200 }
    );
  }

  // status != "ok" → imtina/seçim, yoxlama və DB yazısı yoxdur (PHASE-1: yalnız çatdırılmış həll DB-yə düşür).
  if (parsed.status && parsed.status !== "ok") {
    return NextResponse.json({ ...parsed, attempt_id: null, match_path: cacheHit ? "image_cache" : "llm" }, { status: 200 });
  }

  const finalAnswer = parsed.final_answer;
  if (!parsed.canonical || !finalAnswer) {
    return NextResponse.json(
      { schema_version: STEP_SCHEMA_VERSION, status: "unreadable", reason: "Həll natamamdır." },
      { status: 200 }
    );
  }

  // S1 (86eymwght) / ADR-024 — BURADA, `verified===false` rədd budağından ƏVVƏL: blok 95-in
  // şikayəti məhz "yoxlanışdan keçmiş, amma yanlış görünən" bir həll idi — sübut YALNIZ
  // hansısa nəticə şagirdə çatanda deyil, model canonical/steps çıxardığı HƏR halda lazımdır.
  // `ocr_raw`/`ocr_final` eyni dəyərdir (monolit yolda ayrı təsdiq mərhələsi yoxdur).
  const imageRawBytes =
    imageRaw instanceof Blob && imageRaw.size > 0 ? Buffer.from(await imageRaw.arrayBuffer()) : null;
  await captureAndStore(pool, {
    cropBytes: imageBytes,
    cropMime: imageMime,
    rawBytes: imageRawBytes,
    rawMime: imageRaw instanceof Blob ? imageRaw.type || "image/jpeg" : null,
    ocrRaw: parsed.canonical,
    imageSha256: imageHash,
    imagePhash,
    model: usedModel || null,
    latencyMs: Math.round(latencyMs),
    costUsd: computeCostUsd(usage, usedModel),
  }).catch((err) => console.error("[/api/solve] capture/storage xətası (monolit budaq):", err));

  const { verified, reason: verificationReason, method: verificationMethod } = verifyFinalAnswer(
    parsed.canonical,
    finalAnswer.values,
    parsed.subject ?? subject,
  );
  const leaked = detectLeak(parsed.steps ?? [], finalAnswer.values);

  // Server qaydası 1 (PHASE-1): verified=false göstərilmir. AMMA `verified` üç haldır
  // (true/false/null) — `null` "TƏKZİB EDİLMƏDİ, sadəcə yoxlanıla bilmədi" deməkdir (canonical
  // tək-dəyişənli tənlik deyil — söz məsələsi, parametr, ehtimal və s.). Bunu `false` kimi
  // rədd etmək canlı sınaqda tapıldı (ADR-012 yeniləməsi): `equationCrossCheck` YALNIZ tək
  // dəyişənli tənliklər üçün işləyir, bu, `scripts/lib/verify.py`-ın öz production yolunda da
  // eynidir (yoxlandı) — TS portunun yaratdığı bug deyil. Yalnız QƏTİ ZİDDİYYƏT (`false`) gizlədilir.
  if (verified === false) {
    return NextResponse.json(
      { schema_version: STEP_SCHEMA_VERSION, status: "unreadable", reason: "Həll yoxlanışdan keçmədi." },
      { status: 200 }
    );
  }

  // verified === true → mathjs təsdiqlədi. verified === null → yoxlanıla bilmədi, model
  // çıxışına etibar edilir (STEP-SCHEMA verification.method="none" məhz bunun üçündür).
  const reviewStatus = verified === true ? "auto_verified" : "draft";
  const costUsd = computeCostUsd(usage, usedModel);
  // Klient telemetriya üçün bu ID-ni artıq kamera ekranı açılanda yaradıb (lib/telemetry
  // setAttemptId) — həmin ID-ni burada SESSİYA (`attempts`) sətrinin PK-sı kimi işlədirik ki,
  // S4-də "son addıma çatdı" yeniləməsi (/api/attempts/progress) əlavə round-trip data
  // saxlamadan bu sətri tapa bilsin. Format etibarsızdırsa (köhnə klient, boş sahə) server öz
  // ID-sini yaradır. `attempt_items.id` isə HƏMİŞƏ server-generasiyalıdır (aşağıda).
  // (`sessionId` yuxarıda, kaskad budağından ƏVVƏL hesablanır — hər iki yol onu paylaşır.)
  const itemId = randomUUID();
  const hash = canonicalHash(parsed.canonical);
  const fingerprint = numericFingerprint(parsed.canonical);
  const effectiveGrade = parsed.grade ?? grade;
  const effectiveSubject = parsed.subject ?? subject;
  const stepsForStorage = parsed.steps ?? [];
  let servedSteps = stripAccept(stepsForStorage);

  const client = await pool.connect();
  let questionId: string;
  try {
    await client.query("begin");

    // `subjects` STEP-SCHEMA-nın 3 dəyərindən seedlənib (`0012`) — enum bağlı olduğu üçün
    // (LLM çıxışı `validateStep`-dən keçib) tapılmamalı deyil, amma müdafiə xətti kimi yoxlanır.
    const subjectRows = await client.query<{ id: string }>(
      `select id from subjects where code = $1`,
      [effectiveSubject]
    );
    if (subjectRows.rows.length === 0) {
      throw new Error(`naməlum subject kodu: ${effectiveSubject}`);
    }
    const subjectId = subjectRows.rows[0].id;

    // Dedup: `questions_dedup_idx` (canonical_hash, subject_id, grade) — ADR-018 §1d/design.md
    // §5. Sadə `canonical_hash` axtarışı ARTIQ KİFAYƏT DEYİL, eyni hash fərqli sinif üçün
    // ayrı sətir ola bilər (HANDOFF 70-in daimi qaydası). Fingerprint unikallığı da eyni
    // üçlükdədir — hash miss + fingerprint hit olanda INSERT 500 verməsin deyə reuse.
    let existing = await client.query<{ id: string }>(
      `select id from questions
        where canonical_hash = $1 and subject_id = $2 and grade = $3
          and superseded_by is null and deleted_at is null`,
      [hash, subjectId, effectiveGrade]
    );
    if (existing.rows.length === 0 && fingerprint) {
      existing = await client.query<{ id: string }>(
        `select id from questions
          where numeric_fingerprint = $1 and subject_id = $2 and grade = $3
            and superseded_by is null and deleted_at is null`,
        [fingerprint, subjectId, effectiveGrade]
      );
    }

    if (existing.rows.length > 0) {
      questionId = existing.rows[0].id;
      await client.query(
        `update questions set hit_count = hit_count + 1, attempt_count = attempt_count + 1 where id = $1`,
        [questionId]
      );
      // persist.ts ilə eyni: insert-only step_answers köhnə sətrə bağlıdır — yeni
      // bölgünü göstərmək uydurma error_code yazardı (Qızıl qayda).
      const stored = await client.query<{ steps: typeof servedSteps | null }>(
        `select steps from question_translations where question_id = $1 and lang = 'az'`,
        [questionId]
      );
      const storedSteps = stored.rows[0]?.steps;
      if (Array.isArray(storedSteps) && storedSteps.length > 0) {
        servedSteps = storedSteps;
      }
    } else {
      questionId = randomUUID();
      // ADR-003 Ləğv (2026-08-14) / S8 (86eymwgmv): Ilkin-in qəti qərarı ilə `canonical`
      // artıq BOŞALDILMIR (bax `lib/cascade/persist.ts`-in eyni dəyişikliyi, monolit yol
      // eyni qərarı təkrarlayır). Keş davranışı DƏYİŞMİR.
      await client.query(
        `insert into questions
           (id, canonical, canonical_hash, numeric_fingerprint, problem_type, subject_id,
            grade, topic_code, type, payload, difficulty_static, source, review_status,
            attempt_count, root_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'open','{}'::jsonb,3,'user_capture',$9,1,$1)`,
        [
          questionId,
          parsed.canonical,
          hash,
          fingerprint,
          parsed.problem_type ?? null,
          subjectId,
          effectiveGrade,
          parsed.topic_code ?? null,
          reviewStatus,
        ]
      );

      const publicSteps = stripAccept(stepsForStorage);
      await client.query(
        `insert into question_translations
           (question_id, lang, stem, steps, verified, verification_method, verification_reason, model, cost_usd)
         values ($1,'az',$2,$3,$4,$5,$6,$7,$8)`,
        [
          questionId,
          JSON.stringify({ blocks: [{ t: "text", v: parsed.canonical }] }),
          JSON.stringify(publicSteps),
          verified === true,
          verificationMethod,
          verificationReason,
          usedModel || null,
          costUsd,
        ]
      );

      // G1 (HANDOFF 71): `app_runtime`-in `private`-ə birbaşa yazı icazəsi yoxdur — YALNIZ
      // bu iki RPC. İkisi də insert-only (`ON CONFLICT DO NOTHING`) — eyni `question_id`-yə
      // ikinci çağırış səssiz no-op-dır (bu budaq elə YENİ `questionId` üçündür, ona görə
      // praktikada həmişə uğurlu olmalıdır; `false`/`0` qayıtsa DB-daxili tutarsızlıqdır).
      //
      // HANDOFF (79) / gate-78: `store_answer`/`store_step_answers` `app` sxeminə köçüb —
      // `public`-də olanda `anon`/`authenticated` `EXECUTE` ala bilirdi (bax
      // `attempts/reveal/route.ts`-in şərhi, eyni sinif zəiflik — burada isə YAZI, yəni
      // istənilən adam bankı özü bildiyi "cavabla" korlaya bilərdi).
      await client.query(`select app.store_answer($1, $2::jsonb, 'exact')`, [
        questionId,
        JSON.stringify(finalAnswer),
      ]);
      const stepAnswerRows = buildStepAnswerRows(stepsForStorage);
      if (stepAnswerRows.length > 0) {
        await client.query(`select app.store_step_answers($1, $2::jsonb)`, [
          questionId,
          JSON.stringify(stepAnswerRows),
        ]);
      }
    }

    // Sessiya (bir "solve" = bir sessiya, Faza 1-də) + item (bir sessiyada bir sual).
    await client.query(
      `insert into attempts (id, device_id, student_ref, kind, started_at, client_created_at)
       values ($1,$2,$3,'photo_solve',now(),now())`,
      [sessionId, deviceId, studentRef]
    );
    await client.query(
      `insert into attempt_items
         (id, attempt_id, question_id, match_path, ocr_source, delivered, steps_total, cost_usd)
       values ($1,$2,$3,'llm','vision_llm',true,$4,$5)`,
      [itemId, sessionId, questionId, stepsForStorage.length, costUsd]
    );

    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    console.error("[/api/solve] DB yazı xətası:", err);
    return NextResponse.json(
      { schema_version: STEP_SCHEMA_VERSION, status: "unreadable", reason: "Server xətası, yenidən cəhd et." },
      { status: 200 }
    );
  } finally {
    client.release();
  }

  // SYSTEM-REVIEW §2 (HANDOFF 45): `...parsed` əvvəllər TAM LLM çıxışını qaytarırdı — hər
  // addımın `check.accept`-i və `final_answer` şagird birinci addıma cavab verməzdən əvvəl
  // brauzerdə idi. DB-yə yazılan `question_translations`/`private.*` (yuxarıda) TAM qalır —
  // yalnız ŞƏBƏKƏ cavabından çıxarılır. Addım yoxlaması indi `/api/steps/check`-dədir (§B1-dəki
  // eyni normallaşdırma), son cavab `/api/attempts/reveal`-dədir. `error_code`/`hint` BURADA
  // qalır — bunlar cavabı açmır, yalnız səhv edildikdə göstərilən diaqnoz mətnidir.
  const clientSteps = servedSteps;
  const parsedWithoutAnswers: Record<string, unknown> = { ...parsed };
  delete parsedWithoutAnswers.final_answer;
  delete parsedWithoutAnswers.steps;

  return NextResponse.json(
    {
      ...parsedWithoutAnswers,
      steps: clientSteps,
      attempt_id: sessionId,
      match_path: cacheHit ? "image_cache" : "llm",
      // S5 (86eymwgkv) — ƏVVƏLLƏR HƏMİŞƏ `verified: true` idi (`verificationMethod`='none'
      // olanda BELƏ) — klient sympy təsdiqi ilə "yoxlanılmadı" halını ayırd edə bilmirdi.
      verification: { verified, method: verificationMethod, reason: verificationReason, verified_at: new Date().toISOString() },
      meta: {
        latency_ms: Math.round(latencyMs),
        cost_usd: costUsd,
        tokens_in: usage?.prompt_tokens ?? null,
        tokens_out: billableOutputTokens(usage),
        attempts,
        leaked,
      },
    },
    { status: 200 }
  );
}
