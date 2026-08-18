# ELEC.OHM — Om qanunu

I=U/R. values vahidsiz.
Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "U=12 V, R=4 Ω. I tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 9,
  "topic_code": "ELEC.OHM",
  "detected_language": "az",
  "final_answer": {
    "latex": "I = 3\\ \\mathrm{A}",
    "values": ["3"]
  },
  "steps": [
    {
      "index": 1,
      "title": "I = U / R",
      "explanation": "Om: cərəyan gərginliyin müqavimətə nisbətidir. U və R-i yerinə qoy.",
      "latex": "I=U/R=12/4",
      "check": {
        "ask": "12-ni 4-ə böləndə neçədir?",
        "accept": ["3"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "I=U/R, vahid amper. Nəticəni izahda yazma."
    }
  ]
}
```
