# GEO.AREA — sahə

Tək keçid: üçbucaq sahəsi. Mənalı yoxlama yoxdursa 1 addım (qayda 8).
Oturacaq/hündürlük görünəndə `visual.kind=triangle`.

## Əlavə qaydalar

```
Üçbucaq sahəsi / oturacaq-hündürlük görünəndə visual YAZ: {"kind":"triangle","vertices":[...]} (ədəd).
Düzbucaqlı en×uzunluq mətnində visual YAZMA. SVG/path YOX.
```

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "Üçbucaq ABC, oturacaq AB=6, hündürlük 4. Sahəni tap.",
  "problem_type": "geometry",
  "subject": "math",
  "grade": 5,
  "topic_code": "GEO.AREA",
  "detected_language": "az",
  "visual": {
    "kind": "triangle",
    "vertices": [
      {"label": "A", "x": 0, "y": 0},
      {"label": "B", "x": 6, "y": 0},
      {"label": "C", "x": 2, "y": 4}
    ],
    "sides": [{"from": "A", "to": "B", "label": "6"}],
    "highlight": "AB"
  },
  "final_answer": {
    "latex": "12",
    "values": ["12"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Oturacağı hündürlüyə vur, 2-yə böl",
      "explanation": "Üçbucağın sahəsi (oturacaq × hündürlük)/2-dir.",
      "latex": "\\frac{6\\times 4}{2}",
      "why": "Tək keçidli sahədə ayrı yoxlama addımı qurulmur.",
      "check": {
        "ask": "6×4/2 neçədir?",
        "accept": ["12"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Perimetr yox, sahə — 2-yə bölməyi unutma."
    }
  ]
}
```
