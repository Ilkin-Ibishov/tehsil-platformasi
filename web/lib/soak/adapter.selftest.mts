// Soak adapter selftest — LLM/DB ÇAĞIRILMIR (mock pool).
// npx tsx web/lib/soak/adapter.selftest.mts

import { extractJsonFromSoakResponse, interpretSoakHealth, isRetryableSoakStatus, soakChatPayload } from "./adapter.ts";
import { isSoakInvite, resolveSoakMode, usesSoakAdapter, skipImageCache, attemptKindFor } from "./mode.ts";
import { computeCostUsd } from "../cost.ts";

function mockPool(rows: Record<string, string>) {
  return {
    async query(_text: string, params?: unknown[]) {
      const key = typeof params?.[0] === "string" ? params[0] : "";
      const value = rows[key];
      return { rows: value !== undefined ? [{ value }] : [] };
    },
  };
}

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

check(
  "extract: hasar içində JSON",
  extractJsonFromSoakResponse('budur:\n```json\n{"schema_version":1,"canonical":"5+5"}\n```\n'),
  { schema_version: 1, canonical: "5+5" }
);
check(
  "extract: hashtag + trailing mətn",
  extractJsonFromSoakResponse('# Cavab\n{"a":1}\nÜmid edirəm kömək oldu.'),
  { a: 1 }
);
check("extract: JSON yoxdur", extractJsonFromSoakResponse("heç nə"), null);

const qat1 = soakChatPayload({ systemPrompt: "sys", userPrompt: "usr", imageBase64: "abc" });
check("qat1: şəkil var", typeof qat1.image, "string");
check("qat1: .txt yox (şəkli silməsin)", qat1.attachTextAsFile, undefined);
const qat5 = soakChatPayload({ systemPrompt: "sys", userPrompt: "usr" });
check("qat5: şəkil yox", qat5.image, undefined);
check("qat5: .txt var", qat5.attachTextAsFile, true);

check("invite: şagird soak deyil", isSoakInvite("abc123"), false);
check("invite: soak- prefiksi", isSoakInvite("soak-dim-01"), true);
check("invite: boş", isSoakInvite(""), false);

check("retry: QUEUE_FULL", isRetryableSoakStatus(429, "QUEUE_FULL"), true);
check("retry: TIMEOUT", isRetryableSoakStatus(504, "TIMEOUT"), true);
check("retry: AUTH_EXPIRED yox", isRetryableSoakStatus(401, "AUTH_EXPIRED"), false);
check("retry: 401 yox", isRetryableSoakStatus(401), false);

check(
  "health: cookie + healthy",
  interpretSoakHealth({ status: "healthy", browser: { healthy: true, idle: false, authMode: "cookie" } }),
  { ok: true }
);
check(
  "health: cookie + idle (brauzer sönük)",
  interpretSoakHealth({ status: "healthy", browser: { healthy: false, idle: true, authMode: "cookie" } }),
  { ok: true }
);
check(
  "health: guest",
  interpretSoakHealth({ status: "healthy", browser: { healthy: true, idle: false, authMode: "guest" } }),
  { ok: false, reason: "auth" }
);
check(
  "health: authMode yox",
  interpretSoakHealth({ status: "healthy", browser: { healthy: true, idle: false } }),
  { ok: false, reason: "auth" }
);
check(
  "health: crash (idle deyil, healthy false)",
  interpretSoakHealth({ status: "healthy", browser: { healthy: false, idle: false, authMode: "cookie" } }),
  { ok: false, reason: "unhealthy" }
);

check("cost: chatgpt_web 0 yazılmır", computeCostUsd(null, "chatgpt_web"), null);

const student = await resolveSoakMode(mockPool({ soak_enabled: "1", soak_provider: "chatgpt_web" }), "real-invite");
check("şagird: soak_enabled=1 olsa belə student", student.kind, "student");
check("şagird: adapter yox", usesSoakAdapter(student), false);
check("şagird: keş skip yox", skipImageCache(student), false);
check("şagird: photo_solve", attemptKindFor(student), "photo_solve");

const off = await resolveSoakMode(mockPool({ soak_enabled: "0", soak_provider: "chatgpt_web" }), "soak-x");
check("soak sönük: Gemini-yə düşmür", off, { kind: "blocked", reason: "disabled" });

delete process.env.SOAK_LLM_BASE_URL;
delete process.env.SOAK_LLM_API_KEY;
const noEnv = await resolveSoakMode(mockPool({ soak_enabled: "1", soak_provider: "chatgpt_web" }), "soak-x");
check("env yox: blocked", noEnv.kind, "blocked");
if (noEnv.kind === "blocked") check("env yox: missing_env", noEnv.reason, "missing_env");

process.env.SOAK_LLM_BASE_URL = "http://soak.test";
process.env.SOAK_LLM_API_KEY = "test-key";
const on = await resolveSoakMode(mockPool({ soak_enabled: "1", soak_provider: "chatgpt_web" }), "soak-x");
check("soak açıq + env: chatgpt_web", on.kind, "chatgpt_web");
check("soak: corpus_soak", attemptKindFor(on), "corpus_soak");
check("soak: keş skip", skipImageCache(on), true);

const gold = await resolveSoakMode(mockPool({ soak_enabled: "1", soak_provider: "gemini" }), "soak-gold");
check("qızıl n: gemini", gold.kind, "gemini");
check("qızıl: adapter yox", usesSoakAdapter(gold), false);
check("qızıl: corpus_soak", attemptKindFor(gold), "corpus_soak");
delete process.env.SOAK_LLM_BASE_URL;
delete process.env.SOAK_LLM_API_KEY;

if (fails) {
  console.log(`\n${fails} uğursuz.`);
  process.exit(1);
}
console.log("\nHamısı keçdi.");
