"""final_answer.values-in maşınla yoxlanışı. String müqayisəsi YOX. 86eyhqggz-ə görə üç qat:

1. **Birbaşa müqayisə** (əsas, `golden_values` verilibsə) — golden set-dəki insan cavabını
   (`final_answer_values`) modelin öz `final_answer.values`-i ilə simvolik/normallaşdırılmış
   müqayisə edir. Golden bir neçə ekvivalent forma saxlaya bilər (məs. `["3/10","0.3","0,3"]`) —
   modelin dəyəri onlardan HƏR HANSI biri ilə üst-üstə düşürsə doğrudur. Real golden set-in
   çoxu (ifadə qiyməti, triqonometrik ümumi həll, ehtimal, parametr məsələsi, törəmə kəmiyyət)
   yalnız bu qatla yoxlanıla bilir — tənlik-substitusiya (2-ci qat) onları əhatə etmir.
2. **sympy çarpaz yoxlama** (müstəqil, mümkün olduqda) — `canonical`-ı tənlik kimi parse edib
   modelin dəyərlərini yerinə qoyur (köhnə məntiq, dəyişməyib). 1-ci qatla ZİDDİYYƏT taparsa
   `conflict=True` qaytarır — bu, GOLDEN SET-in özündəki (mənim) səhvi tutan mexanizmdir,
   ziddiyyəti görüb sussa faydasızdır, ona görə silinmir.
3. Heç biri mümkün deyilsə → `(None, False)`.

`golden_values` verilməzsə (məs. selftest mock halları, `expected_choice`-sız fixture-lar)
davranış köhnə ilə eynidir — yalnız 2-ci qat işləyir.
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


def _normalize(raw):
    return (
        raw.replace("−", "-")  # unicode minus -> ascii
        .replace(",", ".")  # ondalık vergül -> nöqtə (2-ci qatda golden dəyərlərdə görünür)
        .replace("\\ ", " ")
        .replace("^", "**")
        .strip()
    )


def _parse_value(raw):
    """Sətri sympy ifadəsinə çevirir. Parse alınmırsa None (fallback: normallaşdırılmış sətir)."""
    try:
        return parse_expr(_normalize(raw), transformations=_TRANSFORMATIONS, local_dict=_LOCAL_DICT)
    except (sympy.SympifyError, SyntaxError, TypeError, AttributeError):
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


def direct_compare(golden_values, model_values):
    """1-ci qat. True/False/None qaytarır. None = golden_values verilməyib (bu qat tətbiq olunmur)."""
    if not golden_values:
        return None
    if not model_values:
        return False
    for mv in model_values:
        if not any(_values_equivalent(mv, gv) for gv in golden_values):
            return False
    return True


def _extract_equations(canonical):
    """canonical-dan '=' işarəli ifadə(lər) çıxarır. Tapılmazsa boş siyahı qaytarır."""
    segments = _LATEX_SEGMENT_RE.findall(canonical)
    candidates = segments if segments else [canonical]
    equations = [c for c in candidates if "=" in c]
    return equations


def _parse_equation(eq_str):
    lhs_raw, _, rhs_raw = eq_str.partition("=")
    lhs = parse_expr(_normalize(lhs_raw), transformations=_TRANSFORMATIONS, local_dict=_LOCAL_DICT)
    rhs = parse_expr(_normalize(rhs_raw), transformations=_TRANSFORMATIONS, local_dict=_LOCAL_DICT)
    return lhs, rhs


def _value_satisfies(value_str, lhs, rhs, symbol):
    try:
        value = parse_expr(_normalize(value_str), transformations=_TRANSFORMATIONS, local_dict=_LOCAL_DICT)
    except (sympy.SympifyError, SyntaxError):
        return False
    residual = (lhs - rhs).subs(symbol, value)
    residual = sympy.simplify(residual)
    if residual.is_number:
        return abs(complex(residual)) < 1e-6
    return residual == 0


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
        try:
            lhs, rhs = _parse_equation(eq_str)
        except (sympy.SympifyError, SyntaxError, TypeError):
            continue
        free = (lhs - rhs).free_symbols
        if len(free) != 1:
            continue
        parsed.append((lhs, rhs, next(iter(free))))

    if not parsed:
        return None

    for value_str in values:
        if not any(_value_satisfies(value_str, lhs, rhs, symbol) for lhs, rhs, symbol in parsed):
            return False
    return True


def verify_final_answer(canonical, values, golden_values=None):
    """(verified, conflict) qaytarır.
    verified: True/False/None — 1-ci qat varsa üstünlük onundur, yoxdursa 2-ci qata düşür.
    conflict: True — hər iki qat müstəqil nəticə verib VƏ ziddiyyətlidir (golden set səhvi ola bilər)."""
    direct = direct_compare(golden_values, values)
    cross = equation_cross_check(canonical, values)

    conflict = direct is not None and cross is not None and direct != cross

    if direct is not None:
        verified = direct
    else:
        verified = cross

    return verified, conflict
