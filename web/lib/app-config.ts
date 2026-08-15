// `public.app_config` (`ADR-023`, `0056`) — key/value cədvəli, redeploy-suz dəyişdirilə bilən
// runtime konfiqurasiya üçün. Əvvəlcə yalnız `web/lib/models.ts` (`active_model`) işlədirdi —
// bura köçürüldü ki, model seçimi VƏ feature flag-lər (bax `getBoolConfig`) EYNİ mexanizmi
// paylaşsın, ikisi ayrı-ayrı yenidən yazılmasın.
//
// DB sorğusu UĞURSUZ olsa və ya sətir yoxdursa, çağıran env-ə geri düşür — `ADR-022`-nin
// "DB/env MƏCBURİYYƏT deyil, rahatlıq qatıdır" prinsipi. Geri-düşmə SƏSSİZ DEYİL — konsola
// yazılır ki, "niyə DB dəyəri işləmədi" sualı loglardan cavablana bilsin.
type PoolLike = { query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }> };

export async function readConfigValue(pool: PoolLike, key: string): Promise<string | null> {
  try {
    const { rows } = await pool.query<{ value: string }>(`select value from public.app_config where key = $1`, [key]);
    return rows[0]?.value ?? null;
  } catch (err) {
    console.error(`[app-config] app_config oxuna bilmədi (key=${key}), env fallback-a düşülür:`, err);
    return null;
  }
}

// Feature flag oxuyur: əvvəlcə DB (`"1"` = açıq), sonra env-i (`process.env[envKey] === "1"`).
// İkisi də yoxdursa sönük. `CASCADE_ENABLED`/`NEXT_PUBLIC_CASCADE_ENABLED`-in Vercel env-dən
// DB-yə köçürülməsi üçün (2026-08-15, Ilkin-in tapşırığı) — env dəyəri hələ də işləyir, DB
// sətri VARSA onu ÜSTÜN tutur.
export async function getBoolConfig(pool: PoolLike, dbKey: string, envKey: string): Promise<boolean> {
  const fromDb = await readConfigValue(pool, dbKey);
  if (fromDb !== null) return fromDb === "1";
  return process.env[envKey] === "1";
}
