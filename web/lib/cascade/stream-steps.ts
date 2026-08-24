// Incremental extraction of complete `steps[]` objects from a partial JSON string
// while an LLM streams a STEP-SCHEMA document. Used so `/api/solve/finish` can emit
// a PublicStep (accept stripped) before the full response arrives.
//
// Incomplete objects are never returned — only brace-balanced, JSON.parse-able
// elements that already carry display fields (title + explanation).

import type { PublicStep, RawStep } from "./types";

function findMatchingBrace(text: string, openIdx: number): number {
  if (text[openIdx] !== "{") return -1;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function isDisplayableStep(value: unknown): value is RawStep {
  if (!value || typeof value !== "object") return false;
  const step = value as Record<string, unknown>;
  return typeof step.title === "string" && step.title.length > 0 && typeof step.explanation === "string" && step.explanation.length > 0;
}

/**
 * Scan `partialJson` for complete objects inside `"steps": [ ... ]`.
 * Returns only steps with index >= `alreadyEmitted` that are display-ready.
 */
export function extractNewDisplayableSteps(
  partialJson: string,
  alreadyEmitted: number
): { steps: RawStep[]; emittedCount: number } {
  const match = /"steps"\s*:\s*\[/.exec(partialJson);
  if (!match || match.index === undefined) {
    return { steps: [], emittedCount: alreadyEmitted };
  }

  let i = match.index + match[0].length;
  let completeCount = 0;
  const newlyFound: RawStep[] = [];

  while (i < partialJson.length) {
    while (i < partialJson.length && /[\s,]/.test(partialJson[i]!)) i++;
    if (i >= partialJson.length) break;
    if (partialJson[i] === "]") break;
    if (partialJson[i] !== "{") break;

    const end = findMatchingBrace(partialJson, i);
    if (end < 0) break;

    const slice = partialJson.slice(i, end + 1);
    let parsed: unknown;
    try {
      parsed = JSON.parse(slice);
    } catch {
      break;
    }

    if (isDisplayableStep(parsed)) {
      if (completeCount >= alreadyEmitted) newlyFound.push(parsed);
      completeCount++;
    }
    i = end + 1;
  }

  return {
    steps: newlyFound,
    emittedCount: alreadyEmitted + newlyFound.length,
  };
}

/** Strip `check.accept` (ADR-017) via strict whitelist before any client-facing step event. */
export function toPublicPreviewStep(raw: RawStep): PublicStep {
  return {
    index: raw.index,
    title: raw.title,
    explanation: raw.explanation,
    latex: raw.latex,
    error_code: raw.error_code,
    hint: raw.hint,
    why: raw.why,
    tokens: raw.tokens,
    check: raw.check
      ? {
          ask: raw.check.ask,
          input_kind: raw.check.input_kind ?? "number",
        }
      : undefined,
  };
}
