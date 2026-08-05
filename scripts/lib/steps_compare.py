"""ADR-004: Addım bölgüsünün STRUKTUR yoxlaması. Yalnız obyektiv, mübahisəsiz şərtlər —
bax docs/decisions/ADR-004-step-split-metric.md.

Pedaqoji keyfiyyət ("bu bölgü ilə şagird özü həll edə bilərmi?") burada YOXLANMIR — bu,
insan rəyi ilə ayrıca ölçülür (bax evals/results/human-review-*.jsonl, report.py).
Köhnə Jaccard/başlıq-üst-üstə-düşmə heuristikası ADR-004-ə görə silinib: `expected_step_titles`
bir bölgünü "yeganə doğru" elan edirdi, halbuki bir neçə fərqli bölgü eyni dərəcədə düzgün ola bilər.

`ends_with_verification` üçün açar-söz axtarışı bir HEURİSTİKADIR, semantik/AI mühakimə DEYİL —
sadə mətn daxilində substring axtarışıdır, determinist və şəffafdır.
"""

_VERIFICATION_KEYWORDS = ("yoxla", "yerinə qoy", "təsdiq", "bərabərlik")


def _ends_with_verification(last_step):
    if last_step.get("error_code") == "SUBSTITUTION_SKIPPED":
        return True
    haystack = " ".join(
        [
            last_step.get("title", ""),
            (last_step.get("check") or {}).get("ask", ""),
        ]
    ).lower()
    return any(kw in haystack for kw in _VERIFICATION_KEYWORDS)


def _error_codes_distinct(steps):
    codes = [s.get("error_code") for s in steps]
    if len(codes) <= 1:
        return True
    return len(set(codes)) > 1


def check_structure(steps):
    """Hər şərti ayrıca boolean kimi qaytarır ki hansının sındığı bilinsin.
    `steps` boşdursa (və ya STEP-SCHEMA-nın icazə verdiyi minimumdan azdırsa) əksəriyyəti False olur."""
    result = {
        "count_ok": 2 <= len(steps) <= 6,
        "checks_present": bool(steps) and all(bool(s.get("check")) for s in steps),
        "index_sequential": [s.get("index") for s in steps] == list(range(1, len(steps) + 1)),
        "ends_with_verification": bool(steps) and _ends_with_verification(steps[-1]),
        "error_codes_distinct": _error_codes_distinct(steps),
    }
    result["all_pass"] = all(result.values())
    return result


STRUCTURAL_CONDITIONS = (
    ("count_ok", "Addım sayı 2–6"),
    ("checks_present", "Hər addımda check"),
    ("index_sequential", "Index ardıcıl"),
    ("ends_with_verification", "Son addım yoxlama"),
    ("error_codes_distinct", "error_code-lar fərqli"),
    ("all_pass", "Struktur — hamısı"),
)
