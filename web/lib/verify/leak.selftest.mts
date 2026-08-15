// `detectLeak` üçün xərcsiz selftest — ADR-005-i kilidləyir. `scripts/lib/leak.py`-ın TS
// qarşılığı (ADR-012) — eyni halları eyni nəticə ilə keçməlidir.
//
// HANDOFF 106 (2026-08-15): real 99-sualıq DIM dəstində 9 "sızma" əl ilə izlənildi. 4-ü
// dəyərin özü ilə əlaqəsiz təsadüfi rəqəm toqquşması idi (ordinal şəkilçi, domen intervalı,
// müqayisə operatoru, düstur əmsalı) — `leakedInText`-ə 4 dar istisna əlavə edildi. Qalan
// 5-i (o cümlədən son-addım yoxlamasının özü) ADR-005-in qəsdən j<i qaydasına görə DOĞRU
// sızma olaraq qalır.
//
// İşə salma: npx tsx web/lib/verify/leak.selftest.mts

import { detectLeak } from "./leak.ts";

type Step = { explanation?: string; check?: { accept?: string[] } };

const CASES: [string, Step[], string[], boolean][] = [
  // ADR-005-in özünün qurucu halı (fx-003): əvvəlki addımda accept edilmiş dəyərə sonrakı
  // addımda istinad — sızma DEYİL.
  [
    "fx-003: yoxlama əvvəlki accept-ə istinad edir",
    [
      { explanation: "Yeni qiyməti hesabla.", check: { accept: ["230"] } },
      { explanation: "230-un 200-dən neçə faiz çox olduğunu hesabla.", check: { accept: ["15"] } },
    ],
    ["230"],
    false,
  ],
  // Klassik müsbət: addım öz sualının cavabını ÖZ izahında açıqlayır.
  [
    "öz sualının cavabı öz izahında",
    [
      { explanation: "Düsturu tətbiq etsək x 3-ə bərabər olur.", check: { accept: ["3"] } },
      { explanation: "İkinci kök tapılır.", check: { accept: ["2"] } },
    ],
    ["3", "2"],
    true,
  ],
  // HANDOFF 106 — 4 yalançı-müsbət (əvvəllər sızma sayılırdı, artıq YOX):
  ["ordinal şəkilçi: '2-ci'", [{ explanation: "2-ci, 3-cü və 4-cü düsturların doğruluğunu yoxla." }], ["2"], false],
  [
    "domen intervalı: '[-90°, 90°]'",
    [{ explanation: "sinusu 1-ə bərabər olan və [-90°, 90°] parçasına daxil olan bucağı tap." }],
    ["90", "90°"],
    false,
  ],
  ["müqayisə operatoru: '8 > 1'", [{ explanation: "Əsas 8 > 1 olduğu üçün işarə dəyişmir." }], ["1"], false],
  [
    "düstur əmsalı: '1/(2√x)'",
    [{ explanation: "(√x)' = 1/(2√x) düsturunu xatırla." }],
    ["2"],
    false,
  ],
  // Reqressiya qıfılı: yuxarıdakı ordinal istisnası HƏQİQİ sızmanı ("3-ə bərabər" — bərabərlik
  // şəkilçisi, sıra şəkilçisi YOX) udmamalıdır — ilk versiyada məhz bunu qırmışdı.
  ["reqressiya: '-ə' bərabərlik şəkilçisi ordinal DEYİL", [{ explanation: "x 3-ə bərabər olur." }], ["3"], true],
];

let fails = 0;
for (const [label, steps, values, expected] of CASES) {
  const got = detectLeak(steps, values);
  const ok = got === expected;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${got} (gözlənilən ${expected})`);
}

if (fails > 0) {
  console.error(`\n${fails}/${CASES.length} uğursuz.`);
  process.exit(1);
}
console.log(`\n${CASES.length}/${CASES.length} keçdi.`);
