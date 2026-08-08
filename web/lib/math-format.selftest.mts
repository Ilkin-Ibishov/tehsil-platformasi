// `formatMath` üçün xərcsiz selftest — ADR-015 cədvəlini kilidləyir.
// İşə salma: npx tsx web/lib/math-format.selftest.mts
// (sadə `node --experimental-strip-types` işləmir — `math-format.ts` `verify/answer`-i
// genişləndirmə olmadan idxal edir, `tsx`-ə fərqli olaraq Node-un öz ESM loader-i
// genişləndirməsiz yerli import-ları həll edə bilmir.)

import { formatMath } from "./math-format.ts";

const CASES: [string, string][] = [
  ["x^2", "x²"],
  ["x^{10}", "x¹⁰"],
  ["x^2 - 5x + 6 = 0", "x² − 5x + 6 = 0"],
  ["b^2 - 4ac", "b² − 4ac"],
  ["a \\cdot b", "a · b"],
  ["3*4", "3·4"],
  ["\\sqrt{D}", "√D"],
  ["sqrt(D)", "√D"],
  ["\\log_3", "log₃"],
  ["log_3(x)", "log₃(x)"],
  ["3.5", "3,5"],
  ["$x = 3$", "x = 3"],
  ["\\left(x\\right)", "(x)"],
  ["\\frac{a}{b}", "(a)/(b)"],
  ["\\frac{x-1}{3}", "(x−1)/(3)"],
  ["x_1 = 3,\\ x_2 = 2", "x_1 = 3, x_2 = 2"],
];

let fails = 0;
for (const [input, expected] of CASES) {
  const got = formatMath(input);
  const ok = got === expected;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(input)} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

if (fails > 0) {
  console.error(`\n${fails}/${CASES.length} uğursuz.`);
  process.exit(1);
}
console.log(`\n${CASES.length}/${CASES.length} keçdi.`);
