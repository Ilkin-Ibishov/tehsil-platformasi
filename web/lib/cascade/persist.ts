// Kaskadın DB yazısı — ClickUp 86eykj7tu / ADR-020.
//
// İki tamamilə fərqli yol, `LayerSolution`-un tipi ilə ayrılıb:
//
//   questionId VAR  (Qat 2 — bank)  → HEÇ BİR yeni sual yaradılmır. `hit_count`/`attempt_count`
//                                     artırılır, sessiya + item yazılır. Cavab DB-də ARTIQ var,
//                                     `private.*`-a TOXUNULMUR (ADR-017: yazı yalnız RPC ilə,
//                                     mövcud cavabı yenidən yazmaq isə onu KORLAYA bilər).
//   newQuestion VAR (Qat 5 — LLM)   → sympy yoxlaması, dedup, `questions`/
//                                     `question_translations`/`private.*` yazısı.
//
// Bu fayl monolit `/api/solve`-dakı yazı blokunun DAVAMÇISIDIR — eyni cədvəllər, eyni RPC-lər,
// eyni tranzaksiya sərhədi. Fərq: bank yolunun mövcud OLMAMASI (əvvəl `match_path` HƏMİŞƏ
// 'llm' idi).

import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { verifyFinalAnswer } from "../verify/answer";
import { detectLeak } from "../verify/leak";
import { canonicalHash, numericFingerprint } from "./bank";
import type { LayerSolution, PublicStep, Transcript } from "./types";
import { visualPayloadJson, drawableVisual, visualForReuse, type VisualSpec } from "../visual";

export type PersistResult =
  // `steps` — ŞAGİRDƏ GÖSTƏRİLƏCƏK addımlar. Qatın qaytardığından FƏRQLİ ola bilər: mövcud
  // sual sətri tapılanda DB-dəki addımlar göstərilir (aşağıdaki "addım/cavab uyğunluğu"
  // şərhinə bax), ona görə qərar BURADA verilir, route-da yox.
  | {
      ok: true;
      questionId: string;
      sessionId: string;
      // `attempt_items.id` — ClickUp 86eymfg85: `ocr_captures.attempt_item_id`-i bu sətrə
      // bağlamaq üçün (`/api/solve/finish`). Yazı sırası dedup-a görə əvvəldən bilinmir,
      // ona görə DB-yə yazandan SONRA buradan qaytarılır.
      itemId: string;
      steps: PublicStep[];
      visual: VisualSpec | null;
      verification: { verified: boolean | null; method: string; reason?: string | null };
      leaked: boolean;
    }
  // `rejected` — sympy QƏTİ ZİDDİYYƏT tapdı (`verified === false`). Server qaydası 1
  // (PHASE-1): belə həll şagirdə GÖSTƏRİLMİR və DB-yə YAZILMIR.
  | { ok: false; kind: "rejected" | "db_error" };

export async function persistSolution(opts: {
  pool: Pool;
  solution: LayerSolution;
  transcript: Transcript;
  sessionId: string;
  deviceId: string;
  studentRef: string;
  requestedSubject: string;
  locale: string;
  totalCostUsd: number | null;
  attemptKind?: "photo_solve" | "corpus_soak";
}): Promise<PersistResult> {
  const { pool, solution, transcript, sessionId } = opts;

  // ── Qat 2 yolu: mövcud bank sətri ────────────────────────────────────────────────────
  // Ayırıcı `newQuestion`-dur, `questionId` YOX: `if (solution.questionId)` truthiness
  // yoxlaması TS-ə birliyi daraltmağa imkan vermir (boş sətir də `string`-dir) və `else`
  // budağında `newQuestion` yenə `undefined | {...}` qalır.
  if (solution.newQuestion === undefined) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `update questions set hit_count = hit_count + 1, attempt_count = attempt_count + 1 where id = $1`,
        [solution.questionId]
      );
      const itemId = await insertAttempt(client, {
        sessionId,
        deviceId: opts.deviceId,
        studentRef: opts.studentRef,
        questionId: solution.questionId,
        matchPath: solution.matchPath,
        // Bank yolunda şəkil OCR-i Qat 1-də olub — `ocr_source` yenə `vision_llm`-dir,
        // çünki transkripsiya məhz oradan gəldi. Bank sətrinin ÖZÜ isə şəkildən gəlməyib;
        // bu fərq `match_path`-də görünür, `ocr_source`-u dəyişmək onu ikiqat kodlayardı.
        ocrSource: "vision_llm",
        stepsTotal: solution.steps.length,
        costUsd: opts.totalCostUsd,
        kind: opts.attemptKind ?? "photo_solve",
      });
      await client.query("commit");
      return {
        ok: true,
        questionId: solution.questionId,
        sessionId,
        itemId,
        steps: solution.steps,
        visual: drawableVisual(solution.visual),
        verification: solution.verification,
        // Bankdaki addımlar insan/şablon nəzarətindən keçib — sızma yoxlaması onlara
        // TƏTBİQ EDİLMİR, çünki `final_answer` burada əlimizdə yoxdur (o, `private`-dədir
        // və `reveal_answer` audit jurnalı yazır — sızma yoxlaması üçün cavabı açmaq
        // audit jurnalını yalan hadisələrlə dolduraradı).
        leaked: false,
      };
    } catch (err) {
      await client.query("rollback").catch(() => {});
      console.error("[cascade/persist] bank yolu DB xətası:", err);
      return { ok: false, kind: "db_error" };
    } finally {
      client.release();
    }
  }

  // ── Qat 5 yolu: yeni həll ────────────────────────────────────────────────────────────
  const { finalAnswer, stepAnswerRows, rawSteps, model: usedModel } = solution.newQuestion;
  const { verified, reason: verificationReason, method: verificationMethod } = verifyFinalAnswer(
    transcript.canonical,
    finalAnswer.values,
    transcript.subject,
  );
  const leaked = detectLeak(rawSteps, finalAnswer.values);

  // `verified` ÜÇ haldır: `false` = QƏTİ ZİDDİYYƏT (gizlədilir), `null` = yoxlanıla bilmədi
  // (göstərilir, `method='none'`), `true` = mathjs təsdiqlədi.
  if (verified === false) return { ok: false, kind: "rejected" };

  const reviewStatus = verified === true ? "auto_verified" : "draft";
  const hash = canonicalHash(transcript.canonical);
  const fingerprint = numericFingerprint(transcript.canonical);

  const client = await pool.connect();
  try {
    await client.query("begin");

    const subjectRows = await client.query<{ id: string }>(`select id from subjects where code = $1`, [
      transcript.subject,
    ]);
    if (subjectRows.rows.length === 0) throw new Error(`naməlum subject kodu: ${transcript.subject}`);
    const subjectId = subjectRows.rows[0].id;

    // Dedup: `questions_dedup_idx` (canonical_hash, subject_id, grade) — sadə `canonical_hash`
    // axtarışı KİFAYƏT DEYİL, eyni hash fərqli sinif üçün ayrı sətir ola bilər (HANDOFF 70).
    // `questions_fingerprint_dedup_idx` eyni (fingerprint, subject, grade) üçün İKİNCİ sətirə
    // icazə vermir — hash fərqli, rəqəmlər eyni olanda (`5+5=?` vs `5 + 5 = ?`) INSERT 500
    // verirdi. Bank Qat 2 mövzunu bərabərlik-pozucu kimi işlədir; bu indeksdə mövzu YOXDUR,
    // ona görə toqquşmada yeni sətir yox, mövcud sətir REUSE olunur (hash-hit yolu).
    let existing = await client.query<{ id: string; payload: unknown }>(
      `select id, payload from questions
        where canonical_hash = $1 and subject_id = $2 and grade = $3
          and superseded_by is null and deleted_at is null`,
      [hash, subjectId, transcript.grade]
    );
    if (existing.rows.length === 0 && fingerprint) {
      existing = await client.query<{ id: string; payload: unknown }>(
        `select id, payload from questions
          where numeric_fingerprint = $1 and subject_id = $2 and grade = $3
            and superseded_by is null and deleted_at is null`,
        [fingerprint, subjectId, transcript.grade]
      );
    }

    let questionId: string;
    // Şagirdə göstərilən addımlar — defolt olaraq qatın yeni istehsal etdikləri.
    let servedSteps = solution.steps;
    let servedVisual: VisualSpec | null = drawableVisual(solution.visual);

    if (existing.rows.length > 0) {
      // Qat 2a (hash) bunu tapmalı idi — bura düşmək o deməkdir ki, sətir bankda GÖRÜNMÜR
      // (`review_status='draft'`, yəni təsdiqlənməmiş bir çəkiliş). YENİ sətir yaratmırıq,
      // çünki `questions_dedup_idx` unikaldır.
      questionId = existing.rows[0].id;
      await client.query(
        `update questions set hit_count = hit_count + 1, attempt_count = attempt_count + 1 where id = $1`,
        [questionId]
      );

      // ═══ ADDIM/CAVAB UYĞUNLUĞU — SƏSSİZ POZULMA RİSKİ ═══
      // `private.step_answers` MÖVCUD sətrə bağlıdır və `store_step_answers` insert-only
      // (`ON CONFLICT DO NOTHING`) — yəni yeni generasiyanın `accept` dəyərləri DB-yə
      // DÜŞMÜR. Yeni addımları göstərsəydik, şagird N-ci addıma cavab verəndə
      // `/api/steps/check` KÖHNƏ sətrin N-ci `accept`-i ilə müqayisə edərdi: fərqli sual
      // bölgüsü → doğru cavab "səhv" kimi qiymətləndirilər və UYDURMA `error_code` şagirdin
      // səhv xəritəsinə yazılardı. Məhsulun bütün dəyəri həmin xəritədədir (CLAUDE.md
      // Qızıl qayda), ona görə burada DB-dəki addımlar göstərilir — göstərilən addım
      // HƏMİŞƏ saxlanılan cavabla eyni mənbədən gəlir.
      const stored = await client.query<{ steps: PublicStep[] | null }>(
        `select steps from question_translations where question_id = $1 and lang = $2`,
        [questionId, opts.locale]
      );
      const storedSteps = stored.rows[0]?.steps;
      if (Array.isArray(storedSteps) && storedSteps.length > 0) {
        servedSteps = storedSteps;
      }
      // Saxlanılan addım YOXDURSA (`0034` lazy-generation sətri) yeni addımlar göstərilir —
      // o halda `step_answers` da boşdur, uyğunsuzluq yaranmır.
      // Visual INSERT-only idi: köhnə `payload={}` reuse-da LLM qrafikini silirdi.
      // Addımlar saxlanılan qalır; drawable visual yoxdursa bu cavabın LLM vizualı verilir
      // və yalnız boş payload backfill olunur (mövcud qrafik üzərinə yazılmır).
      const reuse = visualForReuse(existing.rows[0].payload, servedVisual);
      servedVisual = reuse.served;
      if (reuse.backfill) {
        await client.query(`update questions set payload = $2::jsonb where id = $1`, [
          questionId,
          visualPayloadJson(reuse.backfill),
        ]);
      }
    } else {
      questionId = randomUUID();
      // ADR-003 Ləğv (2026-08-14) / S8 (86eymwgmv): Ilkin-in qəti qərarı ilə `canonical`
      // artıq BOŞALDILMIR — DİM mətninin hüquqi riski bu mərhələdə maneə sayılmır (sürət >
      // hüquqi ehtiyat, pre-launch, 0 istifadəçi). Keş davranışı DƏYİŞMİR —
      // `canonical_hash`/`numeric_fingerprint` bundan ƏVVƏL hesablanır.
      await client.query(
        `insert into questions
           (id, canonical, canonical_hash, numeric_fingerprint, problem_type, subject_id,
            grade, topic_code, type, payload, difficulty_static, source, review_status,
            attempt_count, root_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'open',$10::jsonb,3,'user_capture',$9,1,$1)`,
        [
          questionId,
          transcript.canonical,
          hash,
          fingerprint,
          transcript.problemType,
          subjectId,
          transcript.grade,
          transcript.topicCode,
          reviewStatus,
          visualPayloadJson(servedVisual),
        ]
      );

      await client.query(
        `insert into question_translations
           (question_id, lang, stem, steps, verified, verification_method, verification_reason, model, cost_usd)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          questionId,
          opts.locale,
          JSON.stringify({ blocks: [{ t: "text", v: transcript.canonical }] }),
          JSON.stringify(solution.steps),
          verified === true,
          verificationMethod,
          verificationReason,
          usedModel, // ADR-023: HƏQİQƏTƏN işlədilən model (LLM-siz Qat 3 üçün `null`)
          solution.costUsd,
        ]
      );

      // G1 (HANDOFF 71) / gate-78: `app_runtime`-in `private`-ə birbaşa yazısı YOXDUR,
      // yalnız bu iki `app` RPC-si. İkisi də insert-only (`ON CONFLICT DO NOTHING`).
      await client.query(`select app.store_answer($1, $2::jsonb, 'exact')`, [
        questionId,
        JSON.stringify(finalAnswer),
      ]);
      if (stepAnswerRows.length > 0) {
        await client.query(`select app.store_step_answers($1, $2::jsonb)`, [
          questionId,
          JSON.stringify(stepAnswerRows),
        ]);
      }
    }

    const itemId = await insertAttempt(client, {
      sessionId,
      deviceId: opts.deviceId,
      studentRef: opts.studentRef,
      questionId,
      matchPath: solution.matchPath,
      ocrSource: "vision_llm",
      stepsTotal: servedSteps.length,
      costUsd: opts.totalCostUsd,
      kind: opts.attemptKind ?? "photo_solve",
    });

    await client.query("commit");
    return {
      ok: true,
      questionId,
      sessionId,
      itemId,
      steps: servedSteps,
      visual: servedVisual,
      // S5 (86eymwgkv) — `verified` üç haldır: true / false / null. `method='none'` olanda
      // `true` göndərmək INV-11 pozuntusudur; `null`-u `false`-a yıxmaq nişanı oğurlayırdı.
      verification: { verified, method: verificationMethod, reason: verificationReason },
      leaked,
    };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    console.error("[cascade/persist] yeni həll DB xətası:", err);
    return { ok: false, kind: "db_error" };
  } finally {
    client.release();
  }
}

type QueryClient = { query: (text: string, values?: unknown[]) => Promise<unknown> };

// Sessiya (`attempts`) + item (`attempt_items`) — bir "solve" Faza 1-də bir sessiya, bir item
// (ADR-019 §2.1). `delivered=true` gündəlik limitin sayğacıdır (S5 invariantı: yalnız
// ÇATDIRILMIŞ həll sayılır).
async function insertAttempt(
  client: QueryClient,
  opts: {
    sessionId: string;
    deviceId: string;
    studentRef: string;
    questionId: string;
    matchPath: string;
    ocrSource: string;
    stepsTotal: number;
    costUsd: number | null;
    kind: "photo_solve" | "corpus_soak";
  }
): Promise<string> {
  await client.query(
    `insert into attempts (id, device_id, student_ref, kind, started_at, client_created_at)
     values ($1,$2,$3,$4,now(),now())`,
    [opts.sessionId, opts.deviceId, opts.studentRef, opts.kind]
  );
  const itemId = randomUUID();
  await client.query(
    `insert into attempt_items
       (id, attempt_id, question_id, match_path, ocr_source, delivered, steps_total, cost_usd)
     values ($1,$2,$3,$4,$5,true,$6,$7)`,
    [itemId, opts.sessionId, opts.questionId, opts.matchPath, opts.ocrSource, opts.stepsTotal, opts.costUsd]
  );
  return itemId;
}
