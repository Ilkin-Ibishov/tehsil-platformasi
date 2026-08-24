// `studentAnswerMatches` üçün xərcsiz selftest — HANDOFF (45) §1 ("null tələsi") tələb etdiyi
// test cədvəlini kilidləyir. `scripts/eval.py --selftest`-in TS qarşılığıdır (orada Python
// tərəfi `equationCrossCheck`-i yoxlayır, bura `studentAnswerMatches`-i — fərqli funksiya,
// fərqli risk sinfi: golden cavab yox, şagirdin sərbəst yazdığı mətn).
//
// İşə salma: node --experimental-strip-types web/lib/verify/answer.selftest.mts

import { studentAnswerMatches, verifyFinalAnswer, equationCrossCheck } from "./answer.ts";

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
  // Mobil riyaziyyat çipləri və Unicode simvolları (Streaming Steps / Math Chips):
  ["√4", "2", true],
  ["√9 + 1", "4", true],
  ["3²", "9", true],
  ["2³", "8", true],
  ["π", "pi", true],
  ["2π", "2*pi", true],
  ["10 ÷ 2", "5", true],
  ["4 · 5", "20", true],
];

let fails = 0;
for (const [input, accept, expected] of CASES) {
  const got = studentAnswerMatches(input, accept);
  const ok = got === expected;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(input)} vs ${JSON.stringify(accept)} -> ${got} (gözlənilən ${expected})`);
}

if (fails > 0) {
  console.error(`\n${fails}/${CASES.length} studentAnswerMatches uğursuz.`);
} else {
  console.log(`\n${CASES.length}/${CASES.length} studentAnswerMatches keçdi.`);
}

type VerifyCase = {
  name: string;
  canonical: string;
  values: string[];
  subject?: string;
  expect: boolean | null;
};

const VERIFY_CASES: VerifyCase[] = [
  // mövcud tək-dəyişənli yol (gizlətmə hələ false)
  { name: "linear true", canonical: "2x+6=20", values: ["7"], expect: true },
  { name: "linear false", canonical: "2x+6=20", values: ["8"], expect: false },
  // çoxdəyişənli: nöqtəni yerinə qoy
  { name: "y=k/x through point", canonical: "$y = \\frac{k}{x}$ funksiyasının qrafiki $D\\left(9; -\\frac{1}{3}\\right)$ nöqtəsindən keçirsə, $k$-nı tapın.", values: ["-3"], expect: true },
  { name: "y=(k-2)/x through A", canonical: "k-nın hansı qiymətində $y = \\frac{k-2}{x}$ funksiyasının qrafiki $A(-3; -7)$ nöqtəsindən keçir?", values: ["23"], expect: true },
  { name: "y=ax^2 through A", canonical: "a-nın hansı qiymətində $y = ax^2$ funksiyasının qrafiki $A(-2, -28)$ nöqtəsindən keçir?", values: ["-7"], expect: true },
  { name: "y=k/x prose point", canonical: "y = k/x funksiyasının qrafiki B(-25; -1/5) nöqtəsindən keçirsə, k-nı tapın.", values: ["5"], expect: true },
  // söz məsələsi / ədədi ifadə (tənlik yox)
  { name: "sum without equals", canonical: "17+26, cəmi tapılmalıdır", values: ["43"], expect: true },
  { name: "big sum", canonical: "123456789+987654321 cəmi tapılmalıdır", values: ["1111111110"], expect: true },
  { name: "placeholder 5+5=?", canonical: "5+5=?, cəm tapılmalıdır", values: ["10"], expect: true },
  { name: "placeholder 56+27=?", canonical: "56+27=?, cəm tapılmalıdır", values: ["83"], expect: true },
  { name: "hesabla power", canonical: "Hesablayın: (5^(1+sqrt(2)))^(1-sqrt(2))\nA) 3\nB) 4\nC) 5\nD) 1/5\nE) 25", values: ["1/5", "0.2"], expect: true },
  { name: "hesabla sqrt", canonical: "Hesablayın: \\sqrt{0,64}\nA) 0,8\nB) 4", values: ["0,8", "0.8"], expect: true },
  { name: "arithmetic sequence", canonical: "2; x+3; 12 ədədləri ədədi silsilənin ardıcıl hədləridir. x-i tapın.", values: ["4"], expect: true },
  { name: "triangle third angle", canonical: "İki oxşar üçbucaqdan birinin iki bucağı 43° və 57°-dir. O biri bucağını tapın.", values: ["80"], expect: true },
  { name: "circle radius from area", canonical: "Sahəsi $81\\pi\\text{ sm}^2$ olan dairənin radiusunu tapın.", values: ["9"], expect: true },
  { name: "k+b from intercepts", canonical: "12. y=kx+b funksiyasının qrafikinə əsasən k+b cəmini tapın. Qrafikdə düz xətt y oxunu -5 nöqtəsində, x oxunu 5 nöqtəsində kəsir.", values: ["-4"], expect: true },
  { name: "right triangle inradius", canonical: "Katetləri 6sm və 8sm olan düzbucaqlı üçbucağın daxilinə çəkilmiş çevrənin radiusunu tapın.", values: ["2"], expect: true },
  { name: "inradius ignores variant sm", canonical: "42. Katetləri 6sm və 8sm olan düzbucaqlı üçbucağın daxilinə çəkilmiş çevrənin radiusunu tapın.\nA) 8 sm\nB) 6 sm\nC) 4 sm\nD) 2 sm\nE) 14 sm", values: ["2"], expect: true },
  { name: "complex root min m", canonical: "m parametrinin hansı ən kiçik tam qiymətində x² + 5x + m = 0 tənliyinin kompleks kökü olar?", values: ["7"], expect: true },
  { name: "probability not false", canonical: "x^3 - 9x² + 20x = 0 tənliyinin təsadüfi həllinin natural ədəd olması hadisəsinin ehtimalını tapın.", values: ["2/3"], expect: null },
  // yeni yol yanlış cavabı GİZLƏTMİR
  { name: "placeholder wrong stays null", canonical: "5+5=?, cəm tapılmalıdır", values: ["11"], expect: null },
  { name: "word problem no relation", canonical: "DƏNİZ sözü 12537 – isə, DƏRƏ sözünü hansı ədəd ifadə edir?", values: ["1282"], expect: null },
  // fənn qapısı
  { name: "physics always null", canonical: "2x+6=20", values: ["7"], subject: "physics", expect: null },
  { name: "chemistry always null", canonical: "5+5=?", values: ["10"], subject: "chemistry", expect: null },
];

let vFails = 0;
let vTrue = 0;
for (const c of VERIFY_CASES) {
  const { verified } = c.subject
    ? verifyFinalAnswer(c.canonical, c.values, c.subject)
    : equationCrossCheck(c.canonical, c.values);
  const ok = verified === c.expect;
  if (!ok) vFails++;
  if (verified === true) vTrue++;
  console.log(`${ok ? "PASS" : "FAIL"}  verify:${c.name} -> ${JSON.stringify(verified)} (gözlənilən ${JSON.stringify(c.expect)})`);
}

console.log(`\nverify: ${VERIFY_CASES.length - vFails}/${VERIFY_CASES.length} keçdi; true=${vTrue}`);

if (fails + vFails > 0) {
  console.error(`\n${fails + vFails} uğursuz.`);
  process.exit(1);
}
console.log(`\nHamısı keçdi.`);
process.exit(0);
