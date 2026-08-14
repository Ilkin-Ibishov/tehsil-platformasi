// Model registrisi + xərc hesablaması selftesti — ADR-022. LLM/DB ÇAĞIRILMIR.
//
// Nəyi qıfıllayır:
//   1. Tanınan model (`gemini-3.6-flash`) env OLMADAN da düzgün qiymət verir (registri
//      defolt) — 86eymrm8j-in "env unudulub, cost_usd NULL qalıb" bugini kökündən bağlayır.
//   2. Model-spesifik env override HAMİ dəqiq həmin modelin açarından oxunur — başqa modelin
//      qiymətini "təsadüfən" oxumaq mümkün deyil (deterministik `priceEnvKey`).
//   3. Naməlum model, override YOXDURSA → `null` (bilinmir, YANLIŞ 0 yox).
//   4. `computeCostUsd` yalnız verilən modelin qiymətini işlədir — köhnə `prefix`-əsaslı
//      API tam silinib (tip səviyyəsində `modelId` MƏCBURİDİR).
//
// İşə salma: npx tsx web/lib/models.selftest.mts

import { getModelConfig, priceEnvKey, resolvePrice, resolveConnection, listKnownModelIds } from "./models.ts";
import { computeCostUsd } from "./cost.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

// ── 1. Tanınan model, env yoxdur ─────────────────────────────────────────────────────────
delete process.env.MODEL_GEMINI_3_6_FLASH_PRICE_INPUT_PER_1M;
delete process.env.MODEL_GEMINI_3_6_FLASH_PRICE_OUTPUT_PER_1M;
check("gemini-3.6-flash: registri defolt (env yoxdursa)", resolvePrice("gemini-3.6-flash"), {
  inputPer1M: 1.5,
  outputPer1M: 7.5,
});
check("gemini-3.6-flash: getModelConfig tapır", getModelConfig("gemini-3.6-flash")?.provider, "gemini");
check("listKnownModelIds gemini-3.6-flash-ı ehtiva edir", listKnownModelIds().includes("gemini-3.6-flash"), true);

// ── 2. Deterministik env açarı ───────────────────────────────────────────────────────────
check("priceEnvKey: gemini-3.6-flash", priceEnvKey("gemini-3.6-flash", "INPUT"), "MODEL_GEMINI_3_6_FLASH_PRICE_INPUT_PER_1M");
check("priceEnvKey: yeni model (nöqtə/tire → _)", priceEnvKey("gemini-3.7-flash", "OUTPUT"), "MODEL_GEMINI_3_7_FLASH_PRICE_OUTPUT_PER_1M");

// Override YALNIZ ÖZ modelinin qiymətini dəyişir — digərinə TƏSİR ETMİR.
process.env.MODEL_GEMINI_3_6_FLASH_PRICE_INPUT_PER_1M = "9.99";
check("override yalnız həmin modelin qiymətini dəyişir", resolvePrice("gemini-3.6-flash"), {
  inputPer1M: 9.99,
  outputPer1M: 7.5, // output override edilməyib, registri defolt qalır
});
delete process.env.MODEL_GEMINI_3_6_FLASH_PRICE_INPUT_PER_1M;

// ── 3. Naməlum model ─────────────────────────────────────────────────────────────────────
check("naməlum model, override yoxdursa → null (bilinmir, 0 YOX)", resolvePrice("gpt-5-mini"), null);
check("naməlum model üçün connection → null (hansı provayder bilinmir)", resolveConnection("gpt-5-mini"), null);

process.env.MODEL_GPT_5_MINI_PRICE_INPUT_PER_1M = "0.25";
process.env.MODEL_GPT_5_MINI_PRICE_OUTPUT_PER_1M = "1.00";
check("naməlum model, override VARSA → işləyir (registridə olmadan)", resolvePrice("gpt-5-mini"), {
  inputPer1M: 0.25,
  outputPer1M: 1.0,
});
delete process.env.MODEL_GPT_5_MINI_PRICE_INPUT_PER_1M;
delete process.env.MODEL_GPT_5_MINI_PRICE_OUTPUT_PER_1M;

// ── 4. computeCostUsd — modelId MƏCBURİDİR ───────────────────────────────────────────────
check("computeCostUsd: usage yoxdursa → null", computeCostUsd(null, "gemini-3.6-flash"), null);
check(
  "computeCostUsd: tanınan model, 1000 giriş + 500 çıxış token",
  computeCostUsd({ prompt_tokens: 1000, completion_tokens: 500 }, "gemini-3.6-flash"),
  (1000 / 1_000_000) * 1.5 + (500 / 1_000_000) * 7.5
);
check("computeCostUsd: naməlum model, override yoxdur → null", computeCostUsd({ prompt_tokens: 100, completion_tokens: 50 }, "naməlum-model"), null);

// Regressiya-qıfılı: İKİ FƏRQLİ modelin qiyməti QARIŞMIR — məhz 86eymrm8j-in kök səbəbi.
process.env.MODEL_MODEL_A_PRICE_INPUT_PER_1M = "100";
process.env.MODEL_MODEL_A_PRICE_OUTPUT_PER_1M = "200";
process.env.MODEL_MODEL_B_PRICE_INPUT_PER_1M = "1";
process.env.MODEL_MODEL_B_PRICE_OUTPUT_PER_1M = "2";
check(
  "iki fərqli modelin qiyməti bir-birinə SIZMIR",
  [computeCostUsd({ prompt_tokens: 1_000_000, completion_tokens: 0 }, "model-a"), computeCostUsd({ prompt_tokens: 1_000_000, completion_tokens: 0 }, "model-b")],
  [100, 1]
);
delete process.env.MODEL_MODEL_A_PRICE_INPUT_PER_1M;
delete process.env.MODEL_MODEL_A_PRICE_OUTPUT_PER_1M;
delete process.env.MODEL_MODEL_B_PRICE_INPUT_PER_1M;
delete process.env.MODEL_MODEL_B_PRICE_OUTPUT_PER_1M;

console.log(fails === 0 ? `\nHamısı keçdi.` : `\n${fails} test uğursuz.`);
process.exit(fails === 0 ? 0 : 1);
