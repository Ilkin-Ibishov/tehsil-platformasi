# MECH.STATICS — statika

Moment tarazlığı. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "T1=40 N, qolu 3 və 2. T2 tap (moment tarazlığı).",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MECH.STATICS",
  "detected_language": "az",
  "final_answer": {
    "latex": "T_2 = 60\\ \\mathrm{N}",
    "values": ["60"]
  },
  "steps": [
    {
      "index": 1,
      "title": "T1 · 3 = T2 · 2",
      "explanation": "Dayaq ətrafında momentlər bərabərdir. T1 qolunu yaz, T2-ni tap.",
      "latex": "T_2=\\frac{40\\cdot 3}{2}",
      "check": {
        "ask": "120-ni 2-yə böləndə T2 neçədir?",
        "accept": ["60"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "M=F·d. Nəticəni izahda yazma."
    }
  ]
}
```
