// Kaskadın iki yeni endpointi (`/api/solve/transcribe`, `/api/solve/finish`) üçün paylaşılan
// giriş yoxlamaları — ADR-020 davamı, ClickUp 86eykj7x2.
//
// QƏSDƏN `web/app/api/solve/route.ts`-dən İMPORT EDİLMİR: monolitin davranışı "bayt-bayt
// dəyişməz" qalmalıdır (ADR-020) — onun içindəki məntiqi paylaşılan funksiyaya çıxarmaq
// refaktorinq riski daşıyır (yoxlanmış davranışı toxunmadan saxlamaq çətinləşir). Burada
// EYNİ qaydalar TƏKRAR yazılıb, monolitə TOXUNULMADAN.

import { randomUUID } from "node:crypto";
import type { Pool } from "pg";

export const DAILY_LIMIT = 30;

export type InviteCheck = { ok: true; studentRef: string } | { ok: false };

// Pilot və sınaq üçün aktiv olan standart fərdi dəvət kodları
const DEFAULT_PILOT_INVITES = new Set<string>([
  ...Array.from({ length: 50 }, (_, i) => `invite${String(i + 1).padStart(2, "0")}`), // invite01 .. invite50
  ...Array.from({ length: 50 }, (_, i) => `ilkin-${String(i + 1).padStart(2, "0")}`), // ilkin-01 .. ilkin-50
  ...Array.from({ length: 20 }, (_, i) => `soak-dim-${String(i + 1).padStart(2, "0")}`), // soak-dim-01 .. soak-dim-20
  ...Array.from({ length: 20 }, (_, i) => `test-${String(i + 1).padStart(2, "0")}`), // test-01 .. test-20
  "ilkin2026",
  "tehsil2026",
]);

export function getAllValidInviteCodes(): Set<string> {
  const codes = new Set<string>(DEFAULT_PILOT_INVITES);
  const envVal = process.env.INVITE_CODES ?? "";
  for (const c of envVal.split(",")) {
    const trimmed = c.trim().toLowerCase();
    if (trimmed) codes.add(trimmed);
  }
  return codes;
}

// `INVITE_CODES` (vergüllə ayrılmış, ADR-012) + pilot kodlar — sinxron, DB toxunmur.
export function checkInviteCode(inviteCode: unknown): InviteCheck {
  if (typeof inviteCode !== "string") return { ok: false };
  const norm = inviteCode.trim().toLowerCase();
  if (!norm) return { ok: false };
  const validCodes = getAllValidInviteCodes();
  if (!validCodes.has(norm)) return { ok: false };
  return { ok: true, studentRef: norm };
}

// Single-user / Single-device yoxlaması: Dəvət kodunun başqa bir cihaz tərəfindən artıq istifadə edilmədiyini yoxlayır
export async function checkInviteAvailableForDevice(
  pool: Pool,
  inviteCode: string,
  deviceId?: string
): Promise<{ available: boolean; reason?: "already_claimed_by_another_device" }> {
  const norm = inviteCode.trim().toLowerCase();
  try {
    const { rows } = await pool.query<{ device_id: string }>(
      `select device_id from invite_redemptions where lower(code) = $1 limit 1`,
      [norm]
    );
    if (rows.length > 0) {
      if (deviceId && rows[0].device_id === deviceId) {
        return { available: true };
      }
      return { available: false, reason: "already_claimed_by_another_device" };
    }
    return { available: true };
  } catch (err) {
    console.error("[guards] checkInviteAvailableForDevice error:", err);
    return { available: true }; // DB xətası zamanı fail-open
  }
}

// HANDOFF (81/82) S4/S5: kodun bu (kod, cihaz) cütündə İLK dəfə görüldüyünü qeyd edir.
// Hər bir invite kodu yalnız 1 nəfər (1 cihaz) tərəfindən istifadə edilə bilər.
export async function logInviteRedemption(pool: Pool, inviteCode: string, deviceId: string): Promise<boolean> {
  const norm = inviteCode.trim().toLowerCase();
  try {
    const { rows: existing } = await pool.query<{ device_id: string }>(
      `select device_id from invite_redemptions where lower(code) = $1 limit 1`,
      [norm]
    );
    if (existing.length > 0 && existing[0].device_id !== deviceId) {
      console.warn(`[cascade/guards] Invite ${norm} artıq başqa cihaz tərəfindən istifadə edilib: ${existing[0].device_id}`);
      return false;
    }

    const { rows } = await pool.query<{ inserted: boolean }>(
      `insert into invite_redemptions (code, device_id)
       values ($1, $2)
       on conflict (code, device_id) do nothing
       returning true as inserted`,
      [norm, deviceId]
    );
    if (rows.length > 0) {
      await pool
        .query(
          `insert into events (event_id, device_id, attempt_id, name, props)
           values ($1,$2,$3,'invite_redeemed',$4)`,
          [randomUUID(), deviceId, null, JSON.stringify({ code: norm })]
        )
        .catch((err) => console.error("[cascade/guards] invite_redeemed telemetriya xətası:", err));
    }
    return true;
  } catch (err) {
    console.error("[cascade/guards] invite_redemptions yazı xətası:", err);
    return true;
  }
}

// S5 invariantı: YALNIZ `delivered=true` sayılır.
//
// `a.kind = 'photo_solve'` — ClickUp 86eykhve0 (bank UI) əlavə etdiyi filtr. `DAILY_LIMIT`-in
// STATED məqsədi LLM XƏRCİNİ məhdudlaşdırmaqdır (bax bu faylın yuxarısı, SYSTEM-REVIEW §C1).
// Bank sualları (`kind='bank_practice'`) SIFIR LLM xərci daşıyır — onları eyni sayğaca
// qatmaq şagirdin kamera büdcəsini bank təcrübəsi ilə AZALDARDI, DAILY_LIMIT-in öz
// məqsədinə ZİDDDİR. `delivered=true` bank sətirlərində DƏ yazılır (Faza 1 qapısının
// "100+ real həll" metrikası üçün, ADR-020-dən AYRI qərar) — sayğacdan İSTİSNASI YALNIZ
// bu filtrlə təmin olunur.
export async function checkDailyLimit(pool: Pool, deviceId: string): Promise<{ blocked: boolean; dailyCount: number }> {
  const { rows } = await pool.query<{ c: number }>(
    `select count(*)::int as c
       from attempt_items ai
       join attempts a on a.id = ai.attempt_id
      where a.device_id = $1 and ai.delivered = true and a.kind = 'photo_solve'
        and ai.created_at >= date_trunc('day', now())`,
    [deviceId]
  );
  const dailyCount = rows[0]?.c ?? 0;
  return { blocked: dailyCount >= DAILY_LIMIT, dailyCount };
}

// `web/app/api/solve/route.ts`-dəki `logEvent`-in EYNİSİ — monolitə TOXUNMADAN paylaşılan
// nüsxə (bu faylın başlığındaki qərara bax). Telemetriya HEÇ VAXT axını bloklamır.
export async function logEvent(
  pool: Pool,
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
    .catch((err) => console.error(`[cascade/guards] ${name} telemetriya xətası:`, err));
}

// SYSTEM-REVIEW §C1: qlobal gündəlik xərc tavanı, device_id-dən AYRI (dəvət kodu paylaşılan
// sirrdir). `DAILY_COST_CEILING_USD` təyin edilməyibsə tavan YOXDUR.
export async function checkCostCeiling(pool: Pool): Promise<{ blocked: boolean; dailyCostUsd: number }> {
  const ceiling = Number(process.env.DAILY_COST_CEILING_USD);
  if (!Number.isFinite(ceiling) || ceiling <= 0) return { blocked: false, dailyCostUsd: 0 };
  const { rows } = await pool.query<{ total: number }>(
    `select coalesce(sum(cost_usd), 0)::float8 as total from attempt_items
     where created_at >= date_trunc('day', now())`
  );
  const dailyCostUsd = rows[0]?.total ?? 0;
  return { blocked: dailyCostUsd >= ceiling, dailyCostUsd };
}
