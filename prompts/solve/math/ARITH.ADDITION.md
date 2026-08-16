# ARITH.ADDITION — tək keçidli cəm

`math.md` nümunə 1-in eynisi. 1 addım; mənalı yoxlama yoxdur (qayda 8).

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "5+5=?, cəm tapılmalıdır",
  "problem_type": "formula",
  "subject": "math",
  "grade": 5,
  "topic_code": "ARITH.ADDITION",
  "detected_language": "az",
  "final_answer": {
    "latex": "10",
    "values": ["10"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Ədədləri topla",
      "explanation": "Verilmiş iki ədədi topla.",
      "latex": "5+5",
      "why": "Tək keçidli cəmdə ayrı yoxlama addımı qurulmur — nəticənin özü cavabdır.",
      "check": {
        "ask": "5 ilə 5-in cəmi neçədir?",
        "accept": ["10"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "Onluq yoxdur — təklikləri birləşdir."
    }
  ]
}
```
