# MECH.OSCILLATIONS — rəqslər

T=2π√(L/g). Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "L=10 m, g=10, π=3. Period T tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MECH.OSCILLATIONS",
  "detected_language": "az",
  "final_answer": {
    "latex": "T = 6\\ \\mathrm{s}",
    "values": ["6"]
  },
  "steps": [
    {
      "index": 1,
      "title": "T = 2π √(L/g)",
      "explanation": "Riyazi rəqqasın periodu. L/g=1, √1=1, 2π-ni qoy.",
      "latex": "T=2\\pi\\sqrt{L/g}=2\\cdot 3\\cdot 1",
      "check": {
        "ask": "2·3 neçədir?",
        "accept": ["6"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "√(10/10)=1. Hasili izahda yazma."
    }
  ]
}
```
