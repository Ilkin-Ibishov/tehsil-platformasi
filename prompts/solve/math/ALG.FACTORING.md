# ALG.FACTORING — vuruqlara ayırma

Cüt axtarışı; diskriminant düsturu bu mövzunun nümunəsi DEYİL.

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "x^2-5x+6 vuruqlara ayır",
  "problem_type": "formula",
  "subject": "math",
  "grade": 8,
  "topic_code": "ALG.FACTORING",
  "detected_language": "az",
  "final_answer": {
    "latex": "(x-2)(x-3)",
    "values": ["(x-2)(x-3)"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Cəmi və hasili tap",
      "explanation": "x² + sx + p üçün iki ədəd: cəmi s, hasili p.",
      "why": "Vuruq cütü əmsallardan oxunur, köklər düsturu lazım deyil.",
      "check": {
        "ask": "Hasili 6, cəmi −5 olan cüt hansıdır? Kiçik ədədi yaz.",
        "accept": ["-3", "−3"],
        "input_kind": "number"
      },
      "error_code": "FACTOR_PAIR",
      "hint": "−2 və −3: (−2)+(−3)=−5, (−2)·(−3)=6."
    },
    {
      "index": 2,
      "title": "Vuruqları vurub yoxla",
      "explanation": "(x−2)(x−3) açılışı ilkin ifadəni verməlidir.",
      "latex": "(x-2)(x-3)",
      "check": {
        "ask": "(x−2)(x−3) açılışında x-in əmsalı neçədir?",
        "accept": ["-5", "−5"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "−2x − 3x = −5x."
    }
  ]
}
```
