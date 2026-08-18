# ELEC.POTENTIAL — elektrik potensialı

U=kQ/r, W=qΔU. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "q=2 C, Δφ=6 V. Sahənin işi W tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "ELEC.POTENTIAL",
  "detected_language": "az",
  "final_answer": {
    "latex": "W = 12\\ \\mathrm{J}",
    "values": ["12"]
  },
  "steps": [
    {
      "index": 1,
      "title": "W = q Δφ",
      "explanation": "Sahənin işi yük ilə potensiallar fərqinin hasilidir. q və Δφ-ni qoy.",
      "latex": "W=q\\Delta\\varphi=2\\cdot 6",
      "check": {
        "ask": "2·6 neçədir?",
        "accept": ["12"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "W=qΔφ. Hasili izahda yazma."
    }
  ]
}
```
