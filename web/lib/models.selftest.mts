// Model registrisi + xərc hesablaması selftesti — ADR-022 / ADR-027. LLM/DB ÇAĞIRILMIR.
//
// Nəyi qıfıllayır:
//   1. Tanınan model env OLMADAN düzgün qiymət verir (registri).
//   2. Env `MODEL_*_PRICE_*` qoyulsa belə registri dəyişmir (Vercel override YOX).
//   3. Naməlum model → `null` (bilinmir, YANLIŞ 0 yox) — env də onu doldurmur.
//   4. `computeCostUsd` yalnız verilən modelin registri qiymətini işlədir.
//
// İşə salma: npx tsx web/lib/models.selftest.mts

import { getModelConfig, resolvePrice, resolveConnection, listKnownModelIds, getActiveModel, getActiveTranscribeModel } from "./models.ts";
import { computeCostUsd } from "./cost.ts";

function mockPool(row: { key: string; value: string } | null, shouldThrow = false) {
  return {
    async query() {
      if (shouldThrow) throw new Error("DB əlçatmazdır (simulyasiya)");
      return { rows: row ? [row] : [] };
    },
  };
}

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

check("gemini-3.6-flash: registri", resolvePrice("gemini-3.6-flash"), {
  inputPer1M: 0.75,
  outputPer1M: 3.75,
});
check("gemini-3.6-flash: getModelConfig tapır", getModelConfig("gemini-3.6-flash")?.provider, "gemini");
check("listKnownModelIds gemini-3.6-flash-ı ehtiva edir", listKnownModelIds().includes("gemini-3.6-flash"), true);

check("gemini-3.7-flash: registridədir, eyni qiymət", resolvePrice("gemini-3.7-flash"), {
  inputPer1M: 0.75,
  outputPer1M: 3.75,
});
check("gemini-3.7-flash: eyni provayder/env-lər", getModelConfig("gemini-3.7-flash")?.baseUrlEnv, "GEMINI_BASE_URL");

check("gemini-3.1-flash-lite: registri defolt", resolvePrice("gemini-3.1-flash-lite"), {
  inputPer1M: 0.25,
  outputPer1M: 1.5,
});
check("gemini-3.1-flash-lite: eyni provayder/env-lər", getModelConfig("gemini-3.1-flash-lite")?.baseUrlEnv, "GEMINI_BASE_URL");

// ADR-027: Vercel/env qiyməti ÖTMƏMƏLİDİR.
process.env.MODEL_GEMINI_3_6_FLASH_PRICE_INPUT_PER_1M = "9.99";
process.env.MODEL_GEMINI_3_6_FLASH_PRICE_OUTPUT_PER_1M = "99";
check("env override registrini dəyişmir", resolvePrice("gemini-3.6-flash"), {
  inputPer1M: 0.75,
  outputPer1M: 3.75,
});
delete process.env.MODEL_GEMINI_3_6_FLASH_PRICE_INPUT_PER_1M;
delete process.env.MODEL_GEMINI_3_6_FLASH_PRICE_OUTPUT_PER_1M;

check("naməlum model → null (bilinmir, 0 YOX)", resolvePrice("gpt-5-mini"), null);
check("naməlum model üçün connection → null", resolveConnection("gpt-5-mini"), null);

process.env.MODEL_GPT_5_MINI_PRICE_INPUT_PER_1M = "0.25";
process.env.MODEL_GPT_5_MINI_PRICE_OUTPUT_PER_1M = "1.00";
check("naməlum model, env VARSA belə → null", resolvePrice("gpt-5-mini"), null);
delete process.env.MODEL_GPT_5_MINI_PRICE_INPUT_PER_1M;
delete process.env.MODEL_GPT_5_MINI_PRICE_OUTPUT_PER_1M;

check("computeCostUsd: usage yoxdursa → null", computeCostUsd(null, "gemini-3.6-flash"), null);
check(
  "computeCostUsd: tanınan model, 1000 giriş + 500 çıxış (total yoxdur)",
  computeCostUsd({ prompt_tokens: 1000, completion_tokens: 500 }, "gemini-3.6-flash"),
  (1000 / 1_000_000) * 0.75 + (500 / 1_000_000) * 3.75
);
check(
  "computeCostUsd: total = prompt+completion → düşünmə yox, köhnə vurma ilə eyni",
  computeCostUsd({ prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 }, "gemini-3.6-flash"),
  (1000 / 1_000_000) * 0.75 + (500 / 1_000_000) * 3.75
);
check(
  "computeCostUsd: Gemini düşünmə total-dadır, completion-da deyil",
  computeCostUsd({ prompt_tokens: 15, completion_tokens: 18, total_tokens: 175 }, "gemini-3.6-flash"),
  (15 / 1_000_000) * 0.75 + (160 / 1_000_000) * 3.75
);
check(
  "computeCostUsd: provayder usage.cost varsa token vurmasını ötür",
  computeCostUsd({ prompt_tokens: 1_000_000, completion_tokens: 1_000_000, cost: 0.01 }, "gemini-3.6-flash"),
  0.01
);
check(
  "computeCostUsd: OpenAI reasoning completion-un içindədir, total yox → iki dəfə sayma",
  computeCostUsd(
    { prompt_tokens: 100, completion_tokens: 80, completion_tokens_details: { reasoning_tokens: 50 } },
    "gemini-3.6-flash"
  ),
  (100 / 1_000_000) * 0.75 + (80 / 1_000_000) * 3.75
);
check(
  "computeCostUsd: naməlum model, amma usage.cost var → onu yaz",
  computeCostUsd({ cost: 0.02 }, "naməlum-model"),
  0.02
);

check(
  "iki tanınan modelin qiyməti qarışmır",
  [
    computeCostUsd({ prompt_tokens: 1_000_000, completion_tokens: 0 }, "gemini-3.6-flash"),
    computeCostUsd({ prompt_tokens: 1_000_000, completion_tokens: 0 }, "gemini-3.1-flash-lite"),
  ],
  [0.75, 0.25]
);

await (async () => {
  delete process.env.GEMINI_MODEL;
  delete process.env.TRANSCRIBE_MODEL;

  check(
    "getActiveModel: DB sətri VARSA onu qaytarır",
    await getActiveModel(mockPool({ key: "active_model", value: "gemini-3.7-flash" })),
    "gemini-3.7-flash"
  );

  process.env.GEMINI_MODEL = "gemini-3.6-flash";
  check("getActiveModel: DB sətri YOXDURSA env-ə düşür", await getActiveModel(mockPool(null)), "gemini-3.6-flash");
  check("getActiveModel: DB XƏTA verirsə env-ə düşür (səssiz sınmır)", await getActiveModel(mockPool(null, true)), "gemini-3.6-flash");

  check(
    "getActiveTranscribeModel: öz DB sətri VARSA onu qaytarır",
    await getActiveTranscribeModel(mockPool({ key: "active_transcribe_model", value: "gemini-flash-lite" })),
    "gemini-flash-lite"
  );

  process.env.TRANSCRIBE_MODEL = "gemini-flash-cheap";
  check(
    "getActiveTranscribeModel: DB sətri boşdursa TRANSCRIBE_MODEL env-ə düşür",
    await getActiveTranscribeModel(mockPool({ key: "active_transcribe_model", value: "" })),
    "gemini-flash-cheap"
  );
  delete process.env.TRANSCRIBE_MODEL;
  check(
    "getActiveTranscribeModel: TRANSCRIBE_MODEL da yoxdursa active_model-ə düşür",
    await getActiveTranscribeModel(mockPool(null)),
    "gemini-3.6-flash"
  );
  delete process.env.GEMINI_MODEL;
})();

console.log(fails === 0 ? `\nHamısı keçdi.` : `\n${fails} test uğursuz.`);
process.exit(fails === 0 ? 0 : 1);
