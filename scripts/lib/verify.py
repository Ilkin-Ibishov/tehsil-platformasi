"""final_answer.values-in sympy ilə maşınla yoxlanışı. String müqayisəsi YOX.

canonical bir tənlik (formula) və ya daxilində $...$ düsturlar olan mətn (word_problem)
ola bilər. Hər iki halda tənlik(lər) çıxarılır, dəyərlər yerinə qoyulub yoxlanılır.
"""

import re

import sympy
from sympy.parsing.sympy_parser import (
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

_TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application,)

_LATEX_SEGMENT_RE = re.compile(r"\$(.+?)\$")


def _normalize(raw):
    return (
        raw.replace("−", "-")  # unicode minus -> ascii
        .replace("\\ ", " ")
        .replace("^", "**")
        .strip()
    )


def _extract_equations(canonical):
    """canonical-dan '=' işarəli ifadə(lər) çıxarır. Tapılmazsa boş siyahı qaytarır."""
    segments = _LATEX_SEGMENT_RE.findall(canonical)
    candidates = segments if segments else [canonical]
    equations = [c for c in candidates if "=" in c]
    return equations


def _parse_equation(eq_str):
    lhs_raw, _, rhs_raw = eq_str.partition("=")
    lhs = parse_expr(_normalize(lhs_raw), transformations=_TRANSFORMATIONS)
    rhs = parse_expr(_normalize(rhs_raw), transformations=_TRANSFORMATIONS)
    return lhs, rhs


def _value_satisfies(value_str, lhs, rhs, symbol):
    try:
        value = parse_expr(_normalize(value_str), transformations=_TRANSFORMATIONS)
    except (sympy.SympifyError, SyntaxError):
        return False
    residual = (lhs - rhs).subs(symbol, value)
    residual = sympy.simplify(residual)
    if residual.is_number:
        return abs(complex(residual)) < 1e-6
    return residual == 0


def verify_final_answer(canonical, values):
    """True/False/None qaytarır. None = canonical-dan yoxlanıla bilən tənlik çıxarıla bilmədi."""
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
