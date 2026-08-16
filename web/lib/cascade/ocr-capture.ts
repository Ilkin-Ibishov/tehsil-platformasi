// OCR korpusu yazısı — ClickUp 86eymfg85. DB (`public.ocr_captures`) miqrasiya `0043`-də
// hazırdır, bu fayl tətbiq kodudur.
//
// ═══ KRİTİK NÜANS (taskın öz sözləri) ═══
// "ocr_raw mütləq təsdiq ekranı göstərilməzdən əvvəl yazılmalıdır ... Yalnız son mətni
// saxlasaq training datası dəyərsizdir — modelin SƏHVİNİ öyrənmək lazımdır."
// Ona görə iki ayrı funksiya: `writeOcrCapture` (Qat 1 qayıdan kimi, təsdiq ekranından
// ƏVVƏL, `/api/solve/transcribe`-də) və `finalizeOcrCapture` (təsdiqdən SONRA, `/api/solve/
// finish`-də). Aralarında saniyələr/dəqiqələr keçə bilər — şagird mətni oxuyub düşünür.
//
// ═══ ADR-024 (S1, 86eymwght) YENİLƏMƏSİ ═══
// `storage_path`/`width`/`height`/`bytes` İNDİ YAZILIR — çağıran (`transcribe/route.ts`,
// monolit `/api/solve`) `web/lib/storage.ts::uploadCaptureImages`-i ƏVVƏLCƏDƏN çağırıb
// nəticəni `writeOcrCapture`-a ötürür (sətir ARTIQ mövcuddur, `id` gen_random_uuid ilə
// generasiya olunur — path ondan asılıdır, ona görə upload insert-dən SONRA baş verir, path
// isə əvvəlcədən HESABLANIR: `idHint` client-tərəfi generasiya olunan `captureId`-dir, insert
// bunu `id` kimi AÇIQ yazır ki, upload path-i ilə DB sətri eyni ID-ni paylaşsın).
// `image_phash` (ClickUp 86eymfgbv, `web/lib/phash.ts::computePHash`) — Qat 1 artıq onu HƏR
// HALDA hesablayır (keş axtarışı üçün), ikinci dəfə hesablamağa EHTİYAC yoxdur.

import type { Pool } from "pg";
import { randomUUID } from "node:crypto";

export type CorrectionKind = "none" | "minor" | "major" | "rejected";

// Klassik Levenshtein, DP. Xarakter-səviyyəli — kiçik mətnlər üçün (canonical, adətən
// <200 simvol) O(n*m) heç bir performans riski daşımır.
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Heuristik həddir, GOLDEN qayda deyil — `v_ocr_corpus.duzgun_oxuma_faizi` üzərində ADR-020-nin
// intizamı ilə (ölçülmədən qərar verilmir) TƏNZİMLƏNMƏLİDİR, ilkin dəyər başlanğıc nöqtəsidir.
// 0 fərq → 'none'. Fərq mətn uzunluğunun ≤15%-i → 'minor' (tipoqrafik, 1-2 simvol).
// Böyükdürsə → 'major' (struktur fərqi — başqa rəqəm, başqa əməliyyat).
export function classifyCorrection(ocrRaw: string, ocrFinal: string, editDistance: number): CorrectionKind {
  if (editDistance === 0) return "none";
  const maxLen = Math.max(ocrRaw.length, ocrFinal.length, 1);
  return editDistance / maxLen <= 0.15 ? "minor" : "major";
}

// Qat 1 qayıtdıqdan DƏRHAL SONRA çağırılır — təsdiq ekranı göstərilməzdən ƏVVƏL. Best-effort:
// uğursuzluq axını BLOKLAMIR (`null` qaytarır), çünki korpus ölçmədir, məhsul deyil — eyni
// prinsip `logEvent`/`invite_redemption` yazılarında da tətbiq olunub (HANDOFF 81 dərsi).
// `id` burada (DB defolt `gen_random_uuid()`-dan FƏRQLİ olaraq) ƏVVƏLCƏDƏN client-tərəfdə
// generasiya olunur ki, çağıran (`transcribe/route.ts`) Storage-a yükləməni HƏMİN ID ilə
// (`captures/<yyyy>/<mm>/<id>-{crop,raw}.jpg`) eyni sorğu içində, insert-dən ƏVVƏL apara
// bilsin — iki ayrı round-trip (insert, sonra update storage_path) əvəzinə tək insert.
export async function writeOcrCapture(
  pool: Pool,
  opts: {
    id?: string; // verilməzsə burada generasiya olunur — `reserveCaptureId()` YALNIZ Storage
    // path-i insert-dən ƏVVƏL lazım olanda (S1) çağırılır.
    ocrRaw: string;
    imageSha256: string;
    imagePhash: string | null;
    model: string | null;
    latencyMs: number | null;
    costUsd: number | null;
    storagePath?: string | null;
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
  }
): Promise<string | null> {
  const id = opts.id ?? randomUUID();
  try {
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.ocr_captures
         (id, ocr_raw, image_sha256, image_phash, model, latency_ms, cost_usd, source,
          storage_path, width, height, bytes)
       values ($1, $2, $3, $4, $5, $6, $7, 'student', $8, $9, $10, $11)
       returning id`,
      [
        id,
        opts.ocrRaw,
        opts.imageSha256,
        opts.imagePhash,
        opts.model,
        opts.latencyMs,
        opts.costUsd,
        opts.storagePath ?? null,
        opts.width ?? null,
        opts.height ?? null,
        opts.bytes ?? null,
      ]
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("[cascade/ocr-capture] yazı xətası:", err);
    return null;
  }
}

/** COST-LATENCY-SAFE-SEQUENCE addım 3: Storage cavabdan sonra — path/ölçü patch. */
export async function patchOcrCaptureStorage(
  pool: Pool,
  opts: {
    id: string;
    storagePath: string;
    width: number | null;
    height: number | null;
    bytes: number | null;
  }
): Promise<void> {
  try {
    await pool.query(
      `update public.ocr_captures
          set storage_path = $2, width = $3, height = $4, bytes = $5
        where id = $1 and storage_path is null`,
      [opts.id, opts.storagePath, opts.width, opts.height, opts.bytes]
    );
  } catch (err) {
    console.error("[cascade/ocr-capture] storage patch xətası:", err);
  }
}

// `writeOcrCapture`-ın ÖZÜNDƏN ƏVVƏL çağırılır — `id`-ni əvvəlcədən ayırıb Storage path-i
// üçün istifadə etmək məqsədilə. Bax yuxarıdakı şərh.
export function reserveCaptureId(): string {
  return randomUUID();
}

// Təsdiq ekranından SONRA — şagird "Düzdür" deyib (dəyişməklə/dəyişmədən) davam edəndə.
// `ocr_raw` KLİENTDƏN GÖTÜRÜLMÜR — DB-dəki `writeOcrCapture`-ın yazdığı dəyər oxunur, ki
// klient onu (qəsdən/təsadüfən) dəyişib "düzəliş yoxdur" kimi göstərə bilməsin. `captureId`
// `null`-dursa (yazı uğursuz olub) sükutla heç nə etmir — korpus bir sətir itirir, amma
// şagirdin həlli bundan asılı DEYİL.
export async function finalizeOcrCapture(
  pool: Pool,
  opts: { captureId: string | null; ocrFinal: string; attemptItemId?: string | null }
): Promise<void> {
  if (!opts.captureId) return;
  try {
    const { rows } = await pool.query<{ ocr_raw: string }>(
      `select ocr_raw from public.ocr_captures where id = $1`,
      [opts.captureId]
    );
    const ocrRaw = rows[0]?.ocr_raw;
    if (ocrRaw === undefined) return;

    const editDistance = levenshteinDistance(ocrRaw, opts.ocrFinal);
    const corrected = editDistance > 0;
    const correctionKind = classifyCorrection(ocrRaw, opts.ocrFinal, editDistance);
    await pool.query(
      `update public.ocr_captures
          set ocr_final = $2, corrected = $3, correction_kind = $4, edit_distance = $5,
              attempt_item_id = coalesce($6, attempt_item_id)
        where id = $1`,
      [opts.captureId, opts.ocrFinal, corrected, correctionKind, editDistance, opts.attemptItemId ?? null]
    );
  } catch (err) {
    console.error("[cascade/ocr-capture] finalize xətası:", err);
  }
}

// Şagird transkripsiyanı "tamamilə səhvdir, yenidən çəkirəm" kimi rədd edəndə. `ocr_final`
// YAZILMIR (heç bir "düzgün" mətn yoxdur) — `correction_kind='rejected'` `v_ocr_corpus`-un
// `tam_sehv` sütununu bəsləyir.
export async function rejectOcrCapture(pool: Pool, captureId: string | null): Promise<void> {
  if (!captureId) return;
  await pool
    .query(
      `update public.ocr_captures set corrected = true, correction_kind = 'rejected' where id = $1`,
      [captureId]
    )
    .catch((err) => console.error("[cascade/ocr-capture] rədd yazı xətası:", err));
}
