// ClickUp 86eyn28kn — ilişmə keçidi reqressiya qıfılı.
// İşə salma: npx tsx web/lib/verify/step-pass.selftest.mts

import { canPassStuckStep, resolveStepPass } from "./step-pass.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

check(
  "ipucu + səhv, orta addım — keçilə bilər",
  canPassStuckStep({ isLastStep: false, hintOpen: true, status: "wrong" }),
  true,
);
check(
  "ipucu yoxdur — keçilməz (hələ ilişmə deyil)",
  canPassStuckStep({ isLastStep: false, hintOpen: false, status: "wrong" }),
  false,
);
check(
  "səhv cəhd yoxdur — keçilməz",
  canPassStuckStep({ isLastStep: false, hintOpen: true, status: "idle" }),
  false,
);
check(
  "doğru cavab — keç düyməsi yox",
  canPassStuckStep({ isLastStep: false, hintOpen: true, status: "correct" }),
  false,
);
check(
  "yoxlanır — keçilməz",
  canPassStuckStep({ isLastStep: false, hintOpen: true, status: "checking" }),
  false,
);
check(
  "son addım — «Cavabı göstər» qalır, keç yox",
  canPassStuckStep({ isLastStep: true, hintOpen: true, status: "wrong" }),
  false,
);

check("server: səhv cəhd var — ok", resolveStepPass({ isLastStep: false, alreadyCorrect: false, hasWrongAttempt: true }), {
  ok: true,
});
check("server: səhv cəhd yoxdur", resolveStepPass({ isLastStep: false, alreadyCorrect: false, hasWrongAttempt: false }), {
  ok: false,
  error: "no_wrong_attempt",
});
check("server: artıq doğru", resolveStepPass({ isLastStep: false, alreadyCorrect: true, hasWrongAttempt: true }), {
  ok: false,
  error: "already_correct",
});
check("server: son addım", resolveStepPass({ isLastStep: true, alreadyCorrect: false, hasWrongAttempt: true }), {
  ok: false,
  error: "last_step",
});

if (fails > 0) {
  console.error(`\n${fails} FAIL`);
  process.exit(1);
}
console.log("\n11/11 keçdi");
