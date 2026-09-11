#!/usr/bin/env node
/**
 * leak-guard.mjs
 * 
 * AG-017: Automated Semantic Hint Leakage Guard.
 * Enforces Socratic discipline and zero semantic leakage in hints (Rule 19 & DIM-GLOSSARY §3).
 * Detects:
 * 1. Verbatim step answer leakage in `hint` text.
 * 2. 1-step direct arithmetic instructions (e.g. "25 - 4·7 hesabla", "3-ü 4-ə vur").
 * 3. Direct result declarations (e.g. "cavab 3-dür", "yəni cəmi 3 kök var").
 * 4. Pre-empted selection instructions (e.g. "6.25-dən böyük ilk tam ədədi götür", "mənfi kökü at").
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const ORDINAL_SUFFIX_RE = /^-(ci|cı|cü|cu|nci|ncı|ncü|ncu|inci|ıncı|uncu|üncü)\b/iu;

// Direct arithmetic instruction patterns (forbidden in hints)
const DIRECT_ARITHMETIC_PATTERNS = [
  {
    id: "NUMERIC_ARITHMETIC_EXPRESSION",
    // Matches expressions like: 25 - 4·7, 800 - 200, 3 * 4, 12 / 3, 3^2 = 9
    regex: /(?<![\w.])\d+\s*[-+*/·×÷−]\s*\d+(?!\d*-(ci|cı|cü|cu|nci|ncı|ncü|ncu|inci|ıncı|uncu|üncü))\b/u,
    description: "Birbaşa ədədi hesablama ifadəsi"
  },
  {
    id: "DIRECT_ARITHMETIC_VERB_INSTRUCTION",
    // Matches e.g.: "3-ü 4-ə vur", "12-ni 3-ə böl", "−3+13-ü hesabla"
    regex: /\b\d+-(?:ü|i|ı|u|yə|ya|ə|a|ni|nı|nu|nü)\s+\d+-(?:ə|a|yə|ya|ü|i|ı|u)\s+(?:vur|böl|topla|çıx)/iu,
    description: "Birbaşa əməliyyat əmri (vur / böl / topla / çıx)"
  },
  {
    id: "DIRECT_CALCULATION_COMMAND",
    // Matches e.g.: "25 − 4·7 hesabla", "-3+13-ü hesabla"
    regex: /[-+*/·×÷−]\s*\d+.*?\b(?:hesabla|tap|yaz)\b/iu,
    description: "Əməliyyat ardınca hesablama əmri"
  },
  {
    id: "IMPERATIVE_SELECTION_COMMAND",
    // Matches e.g.: "6.25-dən böyük ilk tam ədədi götür", "mənfi kökü at"
    regex: /\b(?:ilk|ən\s+kiçik|ən\s+böyük|mənfi|müsbət)\s+(?:tam\s+ədədi|kökü|həddi)\s+(?:götür|seç|at)\b/iu,
    description: "Şagirdin yerinə birbaşa seçim əmri"
  },
  {
    id: "DIRECT_ANSWER_DECLARATION",
    // Matches e.g.: "cavab 3-dür", "nəticə 4-dür", "yəni cəmi 3 kök var", "yəni 2 natural kök var"
    regex: /\b(?:cavab|nəticə)\s+\d+-(?:dir|dür|dur|dır)\b|\byəni\s+(?:cəmi\s+)?\d+\s+(?:natural\s+)?kök\s+var\b/iu,
    description: "Birbaşa cavab/nəticə bəyanatı"
  }
];

function normalize(v) {
  return String(v).replace(/−/g, "-").trim();
}

/**
 * Checks if a specific target value leaks into text
 */
function isValueLeakedInText(val, text) {
  const normVal = normalize(val);
  const normText = normalize(text);
  if (!normVal || normVal.length === 0) return false;

  // Escape special regex chars
  const escaped = normVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<![\\w.])${escaped}(?!\\w)(?!-\\d)(?!\\.\\d)`, "gu");

  let match;
  while ((match = re.exec(normText)) !== null) {
    const end = match.index + match[0].length;
    // Check if followed by ordinal suffix like -ci, -cu
    if (ORDINAL_SUFFIX_RE.test(normText.slice(end, end + 5))) continue;
    // Check if within brackets like [-90, 90]
    const beforeText = normText.slice(0, match.index);
    const afterText = normText.slice(end);
    if (beforeText.lastIndexOf("[") > beforeText.lastIndexOf("]") && afterText.indexOf("]") !== -1) {
      continue;
    }
    return true;
  }
  return false;
}

/**
 * Checks a single step for semantic hint leakage.
 * Returns null if clean, or an object describing the violation.
 */
export function detectSemanticHintLeak(step) {
  if (!step || typeof step !== "object") return null;
  const hint = step.hint;
  if (!hint || typeof hint !== "string") return null;

  // 1. Check direct arithmetic & imperative patterns
  for (const pat of DIRECT_ARITHMETIC_PATTERNS) {
    const match = pat.regex.exec(hint);
    if (match) {
      return {
        type: "SEMANTIC_HINT_LEAK",
        ruleId: pat.id,
        reason: `${pat.description}: "${match[0]}"`,
        matchedText: match[0],
        hint: hint,
        stepIndex: step.index ?? null,
      };
    }
  }

  // 2. Check if step's accepted answer leaks in hint
  const acceptValues = step.check?.accept;
  if (Array.isArray(acceptValues)) {
    for (const val of acceptValues) {
      if (isValueLeakedInText(val, hint)) {
        return {
          type: "SEMANTIC_HINT_LEAK",
          ruleId: "STEP_ANSWER_LEAK",
          reason: `Step accepted answer "${val}" is leaked in hint`,
          matchedText: String(val),
          hint: hint,
          stepIndex: step.index ?? null,
        };
      }
    }
  }

  return null;
}

/**
 * Lints an array of steps for hint leakage.
 * Returns an array of violations.
 */
export function lintStepHints(steps) {
  if (!Array.isArray(steps)) return [];
  const violations = [];
  for (const step of steps) {
    const violation = detectSemanticHintLeak(step);
    if (violation) violations.push(violation);
  }
  return violations;
}

/**
 * Lints a whole solution schema.
 */
export function lintSchemaHints(schema) {
  if (!schema || !Array.isArray(schema.steps)) return [];
  return lintStepHints(schema.steps);
}

/**
 * Self-test suite for leak-guard.
 */
export function runSelfTest() {
  console.log("🛡️ Running Semantic Hint Leak Guard Selftest...\n");

  const badSamples = [
    {
      label: "Aytən bug: 6.25-dən böyük ilk tam ədədi götür",
      step: { index: 3, hint: "6.25-dən böyük ilk tam ədədi götür.", check: { accept: ["7"] } },
      expectedRule: "IMPERATIVE_SELECTION_COMMAND"
    },
    {
      label: "Aytən bug: 25 − 4·7 hesabla",
      step: { index: 4, hint: "25 − 4·7 hesabla.", check: { accept: ["-3"] } },
      expectedRule: "NUMERIC_ARITHMETIC_EXPRESSION"
    },
    {
      label: "Bank bug: yəni cəmi 3 kök var",
      step: { index: 2, hint: "Köklər x = 0, x = 4 və x = 5-dir, yəni cəmi 3 kök var.", check: { accept: ["3"] } },
      expectedRule: "DIRECT_ANSWER_DECLARATION"
    },
    {
      label: "Bank bug: yəni 2 natural kök var",
      step: { index: 3, hint: "4 və 5 natural ədədlərdir, 0 isə natural ədəd deyil, yəni 2 natural kök var.", check: { accept: ["2"] } },
      expectedRule: "DIRECT_ANSWER_DECLARATION"
    },
    {
      label: "Direct verb instruction: 3-ü 4-ə vur",
      step: { index: 2, hint: "3-ü 4-ə vur.", check: { accept: ["12"] } },
      expectedRule: "DIRECT_ARITHMETIC_VERB_INSTRUCTION"
    },
    {
      label: "Calculation instruction: Əvvəlcə −3+13-ü hesabla, sonra 2-yə böl",
      step: { index: 4, hint: "Əvvəlcə −3+13-ü hesabla, sonra 2-yə böl.", check: { accept: ["5"] } },
      expectedRule: "DIRECT_CALCULATION_COMMAND"
    },
    {
      label: "Check answer leak: 13² = 169 olduğunu yoxla",
      step: { index: 3, hint: "13² = 169 olduğunu yoxla.", check: { accept: ["13"] } },
      expectedRule: "NUMERIC_ARITHMETIC_EXPRESSION"
    },
    {
      label: "Direct answer declaration: cavab 3-dür",
      step: { index: 1, hint: "Düsturu aç, cavab 3-dür.", check: { accept: ["3"] } },
      expectedRule: "DIRECT_ANSWER_DECLARATION"
    }
  ];

  let passed = 0;
  for (const sample of badSamples) {
    const leak = detectSemanticHintLeak(sample.step);
    if (!leak) {
      throw new Error(`FAIL: Expected leak detection for: "${sample.label}", but got null.`);
    }
    console.log(`  ✅ PASS: ${sample.label} -> detected [${leak.ruleId}] "${leak.matchedText}"`);
    passed++;
  }

  const goodSamples = [
    {
      label: "Socratic: 6.25 tam ədəd nöqtəsi",
      step: {
        index: 3,
        hint: "Tam ədəd anlayışını (kəsr hissəsi olmayan) və ədədlər oxunda 6,25-dən böyük ilk tam nöqtəni nəzərdən keçir.",
        check: { accept: ["7"] }
      }
    },
    {
      label: "Socratic: Diskriminant ifadəsində yerinə qoy",
      step: {
        index: 4,
        hint: "Tapılmış tam parametri diskriminant ifadəsində yerinə qoyaraq nəticənin həqiqətən mənfi olduğunu yoxla.",
        check: { accept: ["-3", "−3"] }
      }
    },
    {
      label: "Socratic: Vuruqların sıfıra bərabərlik prinsipi",
      step: {
        index: 2,
        hint: "Hasilin sıfıra bərabər olması üçün vuruqların hər birini ayrı-ayrılıqda sıfıra bərabər et.",
        check: { accept: ["3"] }
      }
    },
    {
      label: "Socratic: Natural ədədlər tərifi",
      step: {
        index: 3,
        hint: "Natural ədədlər sayma zamanı işlətdiyimiz ədədlərdir (0 natural ədəd deyil).",
        check: { accept: ["2"] }
      }
    },
    {
      label: "Socratic: Məchul vuruq qaydası",
      step: {
        index: 1,
        hint: "Qayda: Məchul vuruğu tapmaq üçün hasili məlum vuruğa bölmək lazımdır.",
        check: { accept: ["4"] }
      }
    },
    {
      label: "Socratic: Düstur xatırlatması",
      step: {
        index: 2,
        hint: "Diqqət yetir: D = b² − 4ac düsturunda əmsalların işarəsinə və mənfini mənfiyə vurma qaydasına.",
        check: { accept: ["169"] }
      }
    },
    {
      label: "Socratic: 10-dan böyük kvadratlar",
      step: {
        index: 3,
        hint: "Xatırla: Hansı ədədin kvadratı 169 edir? 10-dan böyük ədədlərin kvadratlarını nəzərdən keçir.",
        check: { accept: ["13"] }
      }
    },
    {
      label: "Socratic: Kəsr surət və məxrəc ardıcıllığı",
      step: {
        index: 4,
        hint: "Qayda: Kəsrin qiymətini tapmaq üçün əvvəlcə surətdəki cəmi tap, sonra məxrəcə böl.",
        check: { accept: ["5"] }
      }
    },
    {
      label: "Socratic: Həndəsi ölçü müsbət kəmiyyət",
      step: {
        index: 5,
        hint: "Diqqət yetir: Həndəsi ölçü (uzunluq, en) həmişə müsbət kəmiyyət olmalıdır.",
        check: { accept: ["5"] }
      }
    }
  ];

  for (const sample of goodSamples) {
    const leak = detectSemanticHintLeak(sample.step);
    if (leak) {
      throw new Error(`FAIL: False positive for: "${sample.label}": detected [${leak.ruleId}] "${leak.matchedText}" in "${sample.step.hint}"`);
    }
    console.log(`  ✅ PASS (No Leak): ${sample.label}`);
    passed++;
  }

  console.log(`\n🎉 All ${passed} semantic hint leak assertions PASSED!\n`);
  return true;
}

function collectMarkdownFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractJsonObjectsFromMarkdown(content) {
  const objects = [];
  // 1. Extract markdown code blocks
  const codeBlockRe = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let m;
  while ((m = codeBlockRe.exec(content)) !== null) {
    try {
      const clean = m[1].replace(/\/\/.*$/gm, "");
      const obj = JSON.parse(clean);
      if (obj && typeof obj === "object") objects.push(obj);
    } catch {
      // not valid JSON, ignore
    }
  }
  return objects;
}

/**
 * Checks all prompt example JSONs in prompts/solve/ for hint leaks.
 */
export function checkPromptFiles() {
  console.log("🔍 Checking all prompt few-shot examples for semantic hint leaks...\n");
  const solveDir = path.join(repoRoot, "prompts", "solve");
  const promptFiles = fs.existsSync(solveDir) ? collectMarkdownFiles(solveDir) : [];

  let errors = 0;
  let filesChecked = 0;
  let examplesChecked = 0;

  for (const file of promptFiles) {
    const content = fs.readFileSync(file, "utf8");
    const jsonObjects = extractJsonObjectsFromMarkdown(content);
    if (jsonObjects.length === 0) continue;

    filesChecked++;
    for (const obj of jsonObjects) {
      if (Array.isArray(obj.steps)) {
        examplesChecked++;
        const violations = lintStepHints(obj.steps);
        for (const v of violations) {
          console.error(`❌ LEAK in ${path.relative(repoRoot, file)} (Step ${v.stepIndex}):`);
          console.error(`   Rule: ${v.ruleId} (${v.reason})`);
          console.error(`   Hint: "${v.hint}"\n`);
          errors++;
        }
      }
    }
  }

  if (errors > 0) {
    console.error(`💥 Found ${errors} semantic hint leak(s) across ${filesChecked} prompt files (${examplesChecked} examples).`);
    return false;
  }
  console.log(`✅ All ${examplesChecked} prompt few-shot examples across ${filesChecked} prompt files passed semantic hint leak check!\n`);
  return true;
}

if (process.argv.includes("--selftest")) {
  try {
    runSelfTest();
    process.exit(0);
  } catch (err) {
    console.error("❌ Leak-guard selftest error:", err.message);
    process.exit(1);
  }
}

if (process.argv.includes("--check-prompts")) {
  const ok = checkPromptFiles();
  process.exit(ok ? 0 : 1);
}
