// `ocr_captures` yazısının xərcsiz hissəsi — ClickUp 86eymfg85. DB ÇAĞIRILMIR.
// İşə salma: npx tsx web/lib/cascade/ocr-capture.selftest.mts

import { levenshteinDistance, classifyCorrection } from "./ocr-capture.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

check("levenshtein: eyni sətir", levenshteinDistance("x^2-7x+6=0", "x^2-7x+6=0"), 0);
check("levenshtein: 7 → 1 (tək simvol)", levenshteinDistance("x^2-7x+6=0", "x^2-1x+6=0"), 1);
check("levenshtein: boş sətirlərdən biri", levenshteinDistance("", "abc"), 3);
check("levenshtein: tam fərqli", levenshteinDistance("abc", "xyz"), 3);
check("levenshtein: simmetrikdir", levenshteinDistance("kitten", "sitting"), levenshteinDistance("sitting", "kitten"));
check("levenshtein: kitten/sitting klassik dəyər", levenshteinDistance("kitten", "sitting"), 3);

check("classify: fərq yoxdursa none", classifyCorrection("x=1", "x=1", 0), "none");
check(
  "classify: 1 simvol / 10 simvol (10%) → minor",
  classifyCorrection("x^2-7x+6=0", "x^2-1x+6=0", 1),
  "minor"
);
check(
  "classify: tam fərqli qısa mətn → major",
  classifyCorrection("x=1", "y=9", 3),
  "major"
);
check(
  "classify: uzun mətndə kiçik fərq → minor (nisbi hesablanır, mütləq YOX)",
  classifyCorrection(
    "Bir malın qiyməti 200 manatdır. Qiymət 15% artırılıb. Malın yeni qiyməti neçə manat olar?",
    "Bir malın qiyməti 200 manatdır. Qiymət 25% artırılıb. Malın yeni qiyməti neçə manat olar?",
    1
  ),
  "minor"
);

console.log(fails === 0 ? "\nHAMISI KEÇDİ" : `\n${fails} TEST UĞURSUZ`);
process.exit(fails === 0 ? 0 : 1);
