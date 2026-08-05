"""Addım bölgüsü müqayisəsi: sayı ±1 və başlıqların semantik uyğunluğu (README-dəki metrika).

Semantik uyğunluq embedding tələb edir (Faza 0-da yoxdur) — burada normallaşdırılmış
söz-üst-üstə-düşmə (Jaccard) həddi ilə təxmini ölçülür. Bu bir heuristikdir, dəqiq
semantik ölçü deyil; nəticə JSON-da metod adı ilə qeyd olunur ki, gələcəkdə embedding ilə
əvəz edilə bilsin.
"""

import re

_STOPWORDS = {"və", "ilə", "bir", "üçün", "nə", "bu"}


def _tokenize(title):
    words = re.findall(r"\w+", title.lower(), flags=re.UNICODE)
    return {w for w in words if w not in _STOPWORDS}


def _title_aligned(a, b, threshold=0.3):
    ta, tb = _tokenize(a), _tokenize(b)
    if not ta or not tb:
        return False
    jaccard = len(ta & tb) / len(ta | tb)
    return jaccard >= threshold


def step_split_match(actual_steps, expected_step_count, expected_step_titles):
    """True/False/None qaytarır. None = golden-set-də expected_step_count yoxdur."""
    if expected_step_count is None:
        return None

    count_ok = abs(len(actual_steps) - expected_step_count) <= 1
    if not expected_step_titles:
        return count_ok

    actual_titles = [s.get("title", "") for s in actual_steps]
    pairs = min(len(actual_titles), len(expected_step_titles))
    if pairs == 0:
        return False
    aligned = sum(
        1 for i in range(pairs) if _title_aligned(actual_titles[i], expected_step_titles[i])
    )
    aligned_ratio = aligned / len(expected_step_titles)
    return count_ok and aligned_ratio >= 0.5
