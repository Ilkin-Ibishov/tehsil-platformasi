# THERMO.HEAT — istilik

Q=cmΔT. values vahidsiz.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "m=2 kg, c=4200 J/(kg·K), ΔT=10 K. Q tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 10,
  "topic_code": "THERMO.HEAT",
  "detected_language": "az",
  "final_answer": {
    "latex": "Q = 84000\\ \\mathrm{J}",
    "values": ["84000"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Q = c m ΔT",
      "explanation": "Q=4200·2·10=84000 J.",
      "latex": "Q=cm\\Delta T",
      "check": {
        "ask": "4200·2·10 neçədir?",
        "accept": ["84000"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Əvvəl 4200·2=8400, sonra ·10."
    }
  ]
}
```
