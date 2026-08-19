import { describe, it, expect } from "vitest";
import { verifyFinalAnswer, studentAnswerMatches, equationCrossCheck } from "./answer";

describe("verifyFinalAnswer", () => {
  it("returns null for non-math subjects", () => {
    const r = verifyFinalAnswer("x + 2 = 5", ["3"], "physics");
    expect(r.verified).toBeNull();
    expect(r.method).toBe("none");
  });

  it("verifies simple linear equation x + 2 = 5 → 3", () => {
    const r = verifyFinalAnswer("x + 2 = 5", ["3"]);
    expect(r.verified).toBe(true);
    expect(r.method).toBe("mathjs_equation");
  });

  it("returns false when value does not satisfy equation", () => {
    const r = verifyFinalAnswer("x + 2 = 5", ["7"]);
    expect(r.verified).toBe(false);
  });

  it("returns null when no equation is extractable", () => {
    const r = verifyFinalAnswer("Bu bir söz məsələsidir, heç bir tənlik yoxdur.", ["42"]);
    expect(r.verified).toBeNull();
    expect(r.reason).toBe("no_equation_extracted");
  });

  it("returns null for multi-variable equation without bindings", () => {
    const r = verifyFinalAnswer("a + b = 10", ["6"]);
    expect(r.verified).toBeNull();
    expect(r.reason).toBe("no_single_variable_equation");
  });

  it("handles empty values array", () => {
    const r = verifyFinalAnswer("x = 5", []);
    expect(r.verified).toBe(false);
  });

  it("defaults to math when subject is undefined", () => {
    const r = verifyFinalAnswer("2x = 10", ["5"]);
    expect(r.verified).toBe(true);
  });
});

describe("equationCrossCheck", () => {
  it("verifies 3x - 6 = 0 → 2", () => {
    const r = equationCrossCheck("3x - 6 = 0", ["2"]);
    expect(r.verified).toBe(true);
  });

  it("rejects wrong answer for simple equation", () => {
    const r = equationCrossCheck("3x - 6 = 0", ["3"]);
    expect(r.verified).toBe(false);
  });

  it("handles decimal answers", () => {
    const r = equationCrossCheck("2x = 1", ["0.5"]);
    expect(r.verified).toBe(true);
  });
});

describe("studentAnswerMatches", () => {
  it("exact match after normalization", () => {
    expect(studentAnswerMatches("  3 ", "3")).toBe(true);
  });

  it("decimal equivalence: 0.5 matches 1/2", () => {
    expect(studentAnswerMatches("0.5", "1/2")).toBe(true);
  });

  it("rejects clearly different values", () => {
    expect(studentAnswerMatches("7", "3")).toBe(false);
  });

  it("handles empty input", () => {
    expect(studentAnswerMatches("", "5")).toBe(false);
  });

  it("comma-dot normalization", () => {
    expect(studentAnswerMatches("2,5", "2.5")).toBe(true);
  });
});
