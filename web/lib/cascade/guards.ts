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

// `INVITE_CODES` (vergüllə ayrılmış, ADR-012) — sinxron, DB toxunmur.
// Qapı yoxlaması: `POST /api/invite/check` (86eymrm6g). Redeem BURADA deyil.
export function checkInviteCode(inviteCode: unknown): InviteCheck {
  const validCodes = new Set(
    (process.env.INVITE_CODES ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
  );
  if (typeof inviteCode !== "string" || !validCodes.has(inviteCode)) return { ok: false };
  return { ok: true, studentRef: inviteCode };
}

// HANDOFF (81/82) S4/S5: kodun bu (kod, cihaz) cütündə İLK dəfə görüldüyünü qeyd edir.
// Yalnız `/api/solve/transcribe`-də (ilk toxunma nöqtəsi) çağırılır — `/finish`-də TƏKRAR
// çağırmağa ehtiyac yoxdur (`on conflict do nothing` idempotentdir, amma bir dəfə kifayətdir).
export async function logInviteRedemption(pool: Pool, inviteCode: string, deviceId: string): Promise<void> {
  try {
    const { rows } = await pool.query<{ inserted: boolean }>(
      `insert into invite_redemptions (code, device_id)
       values ($1, $2)
       on conflict (code, device_id) do nothing
       returning true as inserted`,
      [inviteCode, deviceId]
    );
    if (rows.length > 0) {
      await pool
        .query(
          `insert into events (event_id, device_id, attempt_id, name, props)
           values ($1,$2,$3,'invite_redeemed',$4)`,
          [randomUUID(), deviceId, null, JSON.stringify({ code: inviteCode })]
        )
        .catch((err) => console.error("[cascade/guards] invite_redeemed telemetriya xətası:", err));
    }
  } catch (err) {
    console.error("[cascade/guards] invite_redemptions yazı xətası:", err);
    await pool
      .query(
        `insert into events (event_id, device_id, attempt_id, name, props)
         values ($1,$2,$3,'invite_redemption_failed',$4)`,
        [randomUUID(), deviceId, null, JSON.stringify({ code: inviteCode, error: err instanceof Error ? err.message : String(err) })]
      )
      .catch((eventErr) => console.error("[cascade/guards] invite_redemption_failed telemetriya xətası:", eventErr));
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
