// pHash selftesti — ClickUp 86eymfgbv. Sintetik şəkillər (`sharp`-ın `create` rejimi) —
// real JPEG faylı lazım deyil. Qəbul meyarının ÖZÜNÜ ölçür: "oxşar şəkil → kiçik Hamming
// məsafəsi, fərqli şəkil → böyük məsafə".
//
// İşə salma: npx tsx web/lib/phash.selftest.mts

import sharp from "sharp";
import { computePHash, phashFromGrayscaleMatrix, hammingDistanceHex } from "./phash.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

function checkTrue(label: string, condition: boolean, detail: string) {
  if (!condition) fails++;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label} (${detail})`);
}

// ── hammingDistanceHex — sərbəst funksiya ────────────────────────────────────────────────
check("hamming: eyni hash", hammingDistanceHex("abcd1234abcd1234", "abcd1234abcd1234"), 0);
check("hamming: tək bit fərqi (0 vs 1)", hammingDistanceHex("0000000000000000", "1000000000000000"), 1);
check("hamming: 4 bit fərqi (0 vs f)", hammingDistanceHex("0000000000000000", "f000000000000000"), 4);
check("hamming: tam əks (0 vs ffff...)", hammingDistanceHex("0".repeat(16), "f".repeat(16)), 64);

// ── phashFromGrayscaleMatrix — sərbəst funksiya, sintetik matrislər ─────────────────────
function solidMatrix(n: number, value: number): number[][] {
  return Array.from({ length: n }, () => new Array(n).fill(value));
}

// AĞ FON + BİR NEÇƏ QARA "HƏRF ZOLAĞI" — DİM səhifəsində çap olunmuş mətnin QABA modeli.
// QƏSDƏN hamar qradiyent İŞLƏDİLMİR: hamar siqnalın DCT-si demək olar bütün yüksək-tezlikli
// əmsalları sıfıra yaxın toplayır (median həmin dəstənin ortasına düşür), bu, HƏQİQİ FOTOYA
// AİD OLMAYAN patoloji haldır — kənar/kontrast zəngin mətn şəklində baş VERMİR. `strokes`
// mövqeləri fərqli olanda fərqli hash, EYNİ qalanda (fərqli sıxma/kiçik səs-küy) YAXIN hash
// gözlənilir — pHash-in nəzərdə tutulduğu REAL ssenari budur.
function textLikeMatrix(n: number, strokes: [number, number, number, number][]): number[][] {
  const m = solidMatrix(n, 255);
  for (const [x0, y0, w, h] of strokes) {
    for (let y = y0; y < y0 + h && y < n; y++) {
      for (let x = x0; x < x0 + w && x < n; x++) m[y][x] = 20;
    }
  }
  return m;
}

const STROKES_A: [number, number, number, number][] = [
  [4, 6, 3, 18], [10, 6, 12, 3], [10, 14, 10, 3], [10, 20, 12, 3],
  [20, 6, 3, 18], [24, 10, 6, 12],
];
const STROKES_B: [number, number, number, number][] = [
  [2, 2, 4, 4], [8, 8, 5, 5], [15, 15, 6, 6], [22, 22, 5, 5],
];

check("phash format: 16 hex simvol", phashFromGrayscaleMatrix(textLikeMatrix(32, STROKES_A)).length, 16);
check(
  "phash: tam eyni matris → eyni hash",
  phashFromGrayscaleMatrix(textLikeMatrix(32, STROKES_A)),
  phashFromGrayscaleMatrix(textLikeMatrix(32, STROKES_A))
);

// "Mətn" + 1 piksel toxunulmaz (kağızın üstündəki toz/kompressiya səs-küyünün modeli) —
// Hamming məsafəsi qəbul meyarı daxilində qalmalıdır.
const textA = textLikeMatrix(32, STROKES_A);
const textANoisy = textA.map((row) => [...row]);
textANoisy[16][16] = Math.min(255, textANoisy[16][16] + 8);
const distTinyNoise = hammingDistanceHex(phashFromGrayscaleMatrix(textA), phashFromGrayscaleMatrix(textANoisy));
checkTrue("phash: 1 pikselə kiçik səs-küy → Hamming ≤ 5 (qəbul meyarı)", distTinyNoise <= 5, `distance=${distTinyNoise}`);

// Tamam fərqli "mətn düzülüşü" — nəzərəçarpan Hamming məsafəsi gözlənilir.
const distDifferentLayout = hammingDistanceHex(
  phashFromGrayscaleMatrix(textLikeMatrix(32, STROKES_A)),
  phashFromGrayscaleMatrix(textLikeMatrix(32, STROKES_B))
);
checkTrue("phash: fərqli mətn düzülüşü → böyük Hamming məsafəsi", distDifferentLayout > 5, `distance=${distDifferentLayout}`);

// ── computePHash — real sharp boru xətti, sintetik "mətn" PNG-ləri ──────────────────────
// Ağ vərəq üstündə qara zolaqlar (çap olunmuş DİM səhifəsinin qaba modeli) — yuxarıdaki
// `textLikeMatrix`-in RGB PNG variantı, gerçək `sharp` deşifrə/kiçiltmə boru xəttindən keçir.
async function makeTextLikePng(size: number, strokes: [number, number, number, number][]): Promise<Buffer> {
  const channels = 3;
  const buf = Buffer.alloc(size * size * channels, 255);
  for (const [fx0, fy0, fw, fh] of strokes) {
    const x0 = Math.round(fx0 * size);
    const y0 = Math.round(fy0 * size);
    const w = Math.round(fw * size);
    const h = Math.round(fh * size);
    for (let y = y0; y < y0 + h && y < size; y++) {
      for (let x = x0; x < x0 + w && x < size; x++) {
        const i = (y * size + x) * channels;
        buf[i] = buf[i + 1] = buf[i + 2] = 20;
      }
    }
  }
  return sharp(buf, { raw: { width: size, height: size, channels } }).png().toBuffer();
}

// Nisbi (0..1) koordinatlar — ölçüdən asılı olmayaraq eyni SƏHIFƏ düzülüşü.
const STROKES_A_REL: [number, number, number, number][] = [
  [0.1, 0.15, 0.08, 0.5], [0.25, 0.15, 0.3, 0.08], [0.25, 0.4, 0.25, 0.08], [0.25, 0.6, 0.3, 0.08],
  [0.55, 0.15, 0.08, 0.5], [0.68, 0.3, 0.18, 0.35],
];
const STROKES_B_REL: [number, number, number, number][] = [
  [0.05, 0.05, 0.15, 0.15], [0.3, 0.3, 0.18, 0.18], [0.55, 0.55, 0.2, 0.2], [0.8, 0.8, 0.15, 0.15],
];

const imgA = await makeTextLikePng(200, STROKES_A_REL);
// eyni "səhifə", YALNIZ fərqli JPEG sıxma keyfiyyəti — bayt-səviyyəli TAM fərqli fayl,
// real "fərqli çəkiliş" ssenarisinin yaxın modeli (sha256 keşi bunu TUTA BİLMƏZ, pHash TUTMALIDIR).
const imgB = await sharp(imgA).jpeg({ quality: 60 }).toBuffer();
const imgC = await makeTextLikePng(200, STROKES_B_REL); // tamam fərqli "səhifə"

const hashA = await computePHash(imgA);
const hashB = await computePHash(imgB);
const hashC = await computePHash(imgC);

check("computePHash: çıxış 16 hex simvol", hashA.length, 16);
checkTrue(
  "computePHash: eyni səhifə, fərqli JPEG sıxma (bayt-bayt FƏRQLİ fayl) → Hamming ≤ 5 — qəbul meyarının əsl ssenarisi",
  hammingDistanceHex(hashA, hashB) <= 5,
  `distance=${hammingDistanceHex(hashA, hashB)}`
);
checkTrue(
  "computePHash: tamam fərqli səhifə → nəzərəçarpan Hamming məsafəsi",
  hammingDistanceHex(hashA, hashC) > 5,
  `distance=${hammingDistanceHex(hashA, hashC)}`
);

console.log(fails === 0 ? "\nHAMISI KEÇDİ" : `\n${fails} TEST UĞURSUZ`);
process.exit(fails === 0 ? 0 : 1);
