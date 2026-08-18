# THERMO.GAS_LAWS — qaz qanunları

İdeal qaz, T sabit: pV=const (Boyl-Mariott).
Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

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
      "explanation": "T sabit: p1 V1 = p2 V2. V2 = p1 V1 / p2. Ədədləri yerinə qoy.",
      "latex": "V_2=\\frac{p_1 V_1}{p_2}=\\frac{2\\cdot 3}{6}",
      "check": {
        "ask": "6-nı 6-ya böləndə V2 neçədir?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Əvvəl p1·V1, sonra p2-yə böl. Nəticəni izahda yazma."
    }
  ]
}
```
