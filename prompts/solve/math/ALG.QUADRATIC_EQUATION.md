# ALG.QUADRATIC_EQUATION — kvadrat tənlik (diskriminant)

Fənn fallback-indəki 6 addımlıq mətn məsələsinin qısa forması. Köklər düsturu + yoxlama.
Parabola kökləri ox kəsişməsidir — `visual.kind=quadratic`. Sahə mətni (en×uzunluq) qrafiksiz qalır (`math.md` nümunə 3).

## Əlavə qaydalar

```
y=ax²+bx+c qrafiki / köklər ox kəsişməsi / təpə varsa visual YAZ: {"kind":"quadratic","a":…,"b":…,"c":…}.
Sahə mətn məsələsində visual YAZMA. SVG/path YOX. Naməlum kind (hiperbola) UYDURMA.
```

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "x^2-5x+6=0",
  "problem_type": "formula",
  "subject": "math",
  "grade": 9,
  "topic_code": "ALG.QUADRATIC_EQUATION",
  "detected_language": "az",
  "visual": {"kind": "quadratic", "a": 1, "b": -5, "c": 6},
  "final_answer": {
    "latex": "x=3,\\ x=2",
    "values": ["3", "2"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Diskriminantı hesabla",
      "explanation": "D = b² − 4ac düsturunu əmsallara tətbiq et.",
      "latex": "D=b^2-4ac",
      "why": "D-nin işarəsi neçə həqiqi kök olduğunu göstərir.",
      "check": {
        "ask": "D nə çıxır?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "SQUARE_FORGOTTEN",
      "hint": "Əvvəlcə (−5)², sonra 4·1·6."
    },
    {
      "index": 2,
      "title": "Kökləri tap",
      "explanation": "x = (−b ± √D) / (2a) düsturunu tətbiq et.",
      "latex": "x=\\frac{5\\pm1}{2}",
      "check": {
        "ask": "(5+1)/2 neçədir?",
        "accept": ["3"],
        "input_kind": "number"
      },
      "error_code": "ORDER_OF_OPS",
      "hint": "Əvvəlcə cəmi, sonra 2-yə böl."
    },
    {
      "index": 3,
      "title": "Kökü tənliyə qoy",
      "explanation": "Tapılan kökü ilkin tənlikdə yerinə qoy — sol tərəf 0 verməlidir.",
      "latex": "3^2-5\\cdot3+6",
      "why": "Kök — tənliyi doğru edən ədəddir.",
      "check": {
        "ask": "x=3 qoyanda sol tərəf neçədir?",
        "accept": ["0"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "9 − 15 + 6."
    }
  ]
}
```
