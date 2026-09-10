#!/usr/bin/env node
/**
 * glossary-linter.mjs
 * 
 * Linter for detecting forbidden robotik/kalka expressions in Azerbaijani pedagogical texts,
 * step explanations, hints, and LLM generated schemas, enforcing DIM and Elm və Təhsil
 * Nazirliyi textbook terminology.
 */

export const FORBIDDEN_PATTERNS = [
  {
    id: "CALQUE_EXECUTE_SQUARE",
    regex: /kvadrat[ıın]*\s+icra\s+(edin|etmək|edirik|et)/i,
    name: "Kvadratını icra edin",
    replacement: "Kvadrata yüksəldin",
    rule: "Tənliyin və ya ədədin kvadratı 'icra edilmir', kvadrata yüksəldilir."
  },
  {
    id: "CALQUE_APPLY_SIDE",
    regex: /tərəfə\s+tətbiq\s+(edin|etmək|edirik|et)/i,
    name: "Tərəfə tətbiq edin",
    replacement: "Əks tərəfə əks işarə ilə keçirin",
    rule: "Hədlər digər tərəfə 'tətbiq edilmir', keçirilir."
  },
  {
    id: "CALQUE_FRACTION",
    regex: /\bfraksiya[a-zəıöğüçş]*\b/i,
    name: "Fraksiya",
    replacement: "Kəsr",
    rule: "Dərslik dili yalnız 'kəsr' terminini işlədir."
  },
  {
    id: "CALQUE_NUMERATOR",
    regex: /\bnümerator[a-zəıöğüçş]*\b/i,
    name: "Nümerator",
    replacement: "Surət",
    rule: "Kəsrin yuxarı hissəsi 'surət' adlanır."
  },
  {
    id: "CALQUE_DENOMINATOR",
    regex: /\bdenominator[a-zəıöğüçş]*\b/i,
    name: "Denominator",
    replacement: "Məxrəc",
    rule: "Kəsrin aşağı hissəsi 'məxrəc' adlanır."
  },
  {
    id: "CALQUE_PRIME_DIGIT",
    regex: /sadə\s+rəqəm/i,
    name: "Sadə rəqəm",
    replacement: "Sadə ədəd",
    rule: "Rəqəm 0-9 simvollarıdır. Yalnız 1-ə və özünə bölünən kəmiyyət 'sadə ədəd' adlanır."
  },
  {
    id: "CALQUE_COMPOSITE_DIGIT",
    regex: /mürəkkəb\s+rəqəm/i,
    name: "Mürəkkəb rəqəm",
    replacement: "Mürəkkəb ədəd",
    rule: "İkidən çox böləni olan kəmiyyət 'mürəkkəb ədəd' adlanır."
  },
  {
    id: "CALQUE_WHOLE_NUMBER",
    regex: /tam\s+nömrə/i,
    name: "Tam nömrə",
    replacement: "Tam ədəd",
    rule: "Azərbaycan dilində riyazi kateqoriya 'nömrə' deyil, 'ədəd'-dir."
  },
  {
    id: "CALQUE_NATURAL_NUMBER",
    regex: /təbii\s+nömrə/i,
    name: "Təbii nömrə",
    replacement: "Natural ədəd",
    rule: "Sayma nəticəsində alınan ədədlər 'natural ədəd' adlanır."
  },
  {
    id: "CALQUE_FACTOR_PAIR",
    regex: /faktor\s+cüt[üün]*/i,
    name: "Faktor cütü",
    replacement: "Vuruqlar",
    rule: "İngilis dilindən 'factor pair' kalkası. Dərslikdə 'vuruqlar' işlədilir."
  },
  {
    id: "CALQUE_COMMON_FACTOR",
    regex: /ortaqlıq\s+faktoru|ortaq\s+faktor[a-zəıöğüçş]*/i,
    name: "Ortaq faktor",
    replacement: "Ortaq vuruq",
    rule: "Dərslikdə 'ortaq vuruq mötərizə xaricinə çıxarılır'."
  },
  {
    id: "CALQUE_ISOLATE_VARIABLE",
    regex: /(x|dəyişən|məchul)[-i\s]+izolyasiya\s+(edin|etmək|edirik|et)/i,
    name: "Dəyişəni izolyasiya edin",
    replacement: "Məchulu təkləyin (və ya digər kəmiyyətlərlə ifadə edin)",
    rule: "'Isolate variable' kalkası qadağandır."
  },
  {
    id: "CALQUE_SOLVE_FOR_VARIABLE",
    regex: /dəyişəni\s+həll\s+(edin|etmək|edirik|et)/i,
    name: "Dəyişəni həll edin",
    replacement: "Məchulu tapın / Tənliyi həll edin",
    rule: "'Solve for variable' kalkası qadağandır."
  },
  {
    id: "CALQUE_ELIMINATE_RADICAL",
    regex: /kökaltı\s+ifadəni\s+kənarlaşdırın/i,
    name: "Kökaltı ifadəni kənarlaşdırın",
    replacement: "Məxrəci irrasionallıqdan azad edin",
    rule: "Kəsr məxrəcində kök olduqda rəsmi əmr: 'məxrəci irrasionallıqdan azad edin'."
  },
  {
    id: "CALQUE_SUBTRACTION_SQUARES",
    regex: /kvadratlar\s+çıxılması/i,
    name: "Kvadratlar çıxılması",
    replacement: "Kvadratlar fərqi",
    rule: "a^2 - b^2 düsturu 'kvadratlar fərqi' adlanır."
  },
  {
    id: "CALQUE_GREATEST_COMMON_DIVISOR",
    regex: /ən\s+böyük\s+ümumi\s+bölücü/i,
    name: "Ən böyük ümumi bölücü",
    replacement: "Ən böyük ortaq bölən (ƏBOB)",
    rule: "Rəsmi abbreviatura və termin: ƏBOB."
  },
  {
    id: "CALQUE_LEAST_COMMON_MULTIPLE",
    regex: /ən\s+kiçik\s+ümumi\s+çoxlu/i,
    name: "Ən kiçik ümumi çoxlu",
    replacement: "Ən kiçik ortaq bölünən (ƏKOB)",
    rule: "Rəsmi abbreviatura və termin: ƏKOB."
  },
  {
    id: "CALQUE_EQUATION_VALUE",
    regex: /tənliyin\s+dəyərini\s+tapın/i,
    name: "Tənliyin dəyərini tapın",
    replacement: "Tənliyin kökünü tapın",
    rule: "Tənliyin dəyəri olmur, kökü olur."
  },
  {
    id: "CALQUE_RADICAL_SYMBOL",
    regex: /radikal\s+işarəsi/i,
    name: "Radikal işarəsi",
    replacement: "Kök işarəsi",
    rule: "Dərslikdə yalnız 'kök işarəsi' işlədilir."
  },
  {
    id: "CALQUE_EXPAND_PARENTHESIS",
    regex: /mötərizəni\s+(genişləndirin|ləğv\s+edin)/i,
    name: "Mötərizəni genişləndirin/ləğv edin",
    replacement: "Mötərizəni açın",
    rule: "Rəsmi əmr feli: 'mötərizəni açın'."
  }
];

/**
 * Lints an individual text string against forbidden calques.
 * @param {string} text - Text to analyze
 * @returns {Array<{ id: string, name: string, replacement: string, rule: string, match: string, index: number }>}
 */
export function lintText(text) {
  if (typeof text !== "string" || !text.trim()) {
    return [];
  }

  const violations = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      violations.push({
        id: pattern.id,
        name: pattern.name,
        replacement: pattern.replacement,
        rule: pattern.rule,
        match: match[0],
        index: match.index ?? -1
      });
    }
  }
  return violations;
}

/**
 * Lints a full StepSchema JSON object.
 * @param {object} schema - Step schema object
 * @returns {Array<{ path: string, violation: object }>}
 */
export function lintStepSchema(schema) {
  if (!schema || typeof schema !== "object") return [];

  const violations = [];

  function checkField(path, val) {
    if (typeof val === "string") {
      const vList = lintText(val);
      for (const v of vList) {
        violations.push({ path, violation: v });
      }
    }
  }

  if (schema.canonical) checkField("canonical", schema.canonical);

  if (Array.isArray(schema.steps)) {
    schema.steps.forEach((step, idx) => {
      const prefix = `steps[${idx}]`;
      if (step.title) checkField(`${prefix}.title`, step.title);
      if (step.explanation) checkField(`${prefix}.explanation`, step.explanation);
      if (step.why) checkField(`${prefix}.why`, step.why);
      if (step.hint) checkField(`${prefix}.hint`, step.hint);
      if (step.check?.ask) checkField(`${prefix}.check.ask`, step.check.ask);
    });
  }

  return violations;
}

/**
 * Built-in self-test suite.
 */
export function runSelfTest() {
  console.log("🧪 Running Glossary Linter Self-Test Suite...");

  const badSamples = [
    { text: "Tənliyin hər iki tərəfinin kvadratını icra edin.", expectedId: "CALQUE_EXECUTE_SQUARE" },
    { text: "Məchulu sağ tərəfə tətbiq edin və toplayın.", expectedId: "CALQUE_APPLY_SIDE" },
    { text: "Alınan fraksiya sadələşdirilməlidir.", expectedId: "CALQUE_FRACTION" },
    { text: "Kəsrin nümeratoru 5-ə bərabərdir.", expectedId: "CALQUE_NUMERATOR" },
    { text: "Kəsrin denominatorunu tapın.", expectedId: "CALQUE_DENOMINATOR" },
    { text: "13 bir sadə rəqəmdir.", expectedId: "CALQUE_PRIME_DIGIT" },
    { text: "15 mürəkkəb rəqəmdir.", expectedId: "CALQUE_COMPOSITE_DIGIT" },
    { text: "Cavab tam nömrə olmalıdır.", expectedId: "CALQUE_WHOLE_NUMBER" },
    { text: "Hər təbii nömrə müsbətdir.", expectedId: "CALQUE_NATURAL_NUMBER" },
    { text: "Faktor cütünü müəyyən edin.", expectedId: "CALQUE_FACTOR_PAIR" },
    { text: "Ortaq faktoru mötərizədən çıxarın.", expectedId: "CALQUE_COMMON_FACTOR" },
    { text: "x-i izolyasiya edin.", expectedId: "CALQUE_ISOLATE_VARIABLE" },
    { text: "Dəyişəni həll edin.", expectedId: "CALQUE_SOLVE_FOR_VARIABLE" },
    { text: "Kökaltı ifadəni kənarlaşdırın.", expectedId: "CALQUE_ELIMINATE_RADICAL" },
    { text: "Kvadratlar çıxılması düsturunu tətbiq edin.", expectedId: "CALQUE_SUBTRACTION_SQUARES" },
    { text: "Ən böyük ümumi bölücü tapılmalıdır.", expectedId: "CALQUE_GREATEST_COMMON_DIVISOR" },
    { text: "Ən kiçik ümumi çoxlu hesablayın.", expectedId: "CALQUE_LEAST_COMMON_MULTIPLE" },
    { text: "Tənliyin dəyərini tapın.", expectedId: "CALQUE_EQUATION_VALUE" },
    { text: "Radikal işarəsi altından vuruğu çıxarın.", expectedId: "CALQUE_RADICAL_SYMBOL" },
    { text: "Mötərizəni ləğv edin və oxşar hədləri islah edin.", expectedId: "CALQUE_EXPAND_PARENTHESIS" }
  ];

  let passCount = 0;

  for (const sample of badSamples) {
    const res = lintText(sample.text);
    const found = res.find(v => v.id === sample.expectedId);
    if (!found) {
      throw new Error(`Self-test failed for: "${sample.text}". Expected ${sample.expectedId}, got: ${JSON.stringify(res)}`);
    }
    passCount++;
  }

  const goodSamples = [
    "Tənliyin hər iki tərəfini kvadrata yüksəldin.",
    "Məchulu tənliyin sağ tərəfinə əks işarə ilə keçirin.",
    "Kəsri ixtisar edin və surəti məxrəcə bölün.",
    "13 sadə ədəddir, çünki yalnız 1-ə və özünə bölünür.",
    "Vuruqlara ayırın və ortaq vuruğu mötərizə xaricinə çıxarın.",
    "Mötərizəni açın və oxşar hədləri islah edin.",
    "Məxrəci irrasionallıqdan azad edin.",
    "Ədədlərin ƏBOB və ƏKOB-unu tapın.",
    "Tənliyin kökünü tapın."
  ];

  for (const good of goodSamples) {
    const res = lintText(good);
    if (res.length > 0) {
      throw new Error(`Self-test false positive on: "${good}". Detected: ${JSON.stringify(res)}`);
    }
    passCount++;
  }

  // Test schema linter
  const testSchema = {
    canonical: "2x + 6 = 20",
    steps: [
      {
        title: "Kəsri ixtisar et",
        explanation: "Fraksiya surətini tap.",
        check: { ask: "Nümerator neçədir?" }
      }
    ]
  };
  const schemaRes = lintStepSchema(testSchema);
  if (schemaRes.length !== 2) {
    throw new Error(`Schema linting failed: expected 2 violations, got ${schemaRes.length}`);
  }
  passCount++;

  console.log(`✅ All ${passCount} glossary linter assertions PASSED!\n`);
  return true;
}

if (process.argv.includes("--selftest")) {
  try {
    runSelfTest();
    process.exit(0);
  } catch (err) {
    console.error("❌ Glossary linter selftest error:", err.message);
    process.exit(1);
  }
}
