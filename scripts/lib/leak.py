"""ADR-005: Cavab sızması = şagirdin HƏLƏ SORUŞULMADIĞI dəyəri açıqlamaq.

V dəyəri i-ci addımda sızmış sayılır ƏGƏR:
  1. V steps[i].explanation-da görünürsə, VƏ
  2. V heç bir ƏVVƏLKİ addımın (j < i) check.accept siyahısında yoxdursa

j < i qəsdəndir (j <= i yox): addımın öz sualının cavabını öz izahında açıqlaması sızmadır,
amma şagirdin ARTIQ ÖZÜ yazdığı (əvvəlki addımda accept edilmiş) dəyərə sonrakı addımda
istinad etmək sızma deyil — bax ADR-004-ün tələb etdiyi məcburi yoxlama addımı.

_leaked_in_text-dəki rəqəm/şəkilçi ayırd etməsi (Azərbaycan dilində '3-ə' vs riyazi 'b^2-4ac')
dəyişməz saxlanılır — yalnız HANSI addımlarda axtarılacağı dəyişir.

HANDOFF 106 (2026-08-15) — real 99-sualıq DIM dəstində 9 "sızma" ƏL İLƏ izlənildi (Ilkin-in
tələbi: "ehtimal ilə niyə düşünürsən?"). 4-ü DƏYƏRİN ÖZÜ ilə HEÇ ƏLAQƏSİZ təsadüfi rəqəm
toqquşması idi (bax aşağıdakı 4 istisna) — bunlar ADR-005-in ÖZ tərifinə görə DƏ sızma
DEYİL (sızma = "V açıqlanır", təsadüfi eyni rəqəm YOX). Qalan 5-i (o cümlədən son-addım
yoxlamasının öz nəticəsini restate etməsi) ADR-005-in qəsdən j<i qaydasına görə DOĞRU sızma
sayılır — TOXUNULMADI (bax ADR-005 §"Niyə j<i, j<=i yox").
"""

import re

# 1) Sıra sayı şəkilçisi: "2-ci", "3-cü" — DƏYƏR yox, sıra göstərir (q026 real tapıntı).
# QƏSDƏN DAR SİYAHI (yalnız ölçülən sıra şəkilçiləri) — geniş "-hər hansı hərf" forması
# "3-ə bərabər" (bərabərlik şəkilçisi, HƏQİQİ sızma nümunəsi, `leaked_explanation` selftest
# halı) İLƏ TOQQUŞDU, ilk versiyada bu reqressiyanı YARATMIŞDI.
_ORDINAL_SUFFIX_RE = re.compile(
    r"^-(ci|cı|cü|cu|nci|ncı|ncü|ncu|inci|ıncı|uncu|üncü)\b", re.IGNORECASE | re.UNICODE
)
# 2) Domen/interval mötərizəsi: "[-90°, 90°]" — funksiyanın TƏRİFİ, konkret cavab yox (q031).
_BRACKET_SPAN_RE = re.compile(r"\[[^\[\]]*\]")
# 3) Müqayisə operatorundan DƏRHAL sonra: "8 > 1" — şərt/qayda, cavab yox (q052).
_COMPARISON_BEFORE_RE = re.compile(r"[<>≤≥]\s*$")


def _in_bracket_span(text, start, end):
    for m in _BRACKET_SPAN_RE.finditer(text):
        if m.start() <= start and end <= m.end():
            return True
    return False


def _leaked_in_text(value, text):
    text = text.replace("−", "-")
    value = value.replace("−", "-").strip()
    if not value:
        return False
    pattern = re.compile(
        r"(?<![\w.])" + re.escape(value) + r"(?!\w)(?!-\d)(?!\.\d)",
        flags=re.UNICODE,
    )
    for m in pattern.finditer(text):
        start, end = m.start(), m.end()
        if _ORDINAL_SUFFIX_RE.match(text[end : end + 3]):
            continue
        if _in_bracket_span(text, start, end):
            continue
        if _COMPARISON_BEFORE_RE.search(text[max(0, start - 5) : start]):
            continue
        # 4) Düstura bilavasitə bitişik ("1/(2√x)" kəsr məxrəci) — ümumi düstur xatırlatması,
        #    konkret cavab yox (q055).
        if end < len(text) and text[end] == "√":
            continue
        return True
    return False


def _normalize(v):
    return v.replace("−", "-").strip()


# Fizika: "20 m/s" / "16\\ \\mathrm{m}" ilə "20" eyni sızmadır. Yalnız ədəd+vahid
# quyruğu soyulur — "2\\sqrt{2}E" kimi ifadələr ədəd+SI sayılmır.
_LATEX_MATHRM_RE = re.compile(r"\\mathrm\{([^}]+)\}")
_UNIT_TAIL_RE = re.compile(
    r"^([+-]?\d+(?:[.,]\d+)?)\s+"
    r"([a-zA-ZμµΩω°][a-zA-ZμµΩω°/·.^²³\d-]*)\s*$"
)


def _bare_number_if_unit_bearing(value):
    compact = _LATEX_MATHRM_RE.sub(r"\1", _normalize(value))
    compact = compact.replace("\\", " ")
    compact = re.sub(r"\s+", " ", compact).strip()
    match = _UNIT_TAIL_RE.match(compact)
    return match.group(1) if match else None


def _leak_needles(value):
    needles = [_normalize(value)]
    bare = _bare_number_if_unit_bearing(value)
    if bare and bare not in needles:
        needles.append(bare)
    return [n for n in needles if n]


def detect_leak(steps, final_answer_values):
    values = [v for v in final_answer_values if v]
    if not values:
        return False

    prior_accept = set()
    for step in steps:
        explanation = step.get("explanation", "")
        for value in values:
            needles = _leak_needles(value)
            leaked = any(_leaked_in_text(n, explanation) for n in needles)
            already_asked = any(_normalize(n) in prior_accept for n in needles)
            if leaked and not already_asked:
                return True
        accept = (step.get("check") or {}).get("accept") or []
        for a in accept:
            prior_accept.update(_leak_needles(a))

    return False
