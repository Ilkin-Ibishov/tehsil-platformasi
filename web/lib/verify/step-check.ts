// HANDOFF (73): `/api/steps/check`-in DB-dən asılı olmayan qərar məntiqi buraya çıxarılıb ki,
// route-un digər layihə faylları kimi (`verify/answer.ts`, `verify/leak.ts`) selftest ilə
// yoxlanıla bilsin — real Postgres olmadan.
//
// İki qayda test edilir:
// 1. `step_index` massiv MÖVQEYİ (0-based) deyil, STEP-SCHEMA `index` sahəsidir (minimum 1).
//    `0` və mənfi/tam olmayan dəyərlər RƏDD EDİLİR.
// 2. `reveal_step_answer` heç nə tapmasa (`null`/`accept` massiv deyil), nəticə AÇIQ xəta
//    olmalıdır (`ok:false`) — səssiz `correct:false` YOX. Əvvəlki massiv-mövqe "körpüsü" bu
//    fərqi gizlədə bilirdi (dil fallback-ında yanlış addımı "tapıb" səhv nəticə verə bilərdi).

import { studentAnswerMatches } from "./answer";

export function validateStepIndex(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) >= 1 ? (value as number) : null;
}

export type RevealedStepAnswer = { accept?: unknown; input_kind?: string } | null | undefined;

export type StepCheckResult = { ok: true; correct: boolean } | { ok: false; error: "step_not_found" };

export function resolveStepCheck(revealed: RevealedStepAnswer, answer: string): StepCheckResult {
  if (!revealed || !Array.isArray(revealed.accept)) {
    return { ok: false, error: "step_not_found" };
  }
  const accept = revealed.accept as string[];
  const correct = accept.some((a) => studentAnswerMatches(answer, a));
  return { ok: true, correct };
}
