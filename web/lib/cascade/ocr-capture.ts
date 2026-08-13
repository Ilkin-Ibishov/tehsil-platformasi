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
// ═══ BU SESSİYADA YAZILMAYAN SAHƏLƏR ═══
// `storage_path` (şəkil Storage-a yüklənmir — ayrı iş), `width`/`height`/`bytes` (şəkil ön
// emalı, ClickUp 86eymfg9z — ayrı iş). NULL qalır — `v_ocr_corpus` görünüşü onlara EHTİYAC
// DUYMUR (yoxlanıldı: yalnız corrected/correction_kind/usable_for_training/latency_ms/
// cost_usd/source oxuyur).
// `image_phash` İNDİ YAZILIR (ClickUp 86eymfgbv, `web/lib/phash.ts::computePHash`) — Qat 1
// artıq onu HƏR HALDA hesablayır (keş axtarışı üçün), ikinci dəfə hesablamağa EHTİYAC yoxdur.

import type { Pool } from "pg";

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
export async function writeOcrCapture(
  pool: Pool,
  opts: {
    ocrRaw: string;
    imageSha256: string;
    imagePhash: string | null;
    model: string | null;
    latencyMs: number | null;
    costUsd: number | null;
  }
): Promise<string | null> {
  try {
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.ocr_captures (ocr_raw, image_sha256, image_phash, model, latency_ms, cost_usd, source)
       values ($1, $2, $3, $4, $5, $6, 'student')
       returning id`,
      [opts.ocrRaw, opts.imageSha256, opts.imagePhash, opts.model, opts.latencyMs, opts.costUsd]
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("[cascade/ocr-capture] yazı xətası:", err);
    return null;
  }
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
