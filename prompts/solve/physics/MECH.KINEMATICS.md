# MECH.KINEMATICS — kinematika

Bərabərtəcilli hərəkət. `values` vahidsiz; vahid `latex`-də (E1.2).
s(t) / v(t) qrafiki kömək edirsə `visual.kind=cartesian` (linear/quadratic əvəzi deyil).

## Əlavə qaydalar

```
s-t və ya v-t qrafiki kömək edirsə visual YAZ: {"kind":"cartesian","points":[...],"label":"s=t^2"}.
Tək ədəd düsturunda (yalnız s tap) visual YAZMA. SVG/path YOX. verified yazma.
```

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
  "visual": {
    "kind": "cartesian",
    "points": [
      {"x": 0, "y": 0},
      {"x": 2, "y": 4},
      {"x": 4, "y": 16}
    ],
    "label": "s=t^2"
  },
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
