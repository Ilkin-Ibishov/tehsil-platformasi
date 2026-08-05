"""Cavab sızması detektoru: step.explanation-da final_answer.values-dən hər hansı biri varmı.

Sadə token-üst-üstə-düşmə kifayət etmir: Azərbaycan dilində rəqəmə şəkilçi defislə bitişir
('3-ə', '2-dən'), amma riyazi ifadələrdə də defis çıxma əməli kimi bitişik yazılır ('b^2-4ac').
Bu ikisini ayırmaq üçün: dəyərdən sonra "-hərf" gəlirsə şəkilçi sayılıb sızma kimi qəbul edilir,
"-rəqəm" gəlirsə riyazi ifadənin davamı sayılıb rədd edilir.
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


def detect_leak(steps, final_answer_values):
    values = [v for v in final_answer_values if v]
    if not values:
        return False
    for step in steps:
        explanation = step.get("explanation", "")
        if any(_leaked_in_text(v, explanation) for v in values):
            return True
    return False
