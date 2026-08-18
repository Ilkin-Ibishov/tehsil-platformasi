# OPT.REFRACTION — işığın sınması

n=c/v və ya n1 sin i = n2 sin r. Sadə nisbət.
Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "c=3e8 m/s, v=2e8 m/s. n tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "OPT.REFRACTION",
  "detected_language": "az",
  "final_answer": {
    "latex": "n = 1{,}5",
    "values": ["1.5", "1,5", "3/2"]
  },
  "steps": [
    {
      "index": 1,
      "title": "n = c / v",
      "explanation": "Sınma əmsalı vakuumdakı sürətin mühitdəkinə nisbətidir. 10^8 ixtisar olunur.",
      "latex": "n=c/v=\\frac{3\\cdot 10^{8}}{2\\cdot 10^{8}}",
      "check": {
        "ask": "3·10^8 / 2·10^8 neçədir?",
        "accept": ["1.5", "1,5", "3/2"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "10^8 ixtisar olunur, 3/2 qalır. 1,5-i izahda yazma."
    }
  ]
}
```
