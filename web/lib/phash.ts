// Perceptual hash (pHash) — ClickUp 86eymfgbv. server-only (Node `sharp`).
//
// ═══ NİYƏ ═══
// Dəqiq hash (sha256) yalnız EYNİ BAYT faylı tanıyır. Şagird eyni məsələni bir az fərqli
// bucaqdan/işıqda çəksə — bayt-səviyyəli fayl tamamilə fərqlidir, keş boşa çıxır, yeni LLM
// çağırışı gedir. pHash şəklin VİZUAL MƏZMUNUNU kodlaşdırır — kiçik fərqlər (bucaq, sıxma,
// işıq) hash-i kiçik Hamming məsafəsi qədər dəyişir, sha256 kimi TAM fərqli nəticə vermir.
//
// ═══ ALQORİTM ═══
// DCT-əsaslı pHash (Python `imagehash.phash()` ilə EYNİ struktur, bax tapşırığın adı):
//   1. 32×32-ə kiçilt (fit:"fill" — PIL-in `.resize()`-i kimi, en/uzun nisbəti SAXLANMIR,
//      çünki hash MÜQAYİSƏ üçündür, göstərmək üçün YOX).
//   2. Boz-şkalaya çevir (sharp `.greyscale()`).
//   3. 2D DCT-II (ayrıla bilən — əvvəl sətirlərə, sonra sütunlara 1D DCT).
//   4. Yuxarı-sol 8×8 alçaq-tezlikli blok (DC daxil, `hash_size=8`, `highfreq_factor=4` →
//      32 = 8×4, Python defoltu ilə EYNİ).
//   5. Bu 64 dəyərin medianı; hər dəyər median-dan BÖYÜKDÜRSƏ bit=1.
//   6. 64 bit → 16 hex simvol.
//
// DCT-in normalizasiya sabiti Python-un `scipy.fftpack.dct`-i ilə HƏRFİ EYNİ DEYİL — bu,
// ƏHƏMİYYƏTSİZDİR: hash YALNIZ bu kod BAZASININ öz sxemi daxilində müqayisə olunur (heç bir
// xarici sistemlə bit-bit eyniləşdirmə tələb olunmur), median-dan böyük/kiçik SIRASI
// normalizasiya sabitindən ASILI DEYİL (müsbət skalyar vurma monoton çevirmədir).
//
// BİLİNƏN MƏHDUDİYYƏT (selftest-də tapıldı): HAMAR QRADİYENT/BOŞ şəkillərdə median-a çox
// yaxın DCT əmsalları (yüksək tezliklərin hamısı sıfıra yaxın) 1-2 piksel səs-küydən BELƏ
// çox bit çevirə bilir — bu, pHash alqoritminin ÖZÜNÜN tanınmış zəif nöqtəsidir (energy
// compaction yoxdur, median "iti kənarda" olur), kodda BUQ DEYİL. Çap olunmuş mətn/düstur
// şəkillərində (bu məhsulun YEGANƏ real girişi) bu hal PRAKTİKİ OLARAQ baş VERMİR — kənar/
// kontrast zəngin girişdə DCT enerjisi bir neçə aydın əmsalda cəmlənir. Selftest bunu
// mətn-bənzər (ağ fon + qara zolaqlar) fixture-larla ölçür, hamar qradiyentlə YOX.

import sharp from "sharp";

const HASH_SIZE = 8; // 8×8 alçaq-tezlikli blok → 64 bit
const IMG_SIZE = HASH_SIZE * 4; // 32 — Python imagehash-ın "highfreq_factor" defoltu

// 1D DCT-II, sadə O(N²) — N=32-də bu, sətir/sütun başına 1024 vurma, cəmi ~65k, <1ms.
// FFT-əsaslı sürətli DCT lazım deyil (görüntü elə kiçikdir ki, sadəlik performansı üstələyir).
function dct1d(vec: number[]): number[] {
  const N = vec.length;
  const out = new Array(N).fill(0);
  for (let k = 0; k < N; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += vec[n] * Math.cos((Math.PI / N) * (n + 0.5) * k);
    }
    out[k] = sum;
  }
  return out;
}

function packBitsToHex(bits: boolean[]): string {
  if (bits.length % 4 !== 0) throw new Error("bit sayı 4-ün qatı olmalıdır");
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    let nibble = 0;
    for (let j = 0; j < 4; j++) nibble = (nibble << 1) | (bits[i + j] ? 1 : 0);
    hex += nibble.toString(16);
  }
  return hex;
}

// Sərbəst funksiya — şəkil deşifrəsindən AYRI, test asanlığı üçün (sintetik matrislərlə
// selftest, `sharp`/JPEG-ə ehtiyac olmadan).
export function phashFromGrayscaleMatrix(pixels: number[][]): string {
  const N = pixels.length;
  if (N === 0 || pixels.some((row) => row.length !== N)) {
    throw new Error("kvadrat matris gözlənilir");
  }

  // Ayrıla bilən 2D DCT: əvvəl hər SƏTRƏ 1D DCT, sonra nəticənin hər SÜTUNUNA 1D DCT.
  const rowDct = pixels.map((row) => dct1d(row));
  const full: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let x = 0; x < N; x++) {
    const col = rowDct.map((row) => row[x]);
    const colDct = dct1d(col);
    for (let y = 0; y < N; y++) full[y][x] = colDct[y];
  }

  // Yuxarı-sol HASH_SIZE×HASH_SIZE — ən alçaq tezliklər, DC (full[0][0]) DAXİL.
  const block: number[] = [];
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) block.push(full[y][x]);
  }

  const sorted = [...block].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return packBitsToHex(block.map((v) => v > median));
}

// Şəkil baytlarından pHash. Deşifrə edilə bilməyən/korlanmış şəkillərdə `sharp` özü xəta
// atır — çağıran (transcribe.ts/route.ts) bunu tuta bilər, pHash best-effort-dur (sha256
// yolu HEÇ VAXT ondan asılı DEYİL).
export async function computePHash(imageBytes: Buffer): Promise<string> {
  const { data, info } = await sharp(imageBytes)
    .resize(IMG_SIZE, IMG_SIZE, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 1 || data.length !== IMG_SIZE * IMG_SIZE) {
    throw new Error(`gözlənilməz boz-şkala çıxışı: channels=${info.channels}, bytes=${data.length}`);
  }

  const pixels: number[][] = [];
  for (let y = 0; y < IMG_SIZE; y++) {
    const row: number[] = [];
    for (let x = 0; x < IMG_SIZE; x++) row.push(data[y * IMG_SIZE + x]);
    pixels.push(row);
  }
  return phashFromGrayscaleMatrix(pixels);
}

const POPCOUNT_NIBBLE = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

// İki 16-hex-simvollu (64 bit) hash arasında Hamming məsafəsi. Tətbiq tərəfində istifadə
// olunmur (axtarış DB-də `bit_count`-la olur, bax `0054`), YALNIZ selftest üçün ixrac olunur —
// SQL-in özünün düz işlədiyini TS tərəfindən müstəqil doğrulamaq üçün.
export function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) throw new Error("hash uzunluqları fərqlidir");
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += POPCOUNT_NIBBLE[xor];
  }
  return dist;
}
