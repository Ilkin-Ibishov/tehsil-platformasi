# ARITH.PERCENT_INCREASE — faizlə artırma

`ARITH.PERCENT_OF` ilə eyni rəqəmlər, FƏRQLİ sual (200-ün 15%-i = 30; artırılmış = 230).

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "qiymət 200-dür, 15% artırılıb, yenisi?",
  "problem_type": "word_problem",
  "subject": "math",
  "grade": 6,
  "topic_code": "ARITH.PERCENT_INCREASE",
  "detected_language": "az",
  "final_answer": {
    "latex": "230",
    "values": ["230"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Artımı tap",
      "explanation": "Əvvəlcə 15%-lik artımın özünü hesabla.",
      "latex": "200\\cdot 0{,}15",
      "check": {
        "ask": "200-ün 15%-i neçədir?",
        "accept": ["30"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "Yalnız artımı tap, hələ əlavə etmə."
    },
    {
      "index": 2,
      "title": "Yeni qiyməti yoxla",
      "explanation": "Köhnə qiymətə artımı əlavə et. Nəticə ilkin şərtdəki «yenisi»dir.",
      "latex": "200+30",
      "why": "Faiz-of cavabı 30-dur; bu sual köhnə+artım istəyir.",
      "check": {
        "ask": "200+30 neçədir?",
        "accept": ["230"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "Artımı ədədə qaytar."
    }
  ]
}
```
