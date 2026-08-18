# ELEC.AC_CIRCUITS — dəyişən cərəyan

ν=1/(2π√(LC)), XL=ωL. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "L=4 H, C=1 F (ədəd). ν1/ν2: eyni LC hasilində nisbət.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "ELEC.AC_CIRCUITS",
  "detected_language": "az",
  "final_answer": {
    "latex": "\\nu_1=\\nu_2",
    "values": ["nu1=nu2"]
  },
  "steps": [
    {
      "index": 1,
      "title": "ν ∝ 1/√(LC)",
      "explanation": "LC hasili eynidirsə tezlik də eynidir. Nisbəti şagird desin — izahda 1 yazma.",
      "latex": "\\nu\\propto 1/\\sqrt{LC}",
      "check": {
        "ask": "LC eyni olanda ν1 və ν2 necədir?",
        "accept": ["nu1=nu2", "1"],
        "input_kind": "expression"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "√(LC) eynidirsə ν eynidir. Tomson əmsalını explanation-da yazma."
    }
  ]
}
```
