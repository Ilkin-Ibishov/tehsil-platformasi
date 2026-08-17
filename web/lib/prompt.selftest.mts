// Prompt loader selftest — LLM/DB ÇAĞIRILMIR.
// web qovluğundan: npx tsx lib/prompt.selftest.mts
import { chdir } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptTemplates, loadTranscribeTemplates, subjectUsesMathFallback } from "./prompt.ts";

chdir(path.join(fileURLToPath(new URL(".", import.meta.url)), ".."));

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = got === expected;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

const fallback = loadPromptTemplates();
check("fallback: şəkil qaydaları var", fallback.system.includes("ŞƏKİL GİRİŞİ"), true);
check("fallback: üç nümunə (cəm + xətti + kvadrat mətn)", fallback.system.includes("5+5=?") && fallback.system.includes("3x=12") && fallback.system.includes("Sahəsi 40"), true);

const qat5 = loadPromptTemplates({
  subject: "math",
  topicCode: "ARITH.ADDITION",
  includeImageRules: false,
});
check("qat5: şəkil qaydaları yox", qat5.system.includes("ŞƏKİL GİRİŞİ"), false);
check("qat5: məzmun qaydaları qalır", qat5.system.includes("MƏZMUN QAYDALARI"), true);
check("qat5: error_code enum qalır", qat5.system.includes("SIGN_LOST"), true);
check("qat5: cəm nümunəsi", qat5.system.includes("ARITH.ADDITION"), true);
check("qat5: kvadrat 6-addım nümunəsi yox", qat5.system.includes("Sahəsi 40"), false);
check("qat5: fallback-dən qısa", qat5.system.length < fallback.system.length, true);

const unknown = loadPromptTemplates({ subject: "math", topicCode: "ALG.NO_SUCH_TOPIC" });
check("naməlum mövzu: fənn fallback", unknown.system.includes("Sahəsi 40"), true);

const traversal = loadPromptTemplates({ subject: "math", topicCode: "../core" });
check("path traversal: ignore, fallback", traversal.system.includes("Sahəsi 40"), true);

const physics = loadPromptTemplates({ subject: "physics", topicCode: "MECH.KINEMATICS" });
check("mövcud fənn: fallbackUsed=false", qat5.fallbackUsed, false);
check("mövcud fənn: requestedSubject=math", qat5.requestedSubject, "math");
check("physics.md: fallbackUsed=false", physics.fallbackUsed, false);
check("physics.md: requestedSubject=physics", physics.requestedSubject, "physics");
check("physics + KINEMATICS nümunə", physics.system.includes("MECH.KINEMATICS"), true);
check("physics math fallback YOX", physics.system.includes("Sahəsi 40"), false);
check("physics subject sahəsi", physics.system.includes('"subject": "physics"'), true);
check("physics values vahidsiz", physics.system.includes('"16"'), true);

const chem = loadPromptTemplates({ subject: "chemistry" });
check("chemistry hələ fallbackUsed=true", chem.fallbackUsed, true);
check("chemistry requestedSubject", chem.requestedSubject, "chemistry");
check("subjectUsesMathFallback physics=false", subjectUsesMathFallback("physics"), false);
check("subjectUsesMathFallback chemistry=true", subjectUsesMathFallback("chemistry"), true);

const tMath = loadTranscribeTemplates({ subject: "math" });
check("transcribe math: fizika şaxəsi yox", tMath.system.includes("v_0"), false);
check("transcribe math: placeholder qalmır", tMath.system.includes("{{SUBJECT_BRANCH}}"), false);
const tPhys = loadTranscribeTemplates({ subject: "physics" });
check("transcribe physics: indeks qaydası", tPhys.system.includes("v_0"), true);
check("transcribe physics: dövrə", tPhys.system.includes("ardıcıl/paralel"), true);
check("transcribe physics: Qat 1 hələ kiçik", tPhys.system.length - tMath.system.length < 800, true);

if (fails) {
  console.log(`\n${fails} uğursuz.`);
  process.exit(1);
}
console.log("\nHamısı keçdi.");
