// docs/TRANSCRIBE-SCHEMA.json-a qarşı validasiya — kaskadın Qat 1 çıxışı üçün (ADR-020).
// `schema.ts` ilə eyni naxış (ajv Draft-07), yalnız fərqli sxem faylı.
//
// NİYƏ `validateStep` İSTİFADƏ EDİLMİR: STEP-SCHEMA-nın `allOf` qaydası status='ok' halında
// `final_answer` və `steps`-i MƏCBURİ edir. Qat 1 qəsdən heç birini istehsal etmir — onun
// çıxışı STEP-SCHEMA-dan HEÇ VAXT keçə bilməz. Bu iki müqavilə ayrı olmalıdır, yoxsa Qat 1
// ya sxemi pozar, ya da həll uydurmağa məcbur olar.
import Ajv from "ajv";
import schema from "../../../docs/TRANSCRIBE-SCHEMA.json";
import type { ValidationResult } from "./schema";

const ajv = new Ajv({ allErrors: true, strict: false });
const validateFn = ajv.compile(schema);

export function validateTranscript(obj: unknown): ValidationResult {
  if (typeof obj !== "object" || obj === null) {
    return { valid: false, errors: ["model çıxışı JSON obyekti deyil"] };
  }
  const valid = validateFn(obj);
  if (valid) return { valid: true, errors: [] };
  const errors = (validateFn.errors ?? []).map((e) => `${e.instancePath || "<root>"}: ${e.message}`);
  return { valid: false, errors };
}
