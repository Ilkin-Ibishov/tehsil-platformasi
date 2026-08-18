# MECH.ROTATIONAL_MOTION — fırlanma

s=N·πd / N=s/C. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "Təkər d=1 m, π=3, s=30 m. Dövrə sayı N tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MECH.ROTATIONAL_MOTION",
  "detected_language": "az",
  "final_answer": {
    "latex": "N = 10",
    "values": ["10"]
  },
  "steps": [
    {
      "index": 1,
      "title": "N = s / (π d)",
      "explanation": "Dövrə sayı yolu çevrə uzunluğuna bölməkdir. πd-ni yaz, s-i böl.",
      "latex": "N=\\frac{s}{\\pi d}=\\frac{30}{3\\cdot 1}",
      "check": {
        "ask": "30-u 3-ə böləndə N neçədir?",
        "accept": ["10"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "C=πd. Nəticəni izahda yazma."
    }
  ]
}
```
