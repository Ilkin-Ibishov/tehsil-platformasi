// Kaskad Qat 5 — TAM HƏLL, amma MƏTN üzərində (ClickUp 86eykj7tu, ADR-020).
//
// Qat 2/3/4-ün heç biri cavab verə bilmədikdə işə düşür: həndəsə, mətn məsələsi, bankda
// olmayan yeni struktur. `prompts/solve/core.md` promptunun EYNİSİ işlədilir — dəyişən
// yalnız girişdir: şəkil YOX, `{{#if text}}` budağı VAR.
//
// ═══ NİYƏ ŞƏKİL GÖNDƏRİLMİR ═══
//
// Taskın qaydası: "Şəkli yalnız bir çağırış görür. Həmişə." Səbəb ikiqatdır — (a) vision
// tokenləri iki dəfə ödənilir, (b) iki çağırış eyni şəkli FƏRQLİ oxuya bilər və şagird
// hansının doğru olduğunu bilmir.
//
// BU, `ADR-014` R1-in AÇIQ RİSKİDİR və qəsdən qəbul edilir: R1 həndəsədə şəkli Qat 5-ə də
// ötürməyi təklif edirdi. `ADR-020` bunun əvəzinə Qat 1-in promptuna `has_figure` + "fiquru
// SÖZLƏ təsvir et" tələbini qoyur. Risk YOX OLMUR — ölçülür (`has_figure=true` olan həllərin
// dəqiqliyi ayrıca izlənir, ADR-020 qapısı).
//
// Prompt/mətn müqaviləsi `prompt_loader.py` ilə eynidir, yəni `BULK-EVAL.md`-in mətn girişli
// dəsti bu qatı BİRBAŞA ölçə bilir (ADR-014 §"Eval strategiyası ilə üst-üstə düşür").

import { loadPromptTemplates, renderUserPrompt } from "../prompt";
import { callVisionLLM, type LLMUsage } from "../llm";
import { computeCostUsd } from "../cost";
import { validateStep } from "../verify/schema";
import type { CascadeContext, FinalAnswer, LayerSolution, PublicStep, RawStep, SolveLayer, StepAnswerRow } from "./types";

type StepSchemaOutput = {
  status?: string;
  canonical?: string;
  final_answer?: FinalAnswer;
  steps?: RawStep[];
  [key: string]: unknown;
};

// STEP-SCHEMA `check.accept` `private.step_answers`-ə köçür — public `steps` ondan AYRILIR
// (ADR-017 / test-bank design.md §6: "check obyekti yalnız ask və input_kind saxlayır").
export function stripAccept(steps: NonNullable<StepSchemaOutput["steps"]>): PublicStep[] {
  return steps.map((step) => {
    const checkRest = { ...step.check } as Record<string, unknown>;
    delete checkRest.accept;
    return { ...step, check: checkRest };
  });
}

// `app.store_step_answers(q, rows)` gözlədiyi forma: [{step_index, accept, input_kind}, ...],
// yalnız `check.accept` olan addımlar üçün (`0018`-dəki funksiya imzası).
export function buildStepAnswerRows(steps: NonNullable<StepSchemaOutput["steps"]>): StepAnswerRow[] {
  return steps
    .filter((step) => Array.isArray(step.check?.accept) && typeof step.index === "number")
    .map((step) => ({
      step_index: step.index,
      accept: step.check!.accept,
      input_kind: step.check?.input_kind ?? "number",
    }));
}

export function makeTextSolveLayer(): SolveLayer {
  return {
    id: "llm_text",
    async run(ctx: CascadeContext): Promise<LayerSolution | null> {
      const { system, userTemplate } = loadPromptTemplates();
      // `renderUserPrompt`-un 5-ci arqumenti `{{#if text}}` budağını açır — şəkil budağı
      // (`{{#if image}}`) HƏMİŞƏ silinir (python tərəfin öz davranışı, bax prompt.ts).
      const userPrompt = renderUserPrompt(
        userTemplate,
        ctx.transcript.grade,
        ctx.transcript.subject,
        ctx.locale,
        ctx.transcript.canonical
      );

      let parsed: StepSchemaOutput | null = null;
      let usage: LLMUsage | null = null;
      let latencyMs = 0;

      for (let call = 1; call <= 2; call++) {
        if (ctx.signal?.aborted) break;
        let result;
        try {
          // `imageBase64` VERİLMİR → `llm.ts` mətn-yalnız sorğu qurur, vision tokeni ödənilmir.
          result = await callVisionLLM({ systemPrompt: system, userPrompt, signal: ctx.signal });
        } catch (err) {
          if (ctx.signal?.aborted) break;
          console.error(`[cascade/solve-text] LLM çağırışı xətası (cəhd ${call}):`, err);
          continue;
        }
        usage = result.usage;
        latencyMs = result.latencyMs;

        const check = validateStep(result.parsed);
        if (check.valid) {
          parsed = result.parsed as StepSchemaOutput;
          break;
        }
        console.error(`[cascade/solve-text] sxem etibarsız (cəhd ${call}):`, check.errors, "xam çıxış:", result.rawText);
      }

      // Bu qat kaskadın SONUDUR — `null` "növbəti qata keç" deyil, "həll alınmadı" deməkdir.
      // `/api/solve` bunu `unreadable` kimi göstərir (monolit yolun eyni davranışı).
      if (!parsed) return null;

      // Qat 1 ARTIQ imtina qapısıdır — Qat 5-in yenidən imtina etməsi gözlənilməzdir (o,
      // şəkli görmür, yalnız mətn alır). Baş verərsə həll YOXDUR, `null`.
      if (parsed.status && parsed.status !== "ok") {
        console.error(`[cascade/solve-text] mətn girişində gözlənilməz imtina: ${parsed.status}`);
        return null;
      }

      const finalAnswer = parsed.final_answer;
      const rawSteps = parsed.steps ?? [];
      if (!finalAnswer || rawSteps.length === 0) return null;

      return {
        layer: "llm_text",
        matchPath: "llm",
        steps: stripAccept(rawSteps),
        newQuestion: {
          finalAnswer,
          stepAnswerRows: buildStepAnswerRows(rawSteps),
          rawSteps,
        },
        costUsd: computeCostUsd(usage),
        latencyMs,
        usage,
      };
    },
  };
}
