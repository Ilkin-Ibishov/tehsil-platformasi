// `formatMath` üçün xərcsiz selftest — ADR-015 cədvəlini kilidləyir.
// İşə salma: npx tsx web/lib/math-format.selftest.mts
// (sadə `node --experimental-strip-types` işləmir — `math-format.ts` `verify/answer`-i
// genişləndirmə olmadan idxal edir, `tsx`-ə fərqli olaraq Node-un öz ESM loader-i
// genişləndirməsiz yerli import-ları həll edə bilmir.)

import { formatMath, findUnformattedLatex } from "./math-format.ts";

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
  // HANDOFF (55): subscript indi çevrilir — sxemin öz nümunə formatı ("x_1 = 3,\ x_2 = 2")
  ["x_1 = 3,\\ x_2 = 2", "x₁ = 3, x₂ = 2"],
  ["x_{12}", "x₁₂"],
  ["a \\times b", "a × b"],
  ["x \\in \\mathbb{N}", "x ∈ ℕ"],
  ["x \\in \\mathbb{R}", "x ∈ ℝ"],
  ["P \\implies Q", "P ⇒ Q"],
  ["1, 2, 3, \\dots", "1, 2, 3, …"],
  ["a \\quad b", "a b"],
  ["\\text{en} = 5", "en = 5"],
  ["\\bar{x}", "x"],
  // HANDOFF (55): onluq vergül VƏ siyahı vergülü eyni mətndə — siyahı ";"-ə keçir
  ["x_1 = 3.5, x_2 = 2.5", "x₁ = 3,5; x₂ = 2,5"],
  // onluq YOXdursa siyahı vergülü toxunulmur (birmənalıdır)
  ["x_1 = 3, x_2 = 2", "x₁ = 3, x₂ = 2"],
  // UX audit tapıntısı (2026-08-14): \% əvvəllər TƏMİZLƏNMİRDİ — "1\% = (200)/(100)" kimi
  // ekranda görünürdü. findUnformattedLatex-in reqex-i (\[a-zA-Z]+) bunu tuta bilmirdi.
  ["1\\% = \\frac{200}{100}", "1% = (200)/(100)"],
  ["50\\%", "50%"],
  // HANDOFF (103): production-da `k = \tan\alpha` xam göstərilirdi (`render.unformatted_latex`
  // `\tan`-ı ölçdü) — `\alpha` EYNİ sətirdə idi, ikisi birlikdə düzəldildi.
  ["k = \\tan\\alpha", "k = tanα"],
];

let fails = 0;
for (const [input, expected] of CASES) {
  const got = formatMath(input);
  const ok = got === expected;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(input)} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

const UNFORMATTED_CASES: [string, string | null][] = [
  ["x^2 - 5x", null],
  // HANDOFF (103): `\alpha` indi tanınır (ölçülüb) — qalan ilk tanınmayan `\beta`-dır.
  // `\beta`-nın ÖZÜ hələ cədvəldə YOXDUR (ölçülməyib, HANDOFF 55 qaydası).
  ["\\alpha + \\beta", "\\beta"],
  ["x_1 \\in \\mathbb{N}", null],
  ["k = \\tan\\alpha", null],
];

for (const [input, expectedToken] of UNFORMATTED_CASES) {
  const got = findUnformattedLatex(formatMath(input));
  const ok = got === expectedToken;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  findUnformattedLatex(formatMath(${JSON.stringify(input)})) -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expectedToken)})`);
}

const total = CASES.length + UNFORMATTED_CASES.length;
if (fails > 0) {
  console.error(`\n${fails}/${total} uğursuz.`);
  process.exit(1);
}
console.log(`\n${total}/${total} keçdi.`);
