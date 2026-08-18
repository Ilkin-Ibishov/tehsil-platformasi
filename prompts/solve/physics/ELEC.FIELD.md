# ELEC.FIELD — elektrik sahəsi

E=F/q. values vahidsiz.
Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "F=8 N, q=2 C. E tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "ELEC.FIELD",
  "detected_language": "az",
  "final_answer": {
    "latex": "E = 4\\ \\mathrm{N/C}",
    "values": ["4"]
  },
  "steps": [
    {
      "index": 1,
      "title": "E = F / q",
      "explanation": "Sahə intensivliyi qüvvənin yüka nisbətidir. F və q-nı yerinə qoy.",
      "latex": "E=F/q=8/2",
      "check": {
        "ask": "8/2 neçədir?",
        "accept": ["4"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "E=F/q, vahid N/C. Nəticəni izahda yazma."
    }
  ]
}
```
