// scripts/lib/cost.py-ın hərfi TS portu, ADR-022-də model registrisinə köçürüldü.
import type { LLMUsage } from "./llm";
import { resolvePrice } from "./models";

// ADR-022: qiymət MODEL İD-inə görə axtarılır (əvvəllər qatın MƏQSƏDİNƏ görə axtarılırdı —
// `86eymrm8j` auditi bunun səssiz-yanlış-qiymət riski yaratdığını aşkarladı: model dəyişib
// qiyməti yeniləməsən, xərc başqa modelin qiymətiylə hesablanardı).
//
// NİYƏ `null` QAYTARILIR (0 YOX): qiymət bilinmirsə xərc BİLİNMİR. `0` yazmaq gündəlik
// xərc tavanını (`DAILY_COST_CEILING_USD`) səssizcə yalan edərdi — `attempt_items.cost_usd`
// `null` qalanda `sum()` onu ATLAYIR, sıfır kimi saymır, amma heç olmasa yalan hesabat vermir.
export function computeCostUsd(usage: LLMUsage | null, modelId: string): number | null {
  if (!usage) return null;
  const price = resolvePrice(modelId);
  if (!price) return null;

  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  return (promptTokens / 1_000_000) * price.inputPer1M + (completionTokens / 1_000_000) * price.outputPer1M;
}

// İki qatın xərcini birləşdirir. Hər ikisi `null`-dursa nəticə `null` (bilinmir),
// biri məlumdursa məlum olan qaytarılır — `null`-u 0 kimi saymaq yalan hesabatdır.
export function sumCostUsd(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}
