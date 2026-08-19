import { describe, it, expect } from "vitest";
import { normalizeUsage, cachedTokensFromUsage, usageFromGeminiNativeMetadata, geminiNativeBaseUrl } from "./llm";

describe("normalizeUsage", () => {
  it("returns null for non-object input", () => {
    expect(normalizeUsage(null)).toBeNull();
    expect(normalizeUsage(undefined)).toBeNull();
    expect(normalizeUsage("string")).toBeNull();
  });

  it("normalizes snake_case fields", () => {
    const raw = { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 };
    const u = normalizeUsage(raw);
    expect(u?.prompt_tokens).toBe(100);
    expect(u?.completion_tokens).toBe(50);
    expect(u?.total_tokens).toBe(150);
  });

  it("normalizes camelCase fields", () => {
    const raw = { promptTokens: 200, completionTokens: 80, totalTokens: 280 };
    const u = normalizeUsage(raw);
    expect(u?.prompt_tokens).toBe(200);
    expect(u?.completion_tokens).toBe(80);
    expect(u?.total_tokens).toBe(280);
  });

  it("extracts cached tokens from prompt_tokens_details", () => {
    const raw = { prompt_tokens: 500, completion_tokens: 100, prompt_tokens_details: { cached_tokens: 400 } };
    const u = normalizeUsage(raw);
    expect(u?.prompt_tokens_details?.cached_tokens).toBe(400);
  });

  it("extracts cached from top-level cached_content_token_count", () => {
    const raw = { prompt_tokens: 500, cached_content_token_count: 300 };
    const u = normalizeUsage(raw);
    expect(u?.prompt_tokens_details?.cached_tokens).toBe(300);
  });

  it("returns null when all fields are missing/non-numeric", () => {
    expect(normalizeUsage({})).toBeNull();
    expect(normalizeUsage({ foo: "bar" })).toBeNull();
  });

  it("extracts cost_usd", () => {
    const raw = { prompt_tokens: 10, cost_usd: 0.005 };
    const u = normalizeUsage(raw);
    expect(u?.cost_usd).toBe(0.005);
  });
});

describe("usageFromGeminiNativeMetadata", () => {
  it("maps Gemini native fields", () => {
    const raw = { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 160, thoughtsTokenCount: 10 };
    const u = usageFromGeminiNativeMetadata(raw);
    expect(u?.prompt_tokens).toBe(100);
    expect(u?.completion_tokens).toBe(50);
    expect(u?.total_tokens).toBe(160);
    expect(u?.thoughts_token_count).toBe(10);
  });

  it("returns null for non-object", () => {
    expect(usageFromGeminiNativeMetadata(null)).toBeNull();
    expect(usageFromGeminiNativeMetadata(42)).toBeNull();
  });

  it("handles cachedContentTokenCount", () => {
    const raw = { promptTokenCount: 500, cachedContentTokenCount: 400 };
    const u = usageFromGeminiNativeMetadata(raw);
    expect(u?.cached_content_token_count).toBe(400);
    expect(u?.prompt_tokens_details?.cached_tokens).toBe(400);
  });
});

describe("cachedTokensFromUsage", () => {
  it("returns null for null/undefined", () => {
    expect(cachedTokensFromUsage(null)).toBeNull();
    expect(cachedTokensFromUsage(undefined)).toBeNull();
  });

  it("prefers prompt_tokens_details.cached_tokens", () => {
    expect(cachedTokensFromUsage({ prompt_tokens_details: { cached_tokens: 42 } })).toBe(42);
  });

  it("falls back to cached_content_token_count", () => {
    expect(cachedTokensFromUsage({ cached_content_token_count: 99 })).toBe(99);
  });
});

describe("geminiNativeBaseUrl", () => {
  it("strips /openai suffix", () => {
    expect(geminiNativeBaseUrl("https://generativelanguage.googleapis.com/v1beta/openai")).toBe(
      "https://generativelanguage.googleapis.com/v1beta"
    );
  });

  it("strips trailing slash then /openai", () => {
    expect(geminiNativeBaseUrl("https://example.com/v1beta/openai/")).toBe(
      "https://example.com/v1beta"
    );
  });

  it("leaves non-openai URL unchanged", () => {
    expect(geminiNativeBaseUrl("https://example.com/v1beta")).toBe(
      "https://example.com/v1beta"
    );
  });
});
