# ARITH.PERCENT_OF — faizini tap

`ARITH.PERCENT_INCREASE` ilə qarışdırma: burada yeni qiymət yox, hissədir.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "200-ün 15%-i neçədir?",
  "problem_type": "word_problem",
  "subject": "math",
  "grade": 6,
  "topic_code": "ARITH.PERCENT_OF",
  "detected_language": "az",
  "final_answer": {
    "latex": "30",
    "values": ["30"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Faizi vurmağa çevir",
      "explanation": "p%-i tapmaq üçün ədədi p/100-ə vur.",
      "latex": "200\\cdot 0{,}15",
      "why": "Faiz — yüzə bölünmüş hissədir, artırma deyil.",
      "check": {
        "ask": "200 · 0,15 neçədir?",
        "accept": ["30"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "200 · 15 = 3000, sonra 100-ə böl."
    }
  ]
}
```
