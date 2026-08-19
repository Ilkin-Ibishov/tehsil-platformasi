import { describe, it, expect } from "vitest";
import { computeCostUsd, sumCostUsd, sumTokens, billableOutputTokens, providerReportedCostUsd } from "./cost";
import type { LLMUsage } from "./llm";

describe("computeCostUsd", () => {
  it("returns null for null usage", () => {
    expect(computeCostUsd(null, "gemini-3.6-flash")).toBeNull();
  });

  it("returns null for unknown model without provider cost", () => {
    const usage: LLMUsage = { prompt_tokens: 1000, completion_tokens: 500 };
    expect(computeCostUsd(usage, "unknown-model-xyz")).toBeNull();
  });

  it("calculates cost for known model", () => {
    const usage: LLMUsage = { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 };
    const cost = computeCostUsd(usage, "gemini-3.6-flash");
    expect(cost).toBeCloseTo(0.75 + 3.75, 5);
  });

  it("uses provider-reported cost when available", () => {
    const usage: LLMUsage = { prompt_tokens: 100, completion_tokens: 50, cost_usd: 0.042 };
    expect(computeCostUsd(usage, "gemini-3.6-flash")).toBe(0.042);
  });

  it("applies cache discount for cached tokens", () => {
    const usage: LLMUsage = {
      prompt_tokens: 1_000_000,
      completion_tokens: 0,
      prompt_tokens_details: { cached_tokens: 1_000_000 },
    };
    const cost = computeCostUsd(usage, "gemini-3.6-flash");
    // All cached: 1M * 0.75 * 0.1 / 1M = 0.075
    expect(cost).toBeCloseTo(0.075, 5);
  });
});

describe("sumCostUsd", () => {
  it("returns null when both null", () => {
    expect(sumCostUsd(null, null)).toBeNull();
  });

  it("treats null as 0", () => {
    expect(sumCostUsd(0.5, null)).toBe(0.5);
    expect(sumCostUsd(null, 0.3)).toBe(0.3);
  });

  it("sums two numbers", () => {
    expect(sumCostUsd(0.1, 0.2)).toBeCloseTo(0.3, 10);
  });
});

describe("sumTokens", () => {
  it("returns null when both null/undefined", () => {
    expect(sumTokens(null, undefined)).toBeNull();
  });

  it("sums with null treated as 0", () => {
    expect(sumTokens(100, null)).toBe(100);
  });
});

describe("billableOutputTokens", () => {
  it("returns null for null usage", () => {
    expect(billableOutputTokens(null)).toBeNull();
  });

  it("uses total - prompt when total is available", () => {
    const usage: LLMUsage = { prompt_tokens: 100, completion_tokens: 50, total_tokens: 200 };
    expect(billableOutputTokens(usage)).toBe(100);
  });

  it("returns completion when completion >= reasoning", () => {
    const usage: LLMUsage = { prompt_tokens: 100, completion_tokens: 50, thoughts_token_count: 30 };
    expect(billableOutputTokens(usage)).toBe(50);
  });
});

describe("providerReportedCostUsd", () => {
  it("returns cost_usd when present", () => {
    expect(providerReportedCostUsd({ cost_usd: 0.01 })).toBe(0.01);
  });

  it("returns null when no cost fields", () => {
    expect(providerReportedCostUsd({ prompt_tokens: 100 })).toBeNull();
  });
});
