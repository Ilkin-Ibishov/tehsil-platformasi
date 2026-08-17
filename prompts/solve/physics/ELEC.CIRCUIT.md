# ELEC.CIRCUIT — dövrə

İki eyni R ardıcıl: R_eq=2R. Dövrə elementlərini sözlə yaz.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "İki R=3 Ω ardıcıl. R_eq tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 10,
  "topic_code": "ELEC.CIRCUIT",
  "detected_language": "az",
  "final_answer": {
    "latex": "R_{eq} = 6\\ \\Omega",
    "values": ["6"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Ardıcıl cəm",
      "explanation": "Ardıcıl müqavimətlər toplanır: 3+3=6 Ω.",
      "latex": "R_{eq}=R+R",
      "check": {
        "ask": "3+3 neçədir?",
        "accept": ["6"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Paralel 1/R cəmi deyil — ardıcıldır."
    }
  ]
}
```
