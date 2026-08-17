# MECH.DYNAMICS — dinamika

Nyutonun II qanunu. Qüvvə diaqramı sözlə canonical-da; `force_diagram` kind YOXDUR.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "m=2 kg, a=3 m/s^2. F tap. (F=ma)",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 9,
  "topic_code": "MECH.DYNAMICS",
  "detected_language": "az",
  "final_answer": {
    "latex": "F = 6\\ \\mathrm{N}",
    "values": ["6"]
  },
  "steps": [
    {
      "index": 1,
      "title": "F = m a",
      "explanation": "Nəticəvi qüvvə kütlə ilə təcilin hasilidir: 2·3 = 6 N.",
      "latex": "F=ma",
      "check": {
        "ask": "2·3 neçədir?",
        "accept": ["6"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Nyuton: F=ma, vahid nyuton."
    }
  ]
}
```
