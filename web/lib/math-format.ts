// ADR-015: model çıxışı qeyri-sabit notasiyada gəlir (ASCII `x^2`, LaTeX `\log_3`, `$...$`) —
// UI onu XAM göstərirdi. `formatMath` LaTeX/ASCII qarışığını unicode riyaziyyata çevirir,
// `design/Həll ekranı v5.dc.html`-in `data-tex` müqaviləsinə uyğun (mənbə saxlanılır, ekranda
// unicode göstərilir). `verify/answer.ts::normalize()`-in ƏKS istiqamətidir — o, hesablamaq üçün
// TƏMİZLƏYİR, bura GÖSTƏRMƏK üçün ÇEVİRİR — frac/sqrt tanınma patternləri oradan idxal olunur ki,
// eyni LaTeX konstruksiyasının iki ayrı siyahısı olmasın.
//
// Yalnız RİYAZİ mətnə (final_answer.latex, step.latex) tətbiq et — `explanation`/`hint`/`why`
// AZ dilində sərbəst mətndir, minus-işarəsi çevrilməsi orada defis/tire kimi işlədilən simvolları
// korlayar.

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

export function formatMath(src: string, locale: string = "az"): string {
  if (!src) return src;
  let text = src;

  // $...$, \left, \right, \<boşluq> — silinir (ADR-015 cədvəli)
  text = text.replace(/\$/g, "");
  text = text.replace(/\\left|\\right/g, "");
  text = text.replace(/\\ /g, " ");

  // \frac{a}{b} → (a)/(b) — ADR-015 məhdudiyyəti: kəsrlər unicode-da yaxşı çıxmır, KaTeX YOX
  text = text.replace(LATEX_FRAC_RE, "($1)/($2)");

  // \sqrt{D} / sqrt(D) → √D
  text = text.replace(LATEX_SQRT_RE, "√$1");
  text = text.replace(/\bsqrt\(([^()]*)\)/g, "√$1");

  // \log_3 / log_3 → log₃ (verify/answer.ts-in LOG_BASE_RE-i YOX — o, funksiya çağırışı
  // (`log_2(`) tanıyır, bura göstərmə üçün mötərizəsiz forma da (`\log_3`) tanımalıdır)
  text = text.replace(/\\?log_\{?(\d+)\}?/g, (_m, d: string) => `log${toSub(d)}`);

  // x^{10} / x^2 → x¹⁰ / x² — mötərizəli (çox rəqəmli) forma ƏVVƏL, sonra tək rəqəm
  text = text.replace(/\^\{(-?\d+)\}/g, (_m, d: string) => toSuper(d));
  text = text.replace(/\^(-?\d)/g, (_m, d: string) => toSuper(d));

  // \cdot, * → · (vurma işarəsi)
  text = text.replace(/\\cdot/g, "·");
  text = text.replace(/\*/g, "·");

  // ASCII minus → riyazi minus (ƏN SONDA — yuxarıdakı `-?\d` exponent tutuşları öz orijinal
  // defisinə görə işləməlidir, bu çevrilmədən ƏVVƏL)
  text = text.replace(/-/g, "−");

  // onluq ayırıcı: 3.5 → 3,5 (az/ru/tr) — `en` saxlanılır
  if (locale !== "en") {
    text = text.replace(/(\d+)\.(\d+)/g, "$1,$2");
  }

  return text.trim();
}
