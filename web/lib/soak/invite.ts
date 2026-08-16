// Client-safe: kamera səhifəsi `app-config` (DB) idxal etmədən soak dəvəti tanıyır.
// Server `mode.ts` eyni funksiyanı re-export edir — iki nüsxə yoxdur.

export function isSoakInvite(inviteCode: unknown): boolean {
  return typeof inviteCode === "string" && inviteCode.startsWith("soak-");
}
