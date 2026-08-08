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
// 3. Şəkil saxlanılmır — yalnız problems/solutions/attempts yazılır.
// 4. selected_label verilibsə, yalnız o məsələ həll edilir.
//
// Dəvət kodu + gündəlik limit (30) — ADR-012: paylaşılan sirr (env), device_id üzrə limit.
//
// SYSTEM-REVIEW §C2 (HANDOFF 41): `maxDuration` YOX idi, latensiya 16.8 san — defolta çox
// yaxın, işləməsi TƏSADÜFƏ görə idi. İndi Vercel-ə 60 san büdcə verilir, LLM çağırışı özü
// ~45 san-da `AbortController`-lə kəsilir (15 san DB yazısı/cavab üçün buffer).

const DAILY_LIMIT = 30;
export const maxDuration = 60;
const LLM_TIMEOUT_MS = 45_000;

type StepSchemaOutput = {
  status?: string;
  reason?: string;
  canonical?: string;
  subject?: string;
  grade?: number;
  topic_code?: string;
  final_answer?: { latex: string; values: string[]; choice?: string };
  steps?: { explanation?: string; check?: { accept?: string[] } }[];
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
  // `completed` BURADAN AYRIDIR (SYSTEM-REVIEW §A1) — "son addıma çatdı" klientin
  // `/api/attempts/progress`-ə yazdığı ayrı sahədir, limitə təsir etmir.
  const { rows: limitRows } = await pool.query(
    `select count(*)::int as c from attempts
     where device_id = $1 and delivered = true and created_at >= date_trunc('day', now())`,
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
  const dailyCeiling = Number(process.env.DAILY_COST_CEILING_USD);
  if (Number.isFinite(dailyCeiling) && dailyCeiling > 0) {
    const { rows: costRows } = await pool.query(
      `select coalesce(sum(cost_usd), 0)::float8 as total from solutions
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
    return NextResponse.json({ ...parsed, solution_id: null, match_path: "llm" }, { status: 200 });
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
  const costUsd = computeCostUsd(usage);
  const solutionId = randomUUID();
  // Klient telemetriya üçün bu ID-ni artıq kamera ekranı açılanda yaradıb (lib/telemetry
  // setAttemptId) — həmin ID-ni burada sətir PK-sı kimi işlədirik ki, S4-də "son addıma
  // çatdı" yeniləməsi (/api/attempts/progress) əlavə round-trip data saxlamadan bu sətri
  // tapa bilsin. Format etibarsızdırsa (köhnə klient, boş sahə) server öz ID-sini yaradır.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const attemptRowId = typeof clientAttemptId === "string" && UUID_RE.test(clientAttemptId) ? clientAttemptId : randomUUID();
  const hash = canonicalHash(parsed.canonical);

  const client = await pool.connect();
  let problemId: string;
  try {
    await client.query("begin");

    const existing = await client.query<{ id: string }>(`select id from problems where canonical_hash = $1`, [hash]);
    if (existing.rows.length > 0) {
      problemId = existing.rows[0].id;
      await client.query(`update problems set hit_count = hit_count + 1 where id = $1`, [problemId]);
    } else {
      problemId = randomUUID();
      // ADR-003 (2026-08-08 əlavəsi) / HANDOFF (56) §2: `canonical` mətn məsələlərində DİM
      // mətnini demək olar hərfi saxlayırdı (§D1) — artıq YAZILMIR, keş açarı yalnız
      // `canonical_hash`/`numeric_fingerprint`-dir (hər ikisi `parsed.canonical`-dan
      // HESABLANIR, mətnin özü isə sətrə düşmür). `solutions.payload` hələ tam çıxışı
      // (canonical daxil) saxlayır — bu, AYRICA açıq məsələdir, bax ADR-003.
      await client.query(
        `insert into problems (id, canonical, canonical_hash, numeric_fingerprint, problem_type, subject, grade, topic_code, source)
         values ($1,'',$2,$3,$4,$5,$6,$7,'user_photo')`,
        [
          problemId,
          hash,
          numericFingerprint(parsed.canonical),
          parsed.problem_type ?? null,
          parsed.subject ?? subject,
          parsed.grade ?? grade,
          parsed.topic_code ?? null,
        ]
      );
    }

    await client.query(
      // SYSTEM-REVIEW §A2: `verified` HƏQİQİ üçlü dəyəri yazır (`true`/`null`) — əvvəllər
      // hardcode `true` idi, `verified===null` (yoxlanıla bilmədi) halında da `true` yazılırdı.
      // Davranış düzgün idi (`false` bu sətrə çatmır, yuxarıda rədd edilir), amma sütun yalan
      // deyirdi: "neçə həll həqiqətən sympy ilə təsdiqlənib?" sualı `verified`-dən cavablana
      // bilmirdi, yalnız `verification_method`-dan.
      `insert into solutions (id, problem_id, schema_version, payload, verified, verification_method, model, cost_usd)
       values ($1,$2,1,$3,$4,$5,$6,$7)`,
      [solutionId, problemId, JSON.stringify(parsed), verified, verificationMethod, process.env.GEMINI_MODEL ?? null, costUsd]
    );

    await client.query(
      `insert into attempts (id, device_id, problem_id, solution_id, match_path, ocr_source, delivered, student_ref)
       values ($1,$2,$3,$4,'llm','vision_llm',true,$5)`,
      [attemptRowId, deviceId, problemId, solutionId, studentRef]
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
  // brauzerdə idi. DB-dəki `payload` (yuxarıda) TAM qalır — yalnız ŞƏBƏKƏ cavabından çıxarılır.
  // Addım yoxlaması indi `/api/steps/check`-dədir (§B1-dəki eyni normallaşdırma), son cavab
  // `/api/attempts/reveal`-dədir. `error_code`/`hint` BURADA qalır — bunlar cavabı açmır,
  // yalnız səhv edildikdə göstərilən diaqnoz mətnidir.
  const clientSteps = (parsed.steps ?? []).map((step) => {
    const typedStep = step as { check?: { ask?: string; accept?: string[]; input_kind?: string } } & Record<string, unknown>;
    const checkRest = { ...typedStep.check };
    delete checkRest.accept;
    return { ...typedStep, check: checkRest };
  });
  const parsedWithoutAnswers: Record<string, unknown> = { ...parsed };
  delete parsedWithoutAnswers.final_answer;
  delete parsedWithoutAnswers.steps;

  return NextResponse.json(
    {
      ...parsedWithoutAnswers,
      steps: clientSteps,
      solution_id: solutionId,
      attempt_id: attemptRowId,
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
