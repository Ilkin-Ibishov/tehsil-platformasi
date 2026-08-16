# GEO.AREA — sahə

Tək keçid: düzbucaqlı sahəsi. Mənalı yoxlama yoxdursa 1 addım (qayda 8).

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "en 4 m, uzunluq 6 m olan düzbucaqlının sahəsi",
  "problem_type": "geometry",
  "subject": "math",
  "grade": 5,
  "topic_code": "GEO.AREA",
  "detected_language": "az",
  "final_answer": {
    "latex": "24\\ m^2",
    "values": ["24"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Eni uzunluğa vur",
      "explanation": "Düzbucaqlının sahəsi en × uzunluqdur.",
      "latex": "4\\times 6",
      "why": "Tək keçidli sahədə ayrı yoxlama addımı qurulmur.",
      "check": {
        "ask": "4×6 neçədir?",
        "accept": ["24"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Perimetr (2·(4+6)) yox, sahə."
    }
  ]
}
```
