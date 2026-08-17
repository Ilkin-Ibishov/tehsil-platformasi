// ADR-015: model çıxışı qeyri-sabit notasiyada gəlir (ASCII `x^2`, LaTeX `\log_3`, `$...$`) —
// UI onu XAM göstərirdi. `formatMath` LaTeX/ASCII qarışığını unicode riyaziyyata çevirir,
// `design/Həll ekranı v5.dc.html`-in `data-tex` müqaviləsinə uyğun (mənbə saxlanılır, ekranda
// unicode göstərilir). `verify/answer.ts::normalize()`-in ƏKS istiqamətidir — o, hesablamaq üçün
// TƏMİZLƏYİR, bura GÖSTƏRMƏK üçün ÇEVİRİR — frac/sqrt tanınma patternləri oradan idxal olunur ki,
// eyni LaTeX konstruksiyasının iki ayrı siyahısı olmasın.
//
// Yalnız RİYAZİ mətnə (`formatMath`) tam çevirmə: ASCII `-` → minus. İzah/hint/təsdiq üçün
// `formatMathProse` — eyni simvollar, AZ defisinə toxunmur.

import { LATEX_FRAC_RE, LATEX_SQRT_RE } from "./verify/answer";

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "-": "⁻",
};

const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};

function toSuper(digits: string): string {
  return [...digits].map((c) => SUPERSCRIPT[c] ?? c).join("");
}

function toSub(digits: string): string {
  return [...digits].map((c) => SUBSCRIPT[c] ?? c).join("");
}

// HANDOFF (55): saxlanılmış həllərin (n=7) LaTeX əmr sayğacı — sabit cədvəl əvəzinə ÖLÇÜLƏN
// siyahı. `\pi`/`\pm` GÖZLƏNİLİRDİ, amma bu nümunədə YOXDUR — ona görə cədvəl yalnız ölçülənə
// görə böyüyür, təxminlə doldurulmur.
const BLACKBOARD: Record<string, string> = { N: "ℕ", R: "ℝ", Z: "ℤ", Q: "ℚ" };

const GREEK: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  theta: "θ",
  phi: "φ",
  omega: "ω",
  lambda: "λ",
  mu: "μ",
  pi: "π",
};

/** √D vs √(8² + 6²) — tək identifikator/ədəd mötərizəsiz (test toplusu). */
function formatSqrtBody(inner: string): string {
  const compact = inner.trim();
  if (!compact) return "√";
  if (/^[A-Za-z0-9]+$/.test(compact)) return `√${compact}`;
  return `√(${compact})`;
}

export function formatMath(src: string, locale: string = "az"): string {
  return formatMathInternal(src, locale, false);
}

/** İzah/hint/təsdiq mətni — LaTeX simvolları eyni, ASCII `-`/`*` AZ defisinə toxunulmur. */
export function formatMathProse(src: string, locale: string = "az"): string {
  return formatMathInternal(src, locale, true);
}

function formatMathInternal(src: string, locale: string, prose: boolean): string {
  if (!src) return src;
  let text = src;

  // $...$, \left, \right, \<boşluq> — silinir (ADR-015 cədvəli)
  text = text.replace(/\$/g, "");
  text = text.replace(/\\left|\\right/g, "");
  text = text.replace(/\\ /g, " ");
  text = text.replace(/\\quad/g, " ");

  // UX audit tapıntısı (2026-08-14): `\%` (LaTeX-də escape-lənmiş literal `%`) TƏMİZLƏNMİRDİ —
  // ekranda hərfi "1\%" görünürdü. `findUnformattedLatex`-in öz reqex-i (`\\[a-zA-Z]+`) bunu
  // TUTA BİLMİR, çünki `%` hərf deyil — bu sinif bug ölçmədən keçib gedirdi. `\&`/`\_`/`\#`
  // eyni sinifdəndir (LaTeX-in escape-lənmiş xüsusi simvolları) — hamısı burada təmizlənir.
  text = text.replace(/\\([%&_#])/g, "$1");

  // \text{...} → içindəki mətn (mötərizə silinir), \mathbb{N} → ℕ (R/Z/Q oxşar)
  text = text.replace(/\\text\{([^{}]*)\}/g, "$1");
  text = text.replace(/\\mathbb\{([A-Z])\}/g, (_m, l: string) => BLACKBOARD[l] ?? l);
  // \bar{x} → x (HANDOFF 55: "çətindirsə sadəcə x" — combining macron (x̄) monospace şriftdə
  // (JetBrains Mono) etibarsız render olunur, üzərindən xətt YOX, hərf saxlanılır)
  text = text.replace(/\\bar\{([^{}]*)\}/g, "$1");
  // \vec{a} → →a — combining right-arrow-above (a⃗) eyni monospace səbəbindən etibarsızdır;
  // görünən ox prefiksi vektor mənasını saxlayır (`render.unformatted_latex` `\vec` ölçüsü).
  text = text.replace(/\\vec\{([^{}]*)\}/g, "→$1");
  text = text.replace(/\\vec\b\s*([A-Za-z])/g, "→$1");

  // \frac{a}{b} → (a)/(b) — ADR-015 məhdudiyyəti: kəsrlər unicode-da yaxşı çıxmır, KaTeX YOX
  text = text.replace(LATEX_FRAC_RE, "($1)/($2)");

  // \sqrt{D} → √D; \sqrt{8^2 + 6^2} → √(8^2 + 6^2) — mötərizə olmadan `√8² + 6²` kökü yalnız
  // birinci həddə bağlayır (telefon smoke, 2026-08-17). Super/sub sonra içəridə işləyir.
  text = text.replace(LATEX_SQRT_RE, (_m, inner: string) => formatSqrtBody(inner));
  text = text.replace(/\bsqrt\(([^()]*)\)/g, (_m, inner: string) => formatSqrtBody(inner));

  // \log_3 / log_3 → log₃ (verify/answer.ts-in LOG_BASE_RE-i YOX — o, funksiya çağırışı
  // (`log_2(`) tanıyır, bura göstərmə üçün mötərizəsiz forma da (`\log_3`) tanımalıdır)
  text = text.replace(/\\?log_\{?(\d+)\}?/g, (_m, d: string) => `log${toSub(d)}`);

  // Telefon smoke 2026-08-17 (DİM həndəsə): `\angle`, `^\circ`, `\perp`, `\sqrt` xam qalırdı.
  // Eyni sinif (test toplusu simvolları) bir yerdə — HANDOFF 55 "yalnız ölçülən" qaydası
  // bu sətirdən sonra ölçülmüş hesab olunur.
  text = text.replace(/\\sin\b/g, "sin");
  text = text.replace(/\\cos\b/g, "cos");
  text = text.replace(/\\tan\b/g, "tan");
  text = text.replace(/\\cot\b/g, "cot");
  text = text.replace(/\\(alpha|beta|gamma|delta|theta|phi|omega|lambda|mu|pi)\b/g, (_m, n: string) => GREEK[n] ?? n);
  text = text.replace(/\\angle\s*/g, "∠");
  text = text.replace(/\\triangle\s*/g, "△");
  text = text.replace(/\\perp\b/g, "⊥");
  text = text.replace(/\\parallel\b/g, "∥");
  text = text.replace(/\^\s*\\circ\b/g, "°");
  text = text.replace(/\^\{\\circ\}/g, "°");
  text = text.replace(/\\circ\b/g, "°");
  text = text.replace(/\\pm\b/g, "±");
  text = text.replace(/\\neq\b/g, "≠");
  text = text.replace(/\\leq\b|\\le\b/g, "≤");
  text = text.replace(/\\geq\b|\\ge\b/g, "≥");
  text = text.replace(/\\approx\b/g, "≈");
  text = text.replace(/\\infty\b/g, "∞");
  text = text.replace(/\\degree\b/g, "°");

  // x^{10} / x^2 → x¹⁰ / x² — mötərizəli (çox rəqəmli) forma ƏVVƏL, sonra tək rəqəm
  text = text.replace(/\^\{(-?\d+)\}/g, (_m, d: string) => toSuper(d));
  text = text.replace(/\^(-?\d)/g, (_m, d: string) => toSuper(d));

  // x_1 / x_{12} → x₁ / x₁₂ — HANDOFF (55): sxemin öz nümunəsi `x_1 = 3,\ x_2 = 2` formatındadır,
  // yəni bu, ƏN ÇOX rast gəlinən forma idi, `toSub` əvvəllər YALNIZ log-a bağlı idi
  text = text.replace(/_\{(\d+)\}/g, (_m, d: string) => toSub(d));
  text = text.replace(/_(\d)/g, (_m, d: string) => toSub(d));

  // \cdot, \times, * → · / × (vurma işarələri). Prose-də `*` AZ mətnində nadir, amma
  // defis kimi `-` korlanır — vurmanı da prose-də yalnız LaTeX əmrlərindən götür.
  text = text.replace(/\\cdot/g, "·");
  text = text.replace(/\\times/g, "×");
  if (!prose) text = text.replace(/\*/g, "·");

  // \in, \implies, \dots → ∈, ⇒, …
  text = text.replace(/\\in\b/g, "∈");
  text = text.replace(/\\implies\b/g, "⇒");
  text = text.replace(/\\dots/g, "…");

  // ASCII minus → riyazi minus (ƏN SONDA — yuxarıdakı `-?\d` exponent tutuşları öz orijinal
  // defisinə görə işləməlidir, bu çevrilmədən ƏVVƏL). Prose-də AZ defis/tire saxlanılır.
  if (!prose) text = text.replace(/-/g, "−");

  // HANDOFF (55): vergül HƏM onluq ayırıcı, HƏM siyahı ayırıcısıdır — "x₁ = 3.5, x₂ = 2.5"
  // → "3,5, 2,5" oxunmur. Onluq nöqtə VARSA və mövcud siyahı vergülü DƏ varsa (məs. sxemin
  // nümunə formatı: "x_1 = 3.5, x_2 = 2.5"), əvvəlcə siyahı vergülünü ";"-ə çevir, SONRA
  // onluq nöqtəni vergülə. Onluq yoxdursa (tam ədədlər, "x_1 = 3, x_2 = 2") vergül toxunulmaz —
  // bu halda birmənalıdır.
  if (locale !== "en") {
    const hasDecimalPoint = /\d\.\d/.test(text);
    if (hasDecimalPoint && text.includes(",")) {
      text = text.replace(/,/g, ";");
    }
    text = text.replace(/(\d+)\.(\d+)/g, "$1,$2");
  }

  // \quad boşluqla əvəzlənəndə ətrafdakı hərfi boşluqlarla birləşib ikiqat düşə bilir
  // (`a \quad b` → `a   b`) — sıxılır.
  text = text.replace(/[ \t]+/g, " ");

  return text.trim();
}

// HANDOFF (55): sabit cədvəl modelin lüğətindən HƏMİŞƏ geri qalacaq — "bir də tapdıq, bir də
// əlavə etdik" dövrəsi. Formatlanmış çıxışda hələ tanınmayan `\əmr` qalıbsa, çağıran
// `render.unformatted_latex` atmalıdır (mətn YENƏ göstərilir, pozulmur — yalnız ÖLÇÜRÜK).
// `render.latex_missing` ilə eyni prinsip: səssiz uğursuzluğu ölçülən hadisəyə çevir.
const UNFORMATTED_LATEX_RE = /\\[a-zA-Z]+/;

export function findUnformattedLatex(formatted: string): string | null {
  const m = formatted.match(UNFORMATTED_LATEX_RE);
  return m ? m[0] : null;
}
