// Token × tarif = xərc. Eval (`scripts/lib/cost.py`) eyni qaydanı işlətməlidir.
import type { LLMUsage } from "./llm";
import { normalizeUsage } from "./llm";
import { resolvePrice } from "./models";

function finiteNum(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

// Provayder USD göndəribsə (OpenRouter `usage.cost`) onu götür. Gemini göndərmir.
export function providerReportedCostUsd(usage: LLMUsage): number | null {
  const billed = finiteNum(usage.cost_usd) ?? finiteNum(usage.cost);
  return billed !== undefined && billed >= 0 ? billed : null;
}

// Google: düşünmə tokeni çıxış tarifindədir. Gemini-nin OpenAI qatı bunu tez-tez
// `completion_tokens`-a QOYMUR — `total_tokens = prompt + completion + thoughts`.
// `total - prompt` həm görünən çıxışı, həm düşünməni tutur; `total ≈ prompt+completion`
// olanda düşünmə artıq completion-dadır, iki dəfə sayılmır.
export function billableOutputTokens(usage: LLMUsage | null): number | null {
  if (!usage) return null;
  const prompt = usage.prompt_tokens ?? 0;
  const completion = usage.completion_tokens ?? 0;
  const total = usage.total_tokens;
  const reasoning = usage.completion_tokens_details?.reasoning_tokens ?? usage.thoughts_token_count ?? 0;
  if (total !== undefined && total >= prompt) return Math.max(0, total - prompt);
  // OpenAI: reasoning_tokens completion-un alt çoxluğudur. Gemini OpenAI qatı
  // (total yoxdursa) thinking-i ayrıca saxlayır. completion ≥ reasoning → alt çoxluq.
  if (reasoning > 0 && completion >= reasoning) return completion;
  return completion + reasoning;
}

export function billablePromptTokens(usage: LLMUsage | null): number | null {
  if (!usage) return null;
  return usage.prompt_tokens ?? 0;
}

// ADR-022/027/028: tarif registridən. Cavab USD vermirsə token × tarif.
//
// NİYƏ `null` QAYTARILIR (0 YOX): qiymət bilinmirsə xərc BİLİNMİR. `0` yazmaq
// `DAILY_COST_CEILING_USD` tavanını yalan edər.
export function computeCostUsd(usage: LLMUsage | null, modelId: string): number | null {
  const normalized = usage ? normalizeUsage(usage) ?? usage : null;
  if (!normalized) return null;

  const reported = providerReportedCostUsd(normalized);
  if (reported !== null) return reported;

  const price = resolvePrice(modelId);
  if (!price) return null;

  const prompt = billablePromptTokens(normalized) ?? 0;
  const output = billableOutputTokens(normalized) ?? 0;
  // Explicit/implicit Gemini cache: cached input is ~10% of input price (Google 2.5+).
  // Do not invent hits — only discount when usage reports a cached count.
  const cached =
    normalized.cached_content_token_count ??
    normalized.prompt_tokens_details?.cached_tokens ??
    0;
  const cachedClamped = Math.min(Math.max(0, cached), prompt);
  const uncachedPrompt = Math.max(0, prompt - cachedClamped);
  const cachedRate = price.inputPer1M * 0.1;
  return (
    (uncachedPrompt / 1_000_000) * price.inputPer1M +
    (cachedClamped / 1_000_000) * cachedRate +
    (output / 1_000_000) * price.outputPer1M
  );
}

export function sumCostUsd(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}

export function sumTokens(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}
