# MECH.KINEMATICS — kinematika

Bərabərtəcilli hərəkət. `values` vahidsiz; vahid `latex`-də (E1.2).

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "v_0=0, a=2 m/s^2, t=4 s. Yol tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 9,
  "topic_code": "MECH.KINEMATICS",
  "detected_language": "az",
  "final_answer": {
    "latex": "s = 16\\ \\mathrm{m}",
    "values": ["16"]
  },
  "steps": [
    {
      "index": 1,
      "title": "s = a t^2 / 2",
      "explanation": "v_0=0 olduğu üçün s = a t^2 / 2. s = 2·16/2 = 16 m.",
      "latex": "s=\\frac{1}{2}at^2",
      "why": "Tək keçid: düstur + ədəd. Vahid lateksdə qalır.",
      "check": {
        "ask": "s neçə metrdir?",
        "accept": ["16"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "4²=16, sonra 2·16/2."
    }
  ]
}
```
