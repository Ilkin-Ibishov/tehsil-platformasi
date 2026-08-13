// scripts/lib/cost.py-ın hərfi TS portu. Qiymətlər env-dən, hardcode edilmir.
import type { LLMUsage } from "./llm";

// ADR-020 (kaskad): hər qat FƏRQLİ model işlədir, yəni fərqli qiymət cədvəli. `prefix` env
// dəyişənlərinin önlüyünü seçir — `TRANSCRIBE_PRICE_*_PER_1M` təyin edilməyibsə `GEMINI_*`-ə
// düşür (dev/tək-model konfiqurasiyası sınmasın).
//
// NİYƏ `null` QAYTARILIR (0 YOX): qiymət env-i yoxdursa xərc BİLİNMİR. `0` yazmaq gündəlik
// xərc tavanını (`DAILY_COST_CEILING_USD`) səssizcə yalan edərdi — `attempt_items.cost_usd`
// `null` qalanda `sum()` onu ATLAYIR, sıfır kimi saymır, amma heç olmasa yalan hesabat vermir.
export function computeCostUsd(usage: LLMUsage | null, prefix?: string): number | null {
  if (!usage) return null;
  const priceIn =
    (prefix ? process.env[`${prefix}_PRICE_INPUT_PER_1M`] : undefined) ?? process.env.GEMINI_PRICE_INPUT_PER_1M;
  const priceOut =
    (prefix ? process.env[`${prefix}_PRICE_OUTPUT_PER_1M`] : undefined) ?? process.env.GEMINI_PRICE_OUTPUT_PER_1M;
  if (!priceIn || !priceOut) return null;

  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  return (promptTokens / 1_000_000) * Number(priceIn) + (completionTokens / 1_000_000) * Number(priceOut);
}

// İki qatın xərcini birləşdirir. Hər ikisi `null`-dursa nəticə `null` (bilinmir),
// biri məlumdursa məlum olan qaytarılır — `null`-u 0 kimi saymaq yalan hesabatdır.
export function sumCostUsd(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}
