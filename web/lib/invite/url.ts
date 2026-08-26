// Universal helper for URL-based invite codes (?invite=CODE, ?code=CODE, ?invite_code=CODE)
// Eliminates manual 8-char typing friction for real students while keeping security.

export const INVITE_STORAGE_KEY = "th_invite_code";

const MAX_INVITE_LEN = 64;

/**
 * Extracts and sanitizes an invite code from a URL search string.
 * Handles ?invite=, ?code=, ?invite_code=, percent-decoding, and trailing punctuation
 * (e.g. "CODE." or "CODE," often appended by messaging apps like WhatsApp/Telegram).
 */
export function extractInviteCodeFromSearch(search: string): string | null {
  if (!search) return null;
  const cleanSearch = search.startsWith("?") ? search : `?${search}`;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(cleanSearch);
  } catch {
    return null;
  }

  const raw = params.get("invite") ?? params.get("code") ?? params.get("invite_code");
  if (!raw) return null;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Malformed URI sequence, keep raw
  }

  // Clean trailing punctuation (WhatsApp/Telegram sentence ends like "link.az/?invite=CODE.")
  const code = decoded.trim().replace(/[.,!?;:]+$/, "").trim();
  if (!code || code.length > MAX_INVITE_LEN) return null;

  return code;
}

/**
 * Removes invite parameters from browser address bar using history.replaceState
 * so invite parameters do not linger or leak if URL is copied/shared.
 * Preserves other parameters like utm_source.
 */
export function cleanInviteFromUrl(): void {
  if (typeof window === "undefined" || !window.location) return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of ["invite", "code", "invite_code"]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  } catch {
    // Safe ignore if URL manipulation fails in non-standard environment
  }
}

export type InviteCheckResult = "ok" | "invalid" | "already_used" | "network";

/**
 * Validates the invite code against /api/invite/check with the same body as InviteGate:
 * `{ invite_code, device_id }`. Same-device return must send device_id or a redeemed
 * code always 409s. Do not import getDeviceId here — telemetry is `"use client"` and
 * this module is also loaded by url.selftest.mts.
 */
export async function validateAndStoreInviteCode(
  code: string,
  deviceId: string,
): Promise<InviteCheckResult> {
  const clean = code.trim();
  if (!clean) return "invalid";
  try {
    const res = await fetch("/api/invite/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: clean, device_id: deviceId }),
    });
    if (res.ok) {
      try {
        localStorage.setItem(INVITE_STORAGE_KEY, clean);
      } catch {
        // localStorage not available
      }
      return "ok";
    }
    if (res.status === 403) return "invalid";
    if (res.status === 409) return "already_used";
    return "network";
  } catch {
    return "network";
  }
}
