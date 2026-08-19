import { describe, it, expect } from "vitest";
import { normalizeCanonical, canonicalHash, numericFingerprint } from "./bank";

describe("normalizeCanonical", () => {
  it("trims and lowercases", () => {
    expect(normalizeCanonical("  Hello World  ")).toBe("hello world");
  });

  it("collapses whitespace", () => {
    expect(normalizeCanonical("a  b\n\tc")).toBe("a b c");
  });

  it("handles empty string", () => {
    expect(normalizeCanonical("")).toBe("");
  });
});

describe("canonicalHash", () => {
  it("produces consistent sha256 hex", () => {
    const h1 = canonicalHash("x + 2 = 5");
    const h2 = canonicalHash("  X + 2 = 5  ");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it("different text produces different hash", () => {
    expect(canonicalHash("x = 1")).not.toBe(canonicalHash("x = 2"));
  });
});

describe("numericFingerprint", () => {
  it("extracts all numbers in order", () => {
    expect(numericFingerprint("3x + 2 = 11")).toBe("3,2,11");
  });

  it("includes decimals", () => {
    expect(numericFingerprint("x = 2.5")).toBe("2.5");
  });

  it("includes negative numbers when adjacent", () => {
    expect(numericFingerprint("a=-3, b=-7")).toBe("-3,-7");
  });

  it("returns empty string when no numbers", () => {
    expect(numericFingerprint("no numbers here")).toBe("");
  });

  it("negative only when directly adjacent (no space)", () => {
    expect(numericFingerprint("x^2 + 5x - 6 = 0")).toBe("2,5,6,0");
    expect(numericFingerprint("a=-3, b=-7")).toBe("-3,-7");
  });
});
