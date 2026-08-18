# MECH.KINEMATICS — kinematika

Bərabərtəcilli hərəkət. `values` vahidsiz; vahid `latex`-də (E1.2).
s(t) / v(t) qrafiki kömək edirsə `visual.kind=cartesian` (linear/quadratic əvəzi deyil).
Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Əlavə qaydalar

```
s-t və ya v-t qrafiki kömək edirsə visual YAZ: {"kind":"cartesian","points":[...],"label":"s=t^2"}.
Tək ədəd düsturunda (yalnız s tap) visual YAZMA. SVG/path YOX. verified yazma.
explanation/latex son metri vermir; check.ask "s neçədir?"
```

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "v_0=0, a=4 m/s^2, t=3 s. Yol tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 9,
  "topic_code": "MECH.KINEMATICS",
  "detected_language": "az",
  "final_answer": {
    "latex": "s = 18\\ \\mathrm{m}",
    "values": ["18"]
  },
  "steps": [
    {
      "index": 1,
      "title": "s = a t^2 / 2",
      "explanation": "v_0=0 olduğu üçün s = a t^2 / 2. a və t-ni yerinə qoy; hasili şagird hesabla.",
      "latex": "s=\\frac{1}{2}a t^2=\\frac{1}{2}\\cdot 4\\cdot 3^{2}",
      "why": "Tək keçid: düstur + yerinəqoyma. Son ədəd yalnız check.ask-dədir.",
      "check": {
        "ask": "a=4, t=3 qoyanda s neçədir?",
        "accept": ["18"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Əvvəl t^2, sonra yarısı ilə a. Vahidi values-ə yazma."
    }
  ]
}
```
