# THERMO.HEAT — istilik

Q=cmΔT. values vahidsiz.
Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

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
      "explanation": "İstilik miqdarı c, m və ΔT hasilidir. Üç kəmiyyəti yerinə qoy.",
      "latex": "Q=cm\\Delta T=4200\\cdot 2\\cdot 10",
      "check": {
        "ask": "4200·2·10 neçədir?",
        "accept": ["84000"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Əvvəl 4200·2, sonra ·10. Hasili izahda yazma."
    }
  ]
}
```
