// Transcribe/finish üçün soak qapısı — şagird yoluna toxunmur.

import type { Pool } from "pg";
import { checkSoakHealth } from "./adapter";
import {
  resolveSoakMode,
  soakBlockedError,
  type SoakMode,
} from "./mode";

export type SoakGate =
  | { ok: true; mode: Exclude<SoakMode, { kind: "blocked" }> }
  | { ok: false; status: number; error: string };

export async function soakGate(pool: Pool, inviteCode: string, signal?: AbortSignal): Promise<SoakGate> {
  const mode = await resolveSoakMode(pool, inviteCode);
  if (mode.kind === "blocked") {
    const { status, error } = soakBlockedError(mode.reason);
    return { ok: false, status, error };
  }
  if (mode.kind === "chatgpt_web") {
    const health = await checkSoakHealth(signal);
    if (!health.ok) {
      const { status, error } = soakBlockedError(health.reason);
      return { ok: false, status, error };
    }
  }
  return { ok: true, mode };
}
