# GEO.TRIANGLE_ANGLES — üçbucaq bucaqları

Daxili bucaqların cəmi 180°. Naməlum bucağı digər ikisindən tap.

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "Üçbucaqda A=40°, B=65°; C-ni tap",
  "problem_type": "geometry",
  "subject": "math",
  "grade": 7,
  "topic_code": "GEO.TRIANGLE_ANGLES",
  "detected_language": "az",
  "final_answer": {
    "latex": "75^\\circ",
    "values": ["75"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Cəmi yaz",
      "explanation": "A+B+C=180°.",
      "latex": "40+65+C=180",
      "why": "Hər düzgün üçbucaqda daxili bucaq cəmi sabitdir.",
      "check": {
        "ask": "40+65 neçədir?",
        "accept": ["105"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "40+60=100, üstəgəl 5."
    },
    {
      "index": 2,
      "title": "C-ni tap",
      "explanation": "C=180−105=75°.",
      "latex": "C=75^\\circ",
      "why": "Yoxlama: 40+65+75=180.",
      "check": {
        "ask": "180−105 neçədir?",
        "accept": ["75"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Cəmi 180-dən çıx, 90-dan yox."
    }
  ]
}
```
