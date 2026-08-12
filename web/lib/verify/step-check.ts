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

export type StepDistractor = { match?: unknown; error_code?: string; message?: string };

export type RevealedStepAnswer =
  | { accept?: unknown; input_kind?: string; distractors?: unknown }
  | null
  | undefined;

export type StepCheckResult =
  | { ok: true; correct: boolean; distractor?: { error_code: string; message: string } }
  | { ok: false; error: "step_not_found" };

// ClickUp "Distraktor cədvəli — səhv cavab reaksiyası LLM-siz" (HANDOFF 83): şagirdin SƏHV
// cavabı GÖZLƏNİLƏN bir səhvlə (`private.step_answers.distractors`, 0039/0040) üst-üstə
// düşürsə, LLM çağırmadan konkret diaqnostik mesaj qaytarılır. Yalnız TEMPLATE-authored
// suallarda (217 generasiya sualı) doludur — LLM-authored suallarda `distractors` YOXDUR,
// bu halda sadəcə `correct:false` qalır (mövcud davranış dəyişmir).
export function resolveStepCheck(revealed: RevealedStepAnswer, answer: string): StepCheckResult {
  if (!revealed || !Array.isArray(revealed.accept)) {
    return { ok: false, error: "step_not_found" };
  }
  const accept = revealed.accept as string[];
  if (accept.some((a) => studentAnswerMatches(answer, a))) {
    return { ok: true, correct: true };
  }

  const distractors = Array.isArray(revealed.distractors) ? (revealed.distractors as StepDistractor[]) : [];
  const hit = distractors.find(
    (d) => Array.isArray(d.match) && (d.match as string[]).some((m) => studentAnswerMatches(answer, m))
  );
  if (hit && hit.error_code && hit.message) {
    return { ok: true, correct: false, distractor: { error_code: hit.error_code, message: hit.message } };
  }
  return { ok: true, correct: false };
}
