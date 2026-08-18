# EM.WAVES — elektromaqnit dalğaları

c=3·10^8 m/s vakuumda. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "Radio dalğası vakuumda. Sürəti c-yə nisbətən neçədir?",
  "problem_type": "word_problem",
  "subject": "physics",
  "grade": 11,
  "topic_code": "EM.WAVES",
  "detected_language": "az",
  "final_answer": {
    "latex": "c",
    "values": ["1"]
  },
  "steps": [
    {
      "index": 1,
      "title": "EM dalğa vakuumda",
      "explanation": "Bütün elektromaqnit dalğaları vakuumda eyni c sürəti ilə gedir. Nisbəti şagird desin.",
      "latex": "v_{\\mathrm{radio}}=c",
      "check": {
        "ask": "v/c neçədir?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Səs deyil, EM-dir. Nisbəti izahda yazma."
    }
  ]
}
```
