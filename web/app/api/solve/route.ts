import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
import { pool } from "@/lib/db";
import { loadPromptTemplates, renderUserPrompt } from "@/lib/prompt";
import { callVisionLLM } from "@/lib/llm";
import { computeCostUsd } from "@/lib/cost";
import { validateStep } from "@/lib/verify/schema";
import { verifyFinalAnswer } from "@/lib/verify/answer";
import { detectLeak } from "@/lib/verify/leak";

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

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "form-data gözlənilir" }, { status: 400 });
  }

  const image = form.get("image");
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

  // 2) Gündəlik limit — YALNIZ çatdırılmış (delivered=true) həllər sayılır (S5 invariantı).
  // `delivered`/`created_at` indi `attempt_items`-dədir (ADR-018 §3a), `device_id` sessiya
  // cədvəlində (`attempts`) qalır — JOIN lazımdır.
  const { rows: limitRows } = await pool.query(
    `select count(*)::int as c
       from attempt_items ai
       join attempts a on a.id = ai.attempt_id
      where a.device_id = $1 and ai.delivered = true and ai.created_at >= date_trunc('day', now())`,
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

  // 3) Prompt — TƏK MƏNBƏ prompts/solve-step.md-dən (ADR-012).
  const { system, userTemplate } = loadPromptTemplates();
  let userPrompt = renderUserPrompt(userTemplate, grade, subject, locale);
  if (typeof selectedLabel === "string" && selectedLabel) {
    userPrompt += `\n\nYalnız "${selectedLabel}" etiketli/nömrəli məsələni həll et, kadrdakı digərlərini görməzdən gəl.`;
  }

  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  const imageMime = image.type || "image/jpeg";

  let parsed: StepSchemaOutput | null = null;
  let usage = null;
  let latencyMs = 0;
  let attempts = 0;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), LLM_TIMEOUT_MS);
  try {
    for (let call = 1; call <= 2; call++) {
      if (timeoutController.signal.aborted) break;
      let result;
      try {
        result = await callVisionLLM({ systemPrompt: system, userPrompt, imageBase64, imageMime, signal: timeoutController.signal });
      } catch (err) {
        if (timeoutController.signal.aborted) break;
        console.error(`[/api/solve] LLM çağırışı xətası (cəhd ${call}):`, err);
        continue;
      }
      usage = result.usage;
      latencyMs = result.latencyMs;
      attempts = result.attempts;

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

  if (!parsed) {
    if (timeoutController.signal.aborted) {
      await pool
        .query(
          `insert into events (event_id, device_id, attempt_id, name, props)
           values ($1,$2,$3,'solve.timeout',$4)`,
          [randomUUID(), deviceId, typeof clientAttemptId === "string" ? clientAttemptId : null, JSON.stringify({ timeout_ms: LLM_TIMEOUT_MS })]
        )
        .catch((err) => console.error("[/api/solve] solve.timeout telemetriya xətası:", err));
      return NextResponse.json(
        { schema_version: 1, status: "unreadable", reason: "Server cavab vermədi, yenidən cəhd et." },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { schema_version: 1, status: "unreadable", reason: "Server xətası, yenidən cəhd et." },
      { status: 200 }
    );
  }

  // status != "ok" → imtina/seçim, yoxlama və DB yazısı yoxdur (PHASE-1: yalnız çatdırılmış həll DB-yə düşür).
  if (parsed.status && parsed.status !== "ok") {
    return NextResponse.json({ ...parsed, attempt_id: null, match_path: "llm" }, { status: 200 });
  }

  const finalAnswer = parsed.final_answer;
  if (!parsed.canonical || !finalAnswer) {
    return NextResponse.json(
      { schema_version: 1, status: "unreadable", reason: "Həll natamamdır." },
      { status: 200 }
    );
  }

  const { verified } = verifyFinalAnswer(parsed.canonical, finalAnswer.values);
  const leaked = detectLeak(parsed.steps ?? [], finalAnswer.values);

  // Server qaydası 1 (PHASE-1): verified=false göstərilmir. AMMA `verified` üç haldır
  // (true/false/null) — `null` "TƏKZİB EDİLMƏDİ, sadəcə yoxlanıla bilmədi" deməkdir (canonical
  // tək-dəyişənli tənlik deyil — söz məsələsi, parametr, ehtimal və s.). Bunu `false` kimi
  // rədd etmək canlı sınaqda tapıldı (ADR-012 yeniləməsi): `equationCrossCheck` YALNIZ tək
  // dəyişənli tənliklər üçün işləyir, bu, `scripts/lib/verify.py`-ın öz production yolunda da
  // eynidir (yoxlandı) — TS portunun yaratdığı bug deyil. Yalnız QƏTİ ZİDDİYYƏT (`false`) gizlədilir.
  if (verified === false) {
    return NextResponse.json(
      { schema_version: 1, status: "unreadable", reason: "Həll yoxlanışdan keçmədi." },
      { status: 200 }
    );
  }

  // verified === true → sympy təsdiqlədi. verified === null → yoxlanıla bilmədi, model
  // çıxışına etibar edilir (STEP-SCHEMA verification.method="none" məhz bunun üçündür).
  const verificationMethod = verified === true ? "sympy" : "none";
  // HANDOFF (68) cədvəli: capture + sympy təsdiqi → auto_verified (bankda görünür),
  // capture + təsdiqsiz → draft (görünmür, yalnız çəkən şagird görür — client tərəfi
  // ayrıca sorğu ilə deyil, elə bu cavabın özü ilə göstərir, bank görünürlüyünə aid deyil).
  const reviewStatus = verified === true ? "auto_verified" : "draft";
  const costUsd = computeCostUsd(usage);
  // Klient telemetriya üçün bu ID-ni artıq kamera ekranı açılanda yaradıb (lib/telemetry
  // setAttemptId) — həmin ID-ni burada SESSİYA (`attempts`) sətrinin PK-sı kimi işlədirik ki,
  // S4-də "son addıma çatdı" yeniləməsi (/api/attempts/progress) əlavə round-trip data
  // saxlamadan bu sətri tapa bilsin. Format etibarsızdırsa (köhnə klient, boş sahə) server öz
  // ID-sini yaradır. `attempt_items.id` isə HƏMİŞƏ server-generasiyalıdır (aşağıda).
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const sessionId = typeof clientAttemptId === "string" && UUID_RE.test(clientAttemptId) ? clientAttemptId : randomUUID();
  const itemId = randomUUID();
  const hash = canonicalHash(parsed.canonical);
  const fingerprint = numericFingerprint(parsed.canonical);
  const effectiveGrade = parsed.grade ?? grade;
  const effectiveSubject = parsed.subject ?? subject;
  const stepsForStorage = parsed.steps ?? [];

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
    // ayrı sətir ola bilər (HANDOFF 70-in daimi qaydası).
    const existing = await client.query<{ id: string }>(
      `select id from questions
        where canonical_hash = $1 and subject_id = $2 and grade = $3
          and superseded_by is null and deleted_at is null`,
      [hash, subjectId, effectiveGrade]
    );

    if (existing.rows.length > 0) {
      questionId = existing.rows[0].id;
      await client.query(
        `update questions set hit_count = hit_count + 1, attempt_count = attempt_count + 1 where id = $1`,
        [questionId]
      );
    } else {
      questionId = randomUUID();
      // ADR-003 (2026-08-08 əlavəsi) / HANDOFF (56) §2: `canonical` mətn məsələlərində DİM
      // mətnini demək olar hərfi saxlayırdı (§D1) — artıq YAZILMIR, keş açarı yalnız
      // `canonical_hash`/`numeric_fingerprint`-dir. `question_translations.stem` (aşağıda)
      // hələ tam mətni saxlayır — bu, AYRICA açıq hüquqi məsələdir, bax ADR-003.
      await client.query(
        `insert into questions
           (id, canonical, canonical_hash, numeric_fingerprint, problem_type, subject_id,
            grade, topic_code, type, payload, difficulty_static, source, review_status,
            attempt_count, root_id)
         values ($1,'',$2,$3,$4,$5,$6,$7,'open','{}'::jsonb,3,'user_capture',$8,1,$1)`,
        [
          questionId,
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
           (question_id, lang, stem, steps, verified, verification_method, model, cost_usd)
         values ($1,'az',$2,$3,$4,$5,$6,$7)`,
        [
          questionId,
          JSON.stringify({ blocks: [{ t: "text", v: parsed.canonical }] }),
          JSON.stringify(publicSteps),
          verified === true,
          verificationMethod,
          process.env.GEMINI_MODEL ?? null,
          costUsd,
        ]
      );

      // G1 (HANDOFF 71): `app_runtime`-in `private`-ə birbaşa yazı icazəsi yoxdur — YALNIZ
      // bu iki RPC. İkisi də insert-only (`ON CONFLICT DO NOTHING`) — eyni `question_id`-yə
      // ikinci çağırış səssiz no-op-dır (bu budaq elə YENİ `questionId` üçündür, ona görə
      // praktikada həmişə uğurlu olmalıdır; `false`/`0` qayıtsa DB-daxili tutarsızlıqdır).
      await client.query(`select store_answer($1, $2::jsonb, 'exact')`, [
        questionId,
        JSON.stringify(finalAnswer),
      ]);
      const stepAnswerRows = buildStepAnswerRows(stepsForStorage);
      if (stepAnswerRows.length > 0) {
        await client.query(`select store_step_answers($1, $2::jsonb)`, [
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
      { schema_version: 1, status: "unreadable", reason: "Server xətası, yenidən cəhd et." },
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
  const clientSteps = stripAccept(stepsForStorage);
  const parsedWithoutAnswers: Record<string, unknown> = { ...parsed };
  delete parsedWithoutAnswers.final_answer;
  delete parsedWithoutAnswers.steps;

  return NextResponse.json(
    {
      ...parsedWithoutAnswers,
      steps: clientSteps,
      attempt_id: sessionId,
      match_path: "llm",
      verification: { verified: true, method: verificationMethod, verified_at: new Date().toISOString() },
      meta: {
        latency_ms: Math.round(latencyMs),
        cost_usd: costUsd,
        tokens_in: usage?.prompt_tokens ?? null,
        tokens_out: usage?.completion_tokens ?? null,
        attempts,
        leaked,
      },
    },
    { status: 200 }
  );
}
