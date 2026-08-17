# THERMO.GAS_LAWS — qaz qanunları

İdeal qaz, T sabit: pV=const (Boyl-Mariott).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "p1=2 atm, V1=3 l, p2=6 atm, T sabit. V2 tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 10,
  "topic_code": "THERMO.GAS_LAWS",
  "detected_language": "az",
  "final_answer": {
    "latex": "V_2 = 1\\ \\mathrm{l}",
    "values": ["1"]
  },
  "steps": [
    {
      "index": 1,
      "title": "p1 V1 = p2 V2",
      "explanation": "T sabit: 2·3 = 6·V2 → V2=1 l.",
      "latex": "p_1V_1=p_2V_2",
      "check": {
        "ask": "6 / 6 neçədir?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "2·3=6, 6-nı p2-yə böl."
    }
  ]
}
```
