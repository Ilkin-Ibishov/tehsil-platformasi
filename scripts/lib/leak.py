"""ADR-005: Cavab sızması = şagirdin HƏLƏ SORUŞULMADIĞI dəyəri açıqlamaq.

V dəyəri i-ci addımda sızmış sayılır ƏGƏR:
  1. V steps[i].explanation-da görünürsə, VƏ
  2. V heç bir ƏVVƏLKİ addımın (j < i) check.accept siyahısında yoxdursa

j < i qəsdəndir (j <= i yox): addımın öz sualının cavabını öz izahında açıqlaması sızmadır,
amma şagirdin ARTIQ ÖZÜ yazdığı (əvvəlki addımda accept edilmiş) dəyərə sonrakı addımda
istinad etmək sızma deyil — bax ADR-004-ün tələb etdiyi məcburi yoxlama addımı.

_leaked_in_text-dəki rəqəm/şəkilçi ayırd etməsi (Azərbaycan dilində '3-ə' vs riyazi 'b^2-4ac')
dəyişməz saxlanılır — yalnız HANSI addımlarda axtarılacağı dəyişir.
"""

import re


def _leaked_in_text(value, text):
    text = text.replace("−", "-")
    value = value.replace("−", "-").strip()
    if not value:
        return False
    pattern = re.compile(
        r"(?<![\w.])" + re.escape(value) + r"(?!\w)(?!-\d)(?!\.\d)",
        flags=re.UNICODE,
    )
    return pattern.search(text) is not None


def _normalize(v):
    return v.replace("−", "-").strip()


def detect_leak(steps, final_answer_values):
    values = [v for v in final_answer_values if v]
    if not values:
        return False

    prior_accept = set()
    for step in steps:
        explanation = step.get("explanation", "")
        for value in values:
            if _leaked_in_text(value, explanation) and _normalize(value) not in prior_accept:
                return True
        accept = (step.get("check") or {}).get("accept") or []
        prior_accept.update(_normalize(a) for a in accept)

    return False
