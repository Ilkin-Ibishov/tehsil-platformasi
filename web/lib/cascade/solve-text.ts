// Kaskad Qat 5 — TAM HƏLL, amma MƏTN üzərində (ClickUp 86eykj7tu, ADR-020).
//
// Qat 2/3/4-ün heç biri cavab verə bilmədikdə işə düşür: həndəsə, mətn məsələsi, bankda
// olmayan yeni struktur. `ADR-030`: nüvə `core.md` + fənn + (varsa) `math/{topic}.md`.
// Şəkil-girişi Qat 1-də qalır — Qat 5 `includeImageRules: false`.
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

import type { Pool } from "pg";
import { loadPromptTemplates, renderUserPrompt } from "../prompt";
import { callVisionLLM, type LLMUsage } from "../llm";
import { streamVisionLLM } from "../llm-stream";
import { computeCostUsd } from "../cost";
import { getActiveModel } from "../models";
import { validateStep } from "../verify/schema";
import { parseVisual, stripUnknownVisual } from "../visual";
import { callSoakChat, SoakTransportError } from "../soak/adapter";
import { pedagogicalToneAddendum } from "../profile/tone-prompt";
import { extractNewDisplayableSteps, toPublicPreviewStep } from "./stream-steps";
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

// ADR-023: `pool` YENİ — model artıq DB-dən (`public.app_config.active_model`) oxunur,
// `getActiveModel` env-ə (`GEMINI_MODEL`) yalnız DB sətri yoxdursa/DB əlçatmazdırsa düşür.
export function makeTextSolveLayer(pool: Pool): SolveLayer {
  return {
    id: "llm_text",
    async run(ctx: CascadeContext): Promise<LayerSolution | null> {
      const loaded = loadPromptTemplates({
        subject: ctx.transcript.subject,
        topicCode: ctx.transcript.topicCode,
        includeImageRules: false,
      });
      const system = loaded.system + pedagogicalToneAddendum(ctx.pedagogicalTone);
      const userTemplate = loaded.userTemplate;
      // `renderUserPrompt`-un 5-ci arqumenti `{{#if text}}` budağını açır — şəkil budağı
      // (`{{#if image}}`) HƏMİŞƏ silinir (python tərəfin öz davranışı, bax prompt.ts).
      const userPrompt = renderUserPrompt(
        userTemplate,
        ctx.transcript.grade,
        ctx.transcript.subject,
        ctx.locale,
        ctx.transcript.canonical
      );
      const activeModel = await getActiveModel(pool);

      let parsed: StepSchemaOutput | null = null;
      let usage: LLMUsage | null = null;
      let latencyMs = 0;
      let usedModel = activeModel;
      let fallbackUsed = false;
      let fallbackFrom: string | null = null;

      for (let call = 1; call <= 2; call++) {
        if (ctx.signal?.aborted) break;
        let result;
        try {
          if (ctx.useSoakAdapter) {
            result = await callSoakChat({ systemPrompt: system, userPrompt, signal: ctx.signal });
          } else if (ctx.onPublicStep && call === 1) {
            let emitted = 0;
            result = await streamVisionLLM({
              systemPrompt: system,
              userPrompt,
              model: activeModel,
              signal: ctx.signal,
              useContextCache: true,
              onDelta: (accumulated: string) => {
                const { steps: fresh, emittedCount } = extractNewDisplayableSteps(accumulated, emitted);
                emitted = emittedCount;
                for (const raw of fresh) {
                  try {
                    ctx.onPublicStep?.(toPublicPreviewStep(raw));
                  } catch (err) {
                    console.error("[cascade/solve-text] onPublicStep xətası:", err);
                  }
                }
              },
            });
          } else {
            result = await callVisionLLM({
              systemPrompt: system,
              userPrompt,
              model: activeModel,
              signal: ctx.signal,
              useContextCache: true,
            });
          }
        } catch (err) {
          if (err instanceof SoakTransportError) throw err;
          if (ctx.signal?.aborted) break;
          console.error(`[cascade/solve-text] LLM çağırışı xətası (cəhd ${call}):`, err);
          continue;
        }
        usage = result.usage;
        latencyMs = result.latencyMs;
        usedModel = result.model;
        if ('fallbackUsed' in result && result.fallbackUsed) {
          fallbackUsed = true;
          fallbackFrom = (result as { fallbackFrom: string | null }).fallbackFrom;
        }

        const stripped = stripUnknownVisual(result.parsed);
        const check = validateStep(stripped);
        if (check.valid) {
          parsed = stripped as StepSchemaOutput;
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
        visual: parseVisual(parsed.visual),
        newQuestion: {
          finalAnswer,
          stepAnswerRows: buildStepAnswerRows(rawSteps),
          rawSteps,
          model: usedModel,
        },
        costUsd: computeCostUsd(usage, usedModel),
        latencyMs,
        usage,
        fallbackUsed,
        fallbackFrom,
      };
    },
  };
}
