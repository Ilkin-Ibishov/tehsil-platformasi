# ELEC.CAPACITANCE — tutum

C=q/U, C=ε0S/d. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "q=8 C, U=2 V. C tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "ELEC.CAPACITANCE",
  "detected_language": "az",
  "final_answer": {
    "latex": "C = 4\\ \\mathrm{F}",
    "values": ["4"]
  },
  "steps": [
    {
      "index": 1,
      "title": "C = q / U",
      "explanation": "Tutum yükün gərginliyə nisbətidir. q və U-nu yerinə qoy.",
      "latex": "C=q/U=8/2",
      "check": {
        "ask": "8/2 neçədir?",
        "accept": ["4"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "C=q/U. Nəticəni izahda yazma."
    }
  ]
}
```
