# ELEC.INDUCTION — elektromaqnit induksiya

ε=ΔΦ/Δt, öz-induksiya. Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).
`topic_code` dəqiq `ELEC.INDUCTION` — `PHYS.SELF_INDUCTION`, `MAG.INDUCTANCE`, `PHYS.MAGNETIC_ENERGY` yazma.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "ΔΦ=6 Wb, Δt=2 s. ε tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "ELEC.INDUCTION",
  "detected_language": "az",
  "final_answer": {
    "latex": "\\mathcal{E} = 3\\ \\mathrm{V}",
    "values": ["3"]
  },
  "steps": [
    {
      "index": 1,
      "title": "ε = ΔΦ / Δt",
      "explanation": "İnduksiya EHQ-si selin dəyişmə sürətidir. ΔΦ və Δt-ni yerinə qoy.",
      "latex": "\\mathcal{E}=\\frac{\\Delta\\Phi}{\\Delta t}=\\frac{6}{2}",
      "check": {
        "ask": "6/2 neçədir?",
        "accept": ["3"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Faradey. Nəticəni izahda yazma."
    }
  ]
}
```
