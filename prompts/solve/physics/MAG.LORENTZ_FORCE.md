# MAG.LORENTZ_FORCE — Lorens qüvvəsi

F=qvB, R=p/(qB). Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "v=4 m/s, B=2 T, q=3 C, v⊥B. F tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MAG.LORENTZ_FORCE",
  "detected_language": "az",
  "final_answer": {
    "latex": "F = 24\\ \\mathrm{N}",
    "values": ["24"]
  },
  "steps": [
    {
      "index": 1,
      "title": "F = q v B",
      "explanation": "Perpendikulyar hərəkətdə Lorens qüvvəsi qvB-dir. Üç kəmiyyəti yerinə qoy.",
      "latex": "F=qvB=3\\cdot 4\\cdot 2",
      "check": {
        "ask": "3·4·2 neçədir?",
        "accept": ["24"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "sin90°=1. Hasili izahda yazma."
    }
  ]
}
```
