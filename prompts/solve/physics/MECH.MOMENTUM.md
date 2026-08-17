# MECH.MOMENTUM — impuls

p=mv. values vahidsiz.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "m=4 kg, v=5 m/s. Impuls tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 10,
  "topic_code": "MECH.MOMENTUM",
  "detected_language": "az",
  "final_answer": {
    "latex": "p = 20\\ \\mathrm{kg\\cdot m/s}",
    "values": ["20"]
  },
  "steps": [
    {
      "index": 1,
      "title": "p = m v",
      "explanation": "Impuls kütlə ilə sürətin hasilidir: 4·5 = 20.",
      "latex": "p=mv",
      "check": {
        "ask": "4·5 neçədir?",
        "accept": ["20"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "p=mv, vahidi latex-də saxla."
    }
  ]
}
```
