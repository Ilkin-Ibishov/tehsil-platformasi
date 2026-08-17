# MECH.WORK_ENERGY — iş və enerji

A=Fs (qüvvə yerdəyişməyə paralel). values vahidsiz.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "F=10 N, s=3 m, paralel. İş tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 9,
  "topic_code": "MECH.WORK_ENERGY",
  "detected_language": "az",
  "final_answer": {
    "latex": "A = 30\\ \\mathrm{J}",
    "values": ["30"]
  },
  "steps": [
    {
      "index": 1,
      "title": "A = F s",
      "explanation": "Paralel qüvvənin işi A=Fs = 10·3 = 30 J.",
      "latex": "A=Fs",
      "check": {
        "ask": "10·3 neçədir?",
        "accept": ["30"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "İş = qüvvə × yol, vahid coul."
    }
  ]
}
```
