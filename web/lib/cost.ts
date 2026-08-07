// scripts/lib/cost.py-ın hərfi TS portu. Qiymətlər env-dən, hardcode edilmir.
import type { LLMUsage } from "./llm";

export function computeCostUsd(usage: LLMUsage | null): number | null {
  if (!usage) return null;
  const priceIn = process.env.GEMINI_PRICE_INPUT_PER_1M;
  const priceOut = process.env.GEMINI_PRICE_OUTPUT_PER_1M;
  if (!priceIn || !priceOut) return null;

  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  return (promptTokens / 1_000_000) * Number(priceIn) + (completionTokens / 1_000_000) * Number(priceOut);
}
