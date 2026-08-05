"""final_answer.values-in maşınla yoxlanışı. String müqayisəsi YOX. 86eyhqggz-ə görə üç qat,
ADR-009-a görə düzəldilib:

1. **Birbaşa müqayisə** (əsas, `golden_values` verilibsə) — golden set-dəki insan cavabını
   (`final_answer_values`) modelin öz `final_answer.values`-i ilə simvolik/normallaşdırılmış
   müqayisə edir. İki rejim (`answer_values_are`, golden set-də):
     - `"alternate_forms"` (defolt) — HƏR HANSI golden dəyəri HƏR HANSI model dəyəri ilə
       üst-üstə düşsə doğrudur (kəsişmə). Real golden set-in çoxu (ifadə qiyməti, triqonometrik
       ümumi həll, ehtimal, parametr məsələsi, törəmə kəmiyyət) yalnız bu qatla yoxlanıla bilir.
     - `"components"` — HƏR golden komponentinin (məs. iki kök) modelin dəyərləri arasında
       ekvivalenti olmalıdır (tam əhatə, alt-çoxluq YOX — ADR-009-dan əvvəl bu, modelin HƏR
       dəyərinin golden-də olmasını tələb edirdi, ona görə variant hərfi ["B"] əlavə edən model
       bütün müqayisəni sındırırdı).
   Modelin `values`-ində qalan tək-hərfli etiketlər (`"B"`, `"b"` — köhnə format, geriyə uyğunluq)
   müqayisədən ƏVVƏL süzülür.
2. **sympy çarpaz yoxlama** (müstəqil, `answer_is_root` golden-də `false` deyilsə) — `canonical`-ı
   tənlik kimi parse edib modelin dəyərlərini yerinə qoyur. `answer_is_root=false` olanda
   (cavab tənliyin kökü DEYİL — məs. kontekstual tənlikdən törəmə ehtimal) bu qat keçilir, əks
   halda yanlış `conflict` yaranır (ADR-009, `c09`). 1-ci qatla ZİDDİYYƏT taparsa `conflict=True`
   qaytarır — GOLDEN SET-in özündəki səhvi tutan mexanizmdir, silinmir.
3. Heç biri mümkün deyilsə → `(None, False)`.

`golden_values` verilməzsə (məs. selftest mock halları) davranış köhnə ilə eynidir — yalnız 2-ci qat işləyir.
"""

import re

import sympy
from sympy.parsing.sympy_parser import (
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

_TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application,)
_LOCAL_DICT = {
    "log2": lambda a: sympy.log(a, 2),
    "ln": sympy.log,
}

_LATEX_SEGMENT_RE = re.compile(r"\$(.+?)\$")
_LATEX_FRAC_RE = re.compile(r"\\frac\{([^{}]*)\}\{([^{}]*)\}")
_LATEX_SQRT_RE = re.compile(r"\\sqrt\{([^{}]*)\}")
_LETTER_LABEL_RE = re.compile(r"^[A-Za-z]$")


def _normalize(raw):
    """ADR-009 D: LaTeX komandaları riyazi mətnə çevrilir ki `"\\pi n"` ilə `"pi*n"` eyni
    ifadə kimi parse olunsun. `°` (dərəcə işarəsi) tamamilə silinir — vahid məsələsi
    `answer_is_root`/golden set-in özü ilə həll olunur, burada YOX."""
    text = raw.strip()
    text = text.replace("−", "-")  # unicode minus -> ascii
    text = _LATEX_FRAC_RE.sub(r"(\1)/(\2)", text)
    text = _LATEX_SQRT_RE.sub(r"sqrt(\1)", text)
    text = text.replace("\\cdot", "*")
    text = text.replace("\\pi", "pi")
    text = text.replace("°", "")
    text = text.replace(",", ".")  # ondalık vergül -> nöqtə (golden dəyərlərdə görünür)
    text = text.replace("\\ ", " ")
    text = text.replace("^", "**")
    return text.strip()


def _filter_letter_labels(values):
    """ADR-009 C: modelin `values`-ə qarışdırdığı tək-hərfli variant etiketlərini (`"B"`, `"b"`)
    süzür — geriyə uyğunluq, `final_answer.choice` sxemdə ayrıca sahə olsa da köhnə formatlı
    çıxışlar hələ görünə bilər. Tək RƏQƏMLƏR (məs. "0") süzülmür — onlar əsl cavab ola bilər."""
    return [v for v in values if not _LETTER_LABEL_RE.match(v.strip())]


def _parse_value(raw):
    """Sətri sympy ifadəsinə çevirir. Parse alınmırsa None (fallback: normallaşdırılmış sətir)."""
    try:
        return parse_expr(_normalize(raw), transformations=_TRANSFORMATIONS, local_dict=_LOCAL_DICT)
    except Exception:
        # QƏSDƏN geniş: model çıxışı etibarsız girişdir (LaTeX \\frac, $...$, unicode).
        # tokenize.TokenError SyntaxError-un alt sinfi DEYİL — dar except onu buraxır və
        # bir item bütün run-ı öldürür (2026-08-06 hadisəsi, HANDOFF 16).
        return None


def _values_equivalent(a_raw, b_raw):
    """Əvvəlcə simvolik bərabərlik, alınmırsa normallaşdırılmış sətir bərabərliyi (vahid/simvol
    daşıyan sətirlər — məs. "30" dərəcə — üçün sympy-nin özü ekvivalentlik təyin edə bilməz,
    golden set bunun üçün onsuz da alternativ formanı ayrıca saxlayır)."""
    a_expr = _parse_value(a_raw)
    b_expr = _parse_value(b_raw)
    if a_expr is not None and b_expr is not None:
        try:
            diff = sympy.simplify(a_expr - b_expr)
        except (TypeError, ValueError):
            diff = None
        if diff is not None:
            if diff == 0:
                return True
            if diff.is_number:
                try:
                    return abs(complex(diff)) < 1e-6
                except TypeError:
                    pass
    return _normalize(a_raw) == _normalize(b_raw)


def direct_compare(golden_values, model_values, answer_values_are="alternate_forms"):
    """1-ci qat (ADR-009). True/False/None qaytarır. None = golden_values verilməyib.

    `answer_values_are`:
      "alternate_forms" (defolt) — HƏR HANSI golden dəyəri HƏR HANSI (süzülmüş) model dəyəri
        ilə üst-üstə düşsə doğrudur (kəsişmə).
      "components" — HƏR golden komponentinin model dəyərləri arasında ekvivalenti olmalıdır
        (tam əhatə — modelin əlavə/yarımçıq cavab verməsi qəbul edilmir).
    """
    if not golden_values:
        return None
    filtered = _filter_letter_labels(model_values or [])
    if not filtered:
        return False
    if answer_values_are == "components":
        return all(any(_values_equivalent(gv, mv) for mv in filtered) for gv in golden_values)
    return any(_values_equivalent(gv, mv) for gv in golden_values for mv in filtered)


def _extract_equations(canonical):
    """canonical-dan '=' işarəli ifadə(lər) çıxarır. Tapılmazsa boş siyahı qaytarır."""
    segments = _LATEX_SEGMENT_RE.findall(canonical)
    candidates = segments if segments else [canonical]
    equations = [c for c in candidates if "=" in c]
    return equations


def _parse_equation(eq_str):
    """(lhs, rhs) qaytarır; parse alınmasa (None, None) — İSTİSNA ATMIR."""
    lhs_raw, _, rhs_raw = eq_str.partition("=")
    try:
        lhs = parse_expr(_normalize(lhs_raw), transformations=_TRANSFORMATIONS, local_dict=_LOCAL_DICT)
        rhs = parse_expr(_normalize(rhs_raw), transformations=_TRANSFORMATIONS, local_dict=_LOCAL_DICT)
    except Exception:
        return None, None
    return lhs, rhs


def _value_satisfies(value_str, lhs, rhs, symbol):
    try:
        value = parse_expr(_normalize(value_str), transformations=_TRANSFORMATIONS, local_dict=_LOCAL_DICT)
    except Exception:
        return False
    try:
        residual = sympy.simplify((lhs - rhs).subs(symbol, value))
        if residual.is_number:
            return abs(complex(residual)) < 1e-6
        return residual == 0
    except Exception:
        return False


def equation_cross_check(canonical, values):
    """2-ci qat (köhnə məntiq, dəyişməyib). True/False/None qaytarır.
    None = canonical-dan yoxlanıla bilən tənlik çıxarıla bilmədi."""
    if not values:
        return False

    equations = _extract_equations(canonical)
    if not equations:
        return None

    parsed = []
    for eq_str in equations:
        lhs, rhs = _parse_equation(eq_str)
        if lhs is None:
            continue
        try:
            free = (lhs - rhs).free_symbols
        except Exception:
            continue
        if len(free) != 1:
            continue
        parsed.append((lhs, rhs, next(iter(free))))

    if not parsed:
        return None

    for value_str in values:
        if not any(_value_satisfies(value_str, lhs, rhs, symbol) for lhs, rhs, symbol in parsed):
            return False
    return True


def verify_final_answer(canonical, values, golden_values=None, answer_values_are="alternate_forms", answer_is_root=True):
    """(verified, conflict) qaytarır.
    verified: True/False/None — 1-ci qat varsa üstünlük onundur, yoxdursa 2-ci qata düşür.
    conflict: True — hər iki qat müstəqil nəticə verib VƏ ziddiyyətlidir (golden set səhvi ola bilər).
    `answer_is_root=False` olanda 2-ci qat (sympy) keçilir — cavab tənliyin kökü deyil (ADR-009)."""
    direct = direct_compare(golden_values, values, answer_values_are=answer_values_are)
    cross = equation_cross_check(canonical, values) if answer_is_root else None

    conflict = direct is not None and cross is not None and direct != cross

    if direct is not None:
        verified = direct
    else:
        verified = cross

    return verified, conflict
