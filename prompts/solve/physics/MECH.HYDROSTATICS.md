# MECH.HYDROSTATICS — hidrostatika

p=ρgh; Arximed. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "Maye sütunu ρ, h. Təzyiq p=ρgh; g=10. p-ni ρh ilə tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MECH.HYDROSTATICS",
  "detected_language": "az",
  "final_answer": {
    "latex": "p = 10\\rho h",
    "values": ["10"]
  },
  "steps": [
    {
      "index": 1,
      "title": "p = ρ g h",
      "explanation": "Hidrostatik təzyiq sıxlıq, g və hündürlüyün hasilidir. g-ni yerinə qoy.",
      "latex": "p=\\rho g h=\\rho\\cdot 10\\cdot h",
      "check": {
        "ask": "g=10 olanda p neçə ρh-dir?",
        "accept": ["10"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "p=ρgh, g=10. Əmsalı check.ask istəyir."
    }
  ]
}
```
