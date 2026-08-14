// Çəkilmiş şəkillərin Supabase Storage-a yüklənməsi — ADR-024, ClickUp S1 (86eymwght).
//
// SDK YOX — `@supabase/supabase-js` layihədə yoxdur (DB `pg` ilə birbaşa bağlanır), tək
// upload+metadata əməliyyatı üçün yeni asılılıq əlavə etmək REST-in üstündə dəyər yaratmır.
// Storage REST API: `POST /storage/v1/object/<bucket>/<path>` (upsert), service-role açarı
// ilə RLS bypass olunur (bax `0057`-in şərhi — bucket-də HEÇ bir policy yoxdur, service-role
// YEGANƏ giriş yoludur).
//
// Best-effort: env yoxdursa (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`) və ya şəbəkə/limit
// xətası olsa, `null` qaytarır — `writeOcrCapture`-ın özü kimi, şəkil itkisi şagirdin həllini
// BLOKLAMIR (ADR-024 §6).

import sharp from "sharp";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "captures";

export type CaptureImageMeta = {
  storagePath: string;
  width: number | null;
  height: number | null;
  bytes: number;
};

// `idHint` — `ocr_captures.id` (transkripsiya insert-i onu ƏVVƏLCƏDƏN generasiya edib ötürür,
// bax `ocr-capture.ts`), path formatı ADR-024-ün "attempt_item_id yoxdursa capture_id" qaydası.
function objectPath(idHint: string, variant: "crop" | "raw"): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}/${mm}/${idHint}-${variant}.jpg`;
}

async function putObject(path: string, bytes: Buffer, mime: string): Promise<boolean> {
  if (!SUPABASE_URL || !SERVICE_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": mime,
        "x-upsert": "true",
      },
      // `Buffer`/generic `Uint8Array<ArrayBufferLike>` TS-in DOM `BodyInit` tərifi ilə tam
      // uyğunlaşmır (TS 5.7 typed-array generic dəyişikliyi) — runtime-da (Node `fetch`/undici)
      // `Buffer` NORMAL BodyInit-dir, cast YALNIZ tip səviyyəsindədir.
      body: bytes as unknown as BodyInit,
    });
    if (!res.ok) {
      console.error(`[storage] yükləmə xətası (${path}):`, res.status, await res.text().catch(() => ""));
    }
    return res.ok;
  } catch (err) {
    console.error(`[storage] yükləmə xətası (${path}):`, err);
    return false;
  }
}

// Kəsilmiş (LLM-ə göndərilən) şəkil — HƏMİŞƏ cəhd edilir, `ocr_captures.storage_path`/
// `width`/`height`/`bytes` bunun üzərindən doldurulur (spesifikasiyanın "əsas" şəkli).
// Orijinal kəsilməmiş kadr `rawBytes` verilibsə PARALEL yüklənir — uğursuzluğu crop-un
// nəticəsinə TƏSİR ETMİR (iki müstəqil best-effort cəhd).
export async function uploadCaptureImages(opts: {
  idHint: string;
  cropBytes: Buffer;
  cropMime: string;
  rawBytes: Buffer | null;
  rawMime: string | null;
}): Promise<CaptureImageMeta | null> {
  const cropPath = objectPath(opts.idHint, "crop");
  const [cropOk, dims] = await Promise.all([
    putObject(cropPath, opts.cropBytes, opts.cropMime),
    sharp(opts.cropBytes)
      .metadata()
      .then((m) => ({ width: m.width ?? null, height: m.height ?? null }))
      .catch((err) => {
        console.error("[storage] ölçü oxuma xətası:", err);
        return { width: null, height: null };
      }),
    opts.rawBytes
      ? putObject(objectPath(opts.idHint, "raw"), opts.rawBytes, opts.rawMime || "image/jpeg")
      : Promise.resolve(false),
  ]);

  if (!cropOk) return null;
  return { storagePath: cropPath, width: dims.width, height: dims.height, bytes: opts.cropBytes.length };
}

// Debug/forensika üçün — ClickUp S1-in "signed URL ilə açılır" qəbul şərti. Bucket PRIVATE-dir
// və heç bir oxu policy-si yoxdur (bax `0057`), ona görə `storage_path` bilinsə belə birbaşa
// URL işləmir — YALNIZ bu funksiya (service-role ilə RLS bypass edərək) müvəqqəti giriş verə
// bilər. Hazırda heç bir UI onu çağırmır (admin panel yoxdur) — Cowork/Claude Code bir DB
// forensikasında (blok 95-in təkrarı) əl ilə çağırmaq üçün ixrac olunur.
export async function createSignedCaptureUrl(storagePath: string, expiresInSec = 3600): Promise<string | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${storagePath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: expiresInSec }),
    });
    if (!res.ok) {
      console.error(`[storage] imzalama xətası (${storagePath}):`, res.status, await res.text().catch(() => ""));
      return null;
    }
    const body = (await res.json()) as { signedURL?: string };
    return body.signedURL ? `${SUPABASE_URL}/storage/v1${body.signedURL}` : null;
  } catch (err) {
    console.error(`[storage] imzalama xətası (${storagePath}):`, err);
    return null;
  }
}
