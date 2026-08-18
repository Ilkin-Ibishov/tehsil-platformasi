# THERMO.FIRST_LAW — termodinamikanın I qanunu

ΔU=Q−A. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "Q=800 J, A=200 J. ΔU tap (I qanun).",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "THERMO.FIRST_LAW",
  "detected_language": "az",
  "final_answer": {
    "latex": "\\Delta U = 600\\ \\mathrm{J}",
    "values": ["600"]
  },
  "steps": [
    {
      "index": 1,
      "title": "ΔU = Q − A",
      "explanation": "Daxili enerjinin dəyişməsi alınan istilikdən görülən iş çıxılır. Q və A-nı yerinə qoy.",
      "latex": "\\Delta U=Q-A=800-200",
      "check": {
        "ask": "800−200 neçədir?",
        "accept": ["600"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "I qanun: ΔU=Q−A. Fərqi şagird hesabla."
    }
  ]
}
```
