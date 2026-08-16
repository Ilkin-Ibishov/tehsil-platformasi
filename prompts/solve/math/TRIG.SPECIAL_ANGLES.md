# TRIG.SPECIAL_ANGLES — xüsusi bucaqlar

0°, 30°, 45°, 60°, 90° cədvəli. cos/sin qarışdırma.

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "sin 30° + cos 60°",
  "problem_type": "formula",
  "subject": "math",
  "grade": 9,
  "topic_code": "TRIG.SPECIAL_ANGLES",
  "detected_language": "az",
  "final_answer": {
    "latex": "1",
    "values": ["1"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Cədvəl qiymətlərini yaz",
      "explanation": "sin 30°=1/2, cos 60°=1/2.",
      "latex": "\\frac{1}{2}+\\frac{1}{2}",
      "why": "Xüsusi bucaqlarda yadda saxlanan qiymətlər düstur əvəzinə işlədilir.",
      "check": {
        "ask": "sin 30° neçədir? (1/2 üçün 0.5 yaz)",
        "accept": ["0.5", "1/2", "0,5"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "sin 30° = cos 60° = 1/2; sin 60° = √3/2."
    },
    {
      "index": 2,
      "title": "Cəmlə",
      "explanation": "1/2+1/2=1.",
      "latex": "1",
      "why": "Yoxlama: eyni iki yarım.",
      "check": {
        "ask": "1/2+1/2 neçədir?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "İki yarım bir tamdır."
    }
  ]
}
```
