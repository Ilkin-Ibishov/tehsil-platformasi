# TRIG.IDENTITIES — əsas eynilik

cos²+sin²=1. Düsturu yanlış yerdə tətbiq etməmək üçün nümunə konkret ədəddə yoxlayır.

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "x=π/6 olduqda cos²x + sin²x",
  "problem_type": "formula",
  "subject": "math",
  "grade": 10,
  "topic_code": "TRIG.IDENTITIES",
  "detected_language": "az",
  "final_answer": {
    "latex": "1",
    "values": ["1"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Eyniliyi tanı",
      "explanation": "İstənilən x üçün cos²x + sin²x = 1. Qiymətləri ayrıca hesablamadan eyniliyi yaz.",
      "latex": "\\cos^2 x+\\sin^2 x=1",
      "why": "Bu, tərif eyniliyidir — x-dən asılı deyil.",
      "check": {
        "ask": "cos²x + sin²x neçəyə bərabərdir?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "cos+sin və ya 2sinx cosx deyil."
    },
    {
      "index": 2,
      "title": "Ədədlə yoxla",
      "explanation": "x=π/6 üçün cos=√3/2, sin=1/2 — kvadratların cəmi 1 olmalıdır.",
      "latex": "(3/4)+(1/4)",
      "why": "Eynilik ilkin ifadəyə qayıdır.",
      "check": {
        "ask": "3/4 + 1/4 neçədir?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "Əvvəl kvadratla, sonra cəmlə."
    }
  ]
}
```
