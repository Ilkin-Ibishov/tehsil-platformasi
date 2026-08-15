// Faza 2 S0 / ADR-029 — soak yalnız `soak-*` dəvətdə açılır.
// Şagird dəvəti `soak_enabled=1` olsa belə Gemini-də qalır. Soak sönük olanda
// `soak-*` Gemini-yə düşmür (avtomatik keçid yoxdur).

import { getBoolConfig, readConfigValue } from "../app-config";

type PoolLike = { query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }> };

export const STUDENT_LLM_ABORT_MS = 45_000;
export const SOAK_LLM_ABORT_MS = 160_000;

export type SoakProvider = "chatgpt_web" | "gemini";

export type SoakMode =
  | { kind: "student" }
  | { kind: "blocked"; reason: "disabled" | "missing_env" | "unhealthy" | "auth" }
  | { kind: "chatgpt_web" }
  | { kind: "gemini" };

export function isSoakInvite(inviteCode: unknown): boolean {
  return typeof inviteCode === "string" && inviteCode.startsWith("soak-");
}

export function llmAbortMs(mode: SoakMode): number {
  return mode.kind === "chatgpt_web" ? SOAK_LLM_ABORT_MS : STUDENT_LLM_ABORT_MS;
}

export function soakBlockedError(reason: Extract<SoakMode, { kind: "blocked" }>["reason"]): {
  status: number;
  error: string;
} {
  if (reason === "disabled") return { status: 503, error: "soak_disabled" };
  if (reason === "missing_env") return { status: 503, error: "soak_misconfigured" };
  if (reason === "auth") return { status: 503, error: "soak_auth_expired" };
  return { status: 503, error: "soak_unavailable" };
}

export function attemptKindFor(mode: SoakMode): "photo_solve" | "corpus_soak" {
  return mode.kind === "student" || mode.kind === "blocked" ? "photo_solve" : "corpus_soak";
}

export function usesSoakAdapter(mode: SoakMode): boolean {
  return mode.kind === "chatgpt_web";
}

export function skipImageCache(mode: SoakMode): boolean {
  return mode.kind === "chatgpt_web" || mode.kind === "gemini";
}

export async function resolveSoakMode(pool: PoolLike, inviteCode: string): Promise<SoakMode> {
  if (!isSoakInvite(inviteCode)) return { kind: "student" };

  const enabled = await getBoolConfig(pool, "soak_enabled", "SOAK_ENABLED");
  if (!enabled) return { kind: "blocked", reason: "disabled" };

  const fromDb = await readConfigValue(pool, "soak_provider");
  const raw = (fromDb || process.env.SOAK_PROVIDER || "chatgpt_web").trim();
  if (raw === "gemini") return { kind: "gemini" };
  if (raw !== "chatgpt_web") return { kind: "blocked", reason: "disabled" };

  if (!process.env.SOAK_LLM_BASE_URL || !process.env.SOAK_LLM_API_KEY) {
    return { kind: "blocked", reason: "missing_env" };
  }
  return { kind: "chatgpt_web" };
}
