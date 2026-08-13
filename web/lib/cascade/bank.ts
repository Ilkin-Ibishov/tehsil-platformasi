// Kaskad Qat 2 — BANKDA VAR? (ClickUp 86eykj7tu, ADR-020). LLM ÇAĞIRILMIR, xərc SIFIR.
//
// `ARCHITECTURE.md`/`DATA-MODEL.md` uyğunlaşdırma sırasını ARTIQ təyin edib:
//   canonical_hash bərabər        → 'hash'         (<50ms)
//   numeric_fingerprint bərabər   → 'fingerprint'  (<80ms)
//   embedding oxşarlığı > 0.90    → 'embedding'    (hələ qurulmayıb, pgvector)
// Ona görə Qat 2 İKİ qat kimi ixrac olunur — telemetriyanın `match_path` taksonomiyası bu
// ikisini AYIRIR (S6-nın əsas metrikası) və birləşdirmək ölçməni korlayardı.
//
// ═══ NİYƏ BU QAT BU GÜNƏ QƏDƏR HEÇ VAXT İŞLƏMİRDİ ═══
//
// `numeric_fingerprint` sütununda İKİ format yaşayır (0047 miqrasiyasının şərhi):
// bankın 217 generasiya sualı `'FAIZ.OF|300,5'`, `/api/solve`-un hesabladığı isə `'300,5'`.
// Bərabərlik heç vaxt tutmurdu → 217 sual bu qat üçün GÖRÜNMƏZ idi. `0047` prefiksi soyan
// `fingerprint_digits` GENERATED sütununu əlavə etdi; bu modul ONU işlədir.
//
// ═══ AMBIGUITY QAYDASI — MƏHSULUN ƏN VACİB SƏTRİ ═══
//
// Rəqəmlər TƏK BAŞINA unikal DEYİL. Ölçüldü: `-1,-2` + 9-cu sinif → İKİ sual
// (`QUAD.MIN` = kiçik kök, `QUAD.SUM` = köklərin cəmi), FƏRQLİ cavablar. Rəqəm-yalnız
// uyğunluq şagirdə YANLIŞ həlli inamla öyrədərdi — taskın "ən böyük risk mənbəyi" dediyi hal.
//
// `topic_code` FİLTR DEYİL, BƏRABƏRLİK-POZUCUDUR. Bu, ölçmə nəticəsidir, üslub seçimi deyil.
// `(digits, subject, grade)` üzrə qruplaşma (yalnız bankda görünən sətirlər):
//
//   154 qrup → TƏK sətir. `topic_code`-a EHTİYAC YOX.
//    35 qrup → 2 sətir, bərabərlik-pozucu lazımdır:
//              `ALG.QUADRATIC_EQUATION | ALG.VIETA_SUM` — ADR-008-ə UYĞUN kodlar,
//                  promptun nümunə siyahısındadır, model onları istehsal EDƏ BİLİR → pozucu İŞLƏYİR.
//              `ARITH.PERCENT_OF | ARITH.PERCENT_INCREASE` — 0048-dən ƏVVƏL `FAIZ.*` idi
//                  (ADR-008-i pozurdu, model heç vaxt yazmırdı → pozucu işləmirdi, İMTİNA).
//                  `0048` bank sətirlərini ADR-008-ə uyğun kodlara köçürdü (ADR-020 T3) —
//                  bu 8 qrup indi kodla ayrılır, İMTİNA YOX.
//
// `topic_code`-u FİLTR kimi işlətsəydik (əvvəlki versiya belə idi), 91 faiz sualı — bankın
// 42%-i — Qat 2 üçün ƏBƏDİ GÖRÜNMƏZ qalardı, ÜSTƏLİK rəqəmlə artıq unikal olan 154 qrup da
// modelin `topic_code`-unu HƏRFİ tapmasından asılı olardı. Pozucu kimi işlədəndə: 154 qrup
// dərhal tutulur, QUAD/FAIZ cütləri kodla ayrılır.
//
// Son qayda: bərabərlik-pozucudan SONRA da birdən çox namizəd qalırsa İMTİNA (`null` →
// növbəti qat). "Şübhə varsa bankdan cavab verməmək" HƏMİŞƏ "ola bilsin doğrudur"dan ucuzdur.

import { createHash } from "node:crypto";
import type { Pool } from "pg";
import type { CascadeContext, LayerSolution, PublicStep, SolveLayer } from "./types";

export function normalizeCanonical(canonical: string): string {
  return canonical.trim().toLowerCase().replace(/\s+/g, " ");
}

export function canonicalHash(canonical: string): string {
  return createHash("sha256").update(normalizeCanonical(canonical)).digest("hex");
}

// `DATA-MODEL.md`: "mətndəki bütün ədədlər sıra ilə: '60,2,3'". Mənfi işarə DAXİL EDİLİR —
// bankın `QUAD.*` şablonları `-1,-2` kimi mənfi əmsallar saxlayır, işarəni atsaydıq
// `1,2` (kök cütü) ilə `-1,-2` (əmsallar) qarışardı.
export function numericFingerprint(canonical: string): string {
  return (canonical.match(/-?\d+(\.\d+)?/g) ?? []).join(",");
}

type BankRow = {
  question_id: string;
  topic_code: string | null;
  steps: PublicStep[] | null;
  verified: boolean | null;
  verification_method: string | null;
};

// Namizəd sayının yuxarı həddi. Real bankda maksimum 2-dir (ölçüldü), 4 həddi "gözlənilməz
// çoxluq" halını da imtinaya aparır — sonsuz sətir oxumamaq üçün.
const MAX_CANDIDATES = 4;

// Ortaq sorğu gövdəsi. `steps`-i `question_translations`-dan götürür — ORADA ARTIQ
// `check.accept` YOXDUR (ölçüldü: 226 tərcümənin heç birində `accept` sətri yoxdur, ADR-017).
// `review_status` süzgəci MƏCBURİDİR: `draft` başqa şagirdin YOXLANMAMIŞ çəkilişidir, onu
// bankdan cavab kimi paylamaq təsdiqlənməmiş həlli təsdiqlənmiş kimi göstərmək olardı.
async function queryCandidates(pool: Pool, where: string, params: unknown[]): Promise<BankRow[]> {
  const { rows } = await pool.query<BankRow>(
    `select q.id as question_id,
            q.topic_code as topic_code,
            qt.steps as steps,
            qt.verified as verified,
            qt.verification_method as verification_method
       from questions q
       join subjects s on s.id = q.subject_id
       join question_translations qt on qt.question_id = q.id and qt.lang = $1
      where q.superseded_by is null
        and q.deleted_at is null
        and q.review_status in ('auto_verified', 'verified')
        and ${where}
      limit ${MAX_CANDIDATES}`,
    params
  );
  return rows;
}

// Ambiguity qaydasının İCRASI (yuxarıdaki şərh). `topic_code` yalnız namizəd BİRDƏN ÇOX
// olanda işə düşür — filtr kimi işlədilsə bankın 42%-i görünməz qalır.
function resolveCandidates(rows: BankRow[], topicCode: string, layerId: string): BankRow | null {
  const usable = rows.filter(hasUsableSteps);
  if (usable.length === 0) return null;
  if (usable.length === 1) return usable[0];

  const byTopic = usable.filter((r) => r.topic_code === topicCode);
  if (byTopic.length === 1) return byTopic[0];

  console.warn(
    `[cascade/${layerId}] ${usable.length} namizəd, topic_code='${topicCode}' ayırmadı ` +
      `(namizəd kodları: ${usable.map((r) => r.topic_code).join(", ")}) — İMTİNA, növbəti qata keçilir`
  );
  return null;
}

// Addımı olmayan sətir (`0034` lazy-generation) uyğunluq SAYILMIR — şagirdə boş həll
// göstərmək imtinadan pisdir.
function hasUsableSteps(row: BankRow): row is BankRow & { steps: PublicStep[] } {
  return Array.isArray(row.steps) && row.steps.length > 0;
}

// Bank sətrinin yoxlama qeydini KLİENT MÜQAVİLƏSİNƏ çevirir.
//
// İki uyğunsuzluq var, ikisi də ölçülüb və qəsdən idarə olunur:
//
// 1. `verification_method` DB-də sərbəst `text`-dir və şablon sətirlərində
//    `'template_authored'` yazılıb — STEP-SCHEMA `verification.method` enum-u isə YALNIZ
//    `sympy|human|none` qəbul edir. Naməlum dəyəri olduğu kimi ötürmək cavabı öz sxemindən
//    keçməz edərdi, ona görə enum-dan kənar hər şey `none`-a düşür ("maşınla yoxlanmayıb" —
//    şablon həlli üçün DOĞRU təsvirdir). Xam dəyər telemetriyada saxlanılır ki, itməsin.
//
// 2. `question_translations.verified` şablon sətirlərində `false`-dur (sympy onları
//    yoxlamayıb), amma sətri BANKDA GÖRÜNƏN edən şərt `review_status`-dur (`0038` şablonları
//    `auto_verified` yazır) və sorğu ARTIQ onu süzür. Yəni bura çatan sətir çatdırıla
//    bilən sətirdir → `verified: true`. Bu, monolit yolun davranışı ilə də EYNİDİR (o da
//    cavabda hardcode `verified: true` göndərir, çünki `false` hal daha yuxarıda rədd olunur).
//    `verified: false` göndərsəydik, PHASE-1 server qaydası 1-i ("verified=false göstərilmir")
//    oxuyan gələcək kod bankın 217 sualını səssizcə gizlədərdi.
function bankVerification(row: BankRow): { verified: boolean; method: string } {
  const method = row.verification_method;
  return {
    verified: true,
    method: method === "sympy" || method === "human" || method === "none" ? method : "none",
  };
}

export function makeBankLayers(pool: Pool): SolveLayer[] {
  // ── Qat 2a: canonical_hash (birinci dərəcəli açar) ───────────────────────────────────
  const hashLayer: SolveLayer = {
    id: "bank_hash",
    async run(ctx: CascadeContext): Promise<LayerSolution | null> {
      const hash = canonicalHash(ctx.transcript.canonical);
      const rows = await queryCandidates(pool, `q.canonical_hash = $2 and s.code = $3 and q.grade = $4`, [
        ctx.locale,
        hash,
        ctx.transcript.subject,
        ctx.transcript.grade,
      ]);
      // `questions_dedup_idx` (canonical_hash, subject_id, grade) UNİKALDIR — burada bir
      // sətirdən çox olması DB-daxili tutarsızlıqdır. `resolveCandidates` yenə də çağırılır ki,
      // belə hal səssiz "birincini götür"ə çevrilməsin.
      const row = resolveCandidates(rows, ctx.transcript.topicCode, "bank_hash");
      if (!row || !hasUsableSteps(row)) return null;
      return {
        layer: "bank_hash",
        matchPath: "hash",
        questionId: row.question_id,
        steps: row.steps,
        verification: bankVerification(row),
        costUsd: 0,
        latencyMs: 0,
        usage: null,
      };
    },
  };

  // ── Qat 2b: fingerprint_digits + topic_code (ikinci dərəcəli açar) ───────────────────
  const fingerprintLayer: SolveLayer = {
    id: "bank_fingerprint",
    async run(ctx: CascadeContext): Promise<LayerSolution | null> {
      const digits = numericFingerprint(ctx.transcript.canonical);
      // Rəqəmsiz məsələ (sadələşdirmə, isbat, ümumi ifadə) — bu açar onlar üçün mənasızdır.
      // Boş sətirlə axtarış bankdaki bütün rəqəmsiz sualları uyğun gətirərdi.
      if (!digits) return null;

      // DİQQƏT: `topic_code` sorğuda YOXDUR — o, `resolveCandidates`-də bərabərlik-pozucu
      // kimi işlədilir (faylın başındaki ölçmə şərhi).
      const rows = await queryCandidates(pool, `q.fingerprint_digits = $2 and s.code = $3 and q.grade = $4`, [
        ctx.locale,
        digits,
        ctx.transcript.subject,
        ctx.transcript.grade,
      ]);
      const row = resolveCandidates(rows, ctx.transcript.topicCode, "bank_fingerprint");
      if (!row || !hasUsableSteps(row)) return null;
      return {
        layer: "bank_fingerprint",
        matchPath: "fingerprint",
        questionId: row.question_id,
        steps: row.steps,
        verification: bankVerification(row),
        costUsd: 0,
        latencyMs: 0,
        usage: null,
      };
    },
  };

  return [hashLayer, fingerprintLayer];
}
