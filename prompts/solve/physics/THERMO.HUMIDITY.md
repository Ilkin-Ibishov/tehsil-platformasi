# THERMO.HUMIDITY — rütubət

φ=a/a_doymuş. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "V=50 m^3, a=4.8 g/m^3, φ=40%. φ=50% üçün əlavə su kütləsi.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "THERMO.HUMIDITY",
  "detected_language": "az",
  "final_answer": {
    "latex": "m = 60\\ \\mathrm{g}",
    "values": ["60"]
  },
  "steps": [
    {
      "index": 1,
      "title": "a_doymuş və Δa",
      "explanation": "a_doymuş = a/φ. Hədəf 0,5·a_doymuş. Fərqi həcmə vur.",
      "latex": "a_{d}=\\frac{4{,}8}{0{,}4},\\quad \\Delta m=(6-4{,}8)\\cdot 50",
      "check": {
        "ask": "1,2·50 neçədir?",
        "accept": ["60"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "a_d=12; hədəf 6; Δa=1,2. Hasili izahda yazma."
    }
  ]
}
```
