# MECH.ELASTICITY — elastiklik

k∝S/l. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "k1=10 kN/m, eyni material, l2=2l, R2=3R. k2 tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MECH.ELASTICITY",
  "detected_language": "az",
  "final_answer": {
    "latex": "k_2 = 45\\ \\mathrm{kN/m}",
    "values": ["45"]
  },
  "steps": [
    {
      "index": 1,
      "title": "k ∝ R^2 / l",
      "explanation": "Sərtlik kəsiyə düz, uzunluğa tərsdir. (3)^2 / 2 nisbətini k1-ə vur.",
      "latex": "k_2=10\\cdot\\frac{3^{2}}{2}",
      "check": {
        "ask": "10·9/2 neçədir?",
        "accept": ["45"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "9/2=4,5; 10·4,5. Nəticəni izahda yazma."
    }
  ]
}
```
