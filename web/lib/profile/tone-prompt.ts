import type { PedagogicalTone } from "./types";

const ADDENDA: Record<PedagogicalTone, string> = {
  dostyana:
    "İZAH ÜSLUBU: Dostyana — həvəsləndirici, sadə dil, emosional dəstək. Şagirdi ruhlandır; cavabı və ya növbəti addımın nəticəsini sızdırma.",
  yetkin:
    "İZAH ÜSLUBU: Yetkin/müəllim — DİM standartı, akademik, dəqiq riyazi terminologiya. Qısa motivasiya yox, dəqiq izah.",
  qisa:
    "İZAH ÜSLUBU: Qısa və konkret — yalnız əsas formul və əməllər. Minimum söz; cavabı sızdırma.",
};

export function normalizePedagogicalTone(raw: unknown): PedagogicalTone {
  if (raw === "dostyana" || raw === "qisa" || raw === "yetkin") return raw;
  return "yetkin";
}

/** Appended to the solve system prompt (Qat 5 / monolit). Does not change STEP-SCHEMA. */
export function pedagogicalToneAddendum(tone: PedagogicalTone | string | null | undefined): string {
  const key = normalizePedagogicalTone(tone);
  return `\n\n${ADDENDA[key]}`;
}
