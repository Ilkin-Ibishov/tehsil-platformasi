// docs/STEP-SCHEMA.json-a qarşı validasiya. scripts/lib/schema_check.py-ın TS portu (ADR-012) —
// mexaniki port (ajv Draft-07 == jsonschema Draft7Validator), divergensiya riski yoxdur.
import Ajv from "ajv";
import schema from "../../../docs/STEP-SCHEMA.json";

/** LLM və server JSON-unun `schema_version` sahəsi. v2 = `visual` (ADR-031). */
export const STEP_SCHEMA_VERSION = 2 as const;

// Sxem "draft-07" elan edir — standart ajv (Draft-07 dəstəkli) kifayətdir, 2019 lazım deyil.
const ajv = new Ajv({ allErrors: true, strict: false });
const validateFn = ajv.compile(schema);

export type ValidationResult = { valid: boolean; errors: string[] };

export function validateStep(obj: unknown): ValidationResult {
  if (typeof obj !== "object" || obj === null) {
    return { valid: false, errors: ["model çıxışı JSON obyekti deyil"] };
  }
  const valid = validateFn(obj);
  if (valid) return { valid: true, errors: [] };
  const errors = (validateFn.errors ?? []).map((e) => `${e.instancePath || "<root>"}: ${e.message}`);
  return { valid: false, errors };
}
