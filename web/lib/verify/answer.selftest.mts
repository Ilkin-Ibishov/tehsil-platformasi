// `studentAnswerMatches` üçün xərcsiz selftest — HANDOFF (45) §1 ("null tələsi") tələb etdiyi
// test cədvəlini kilidləyir. `scripts/eval.py --selftest`-in TS qarşılığıdır (orada Python
// tərəfi `equationCrossCheck`-i yoxlayır, bura `studentAnswerMatches`-i — fərqli funksiya,
// fərqli risk sinfi: golden cavab yox, şagirdin sərbəst yazdığı mətn).
//
// İşə salma: node --experimental-strip-types web/lib/verify/answer.selftest.mts

import { studentAnswerMatches } from "./answer.ts";

const CASES: [string, string, boolean][] = [
  // HANDOFF (45) §1 — "parse alınmırsa nəticə bərabər deyil, bilinmir yox":
  ["", "0", false],
  ["???", "0", false],
  ["0,5", "0.5", true],
  ["1/2", "0.5", true],
  ["x", "x", true],
  ["???", "???", true], // sətir bərabərliyi son çarə kimi hələ işləyir
  // əlavə reqressiya: HANDOFF (44) §B1-də tapılan/düzəldilən hallar
  ["0.5", "1/2", true],
  ["A", "A", true],
  ["A", "B", false],
  ["3", "3", true],
  ["x = 8", "x=8", true],
  ["2x+1", "2 x + 1", true],
  ["-3", "−3", true], // unicode minus
  ["0", "", false],
  ["", "", false],
  // HANDOFF (45) §B1 / (51): `log(x, base)` arqument sırası — bir dəfə commit-dən əvvəl tutulub,
  // npm install olmadan tsc bu faylı yoxlaya bilmirdi (mathjs modul tapılmırdı). Reqressiya
  // qıfılı: sıra `(base, x)` olsaydı bu üç hal SƏHV qayıdardı.
  ["log_2(8)", "3", true],
  ["log_3(9)", "2", true],
  ["log2(16)", "4", true],
  // HANDOFF (104) — Ilkin-in əl testi: "Müsbət" (böyük hərflə) "müsbət" accept dəyərinə
  // uyğun gəlmirdi, çünki sətir bərabərliyi registrə HƏSSAS idi.
  ["Müsbət", "müsbət", true],
  ["MÜSBƏT", "müsbət", true],
  ["mənfi", "müsbət", false], // Ilkin-in qəsdən yazdığı SƏHV cavab — YENƏ səhv qalmalıdır
];

let fails = 0;
for (const [input, accept, expected] of CASES) {
  const got = studentAnswerMatches(input, accept);
  const ok = got === expected;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(input)} vs ${JSON.stringify(accept)} -> ${got} (gözlənilən ${expected})`);
}

if (fails > 0) {
  console.error(`\n${fails}/${CASES.length} uğursuz.`);
  process.exit(1);
}
console.log(`\n${CASES.length}/${CASES.length} keçdi.`);
