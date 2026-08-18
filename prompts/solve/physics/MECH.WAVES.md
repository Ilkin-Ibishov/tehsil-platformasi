# MECH.WAVES — mexaniki dalğalar

v=fλ. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "v=300 m/s, λ=4 m. Tezliyi tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MECH.WAVES",
  "detected_language": "az",
  "final_answer": {
    "latex": "f = 75\\ \\mathrm{Hz}",
    "values": ["75"]
  },
  "steps": [
    {
      "index": 1,
      "title": "f = v / λ",
      "explanation": "Tezlik sürətin dalğa uzunluğuna nisbətidir. v və λ-nı yerinə qoy.",
      "latex": "f=\\frac{v}{\\lambda}=\\frac{300}{4}",
      "check": {
        "ask": "300-ü 4-ə böləndə f neçədir?",
        "accept": ["75"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "f=v/λ, vahid herts. Son ədədi izahda yazma."
    }
  ]
}
```
