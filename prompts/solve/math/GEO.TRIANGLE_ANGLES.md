# GEO.TRIANGLE_ANGLES — üçbucaq bucaqları

Daxili bucaqların cəmi 180°. Naməlum bucağı digər ikisindən tap.
Bucaqlar görünəndə `visual.kind=triangle`.

## Əlavə qaydalar

```
Bucaq tapmaq / 180° cəmi üçün visual YAZ: {"kind":"triangle","vertices":[...],"angles":[...],"highlight":"C"}.
SVG/path YOX. Naməlum kind UYDURMA.
```

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "Üçbucaqda A=40°, B=65°; C-ni tap",
  "problem_type": "geometry",
  "subject": "math",
  "grade": 7,
  "topic_code": "GEO.TRIANGLE_ANGLES",
  "detected_language": "az",
  "visual": {
    "kind": "triangle",
    "vertices": [
      {"label": "A", "x": 0, "y": 0},
      {"label": "B", "x": 4, "y": 0},
      {"label": "C", "x": 1, "y": 3}
    ],
    "angles": [
      {"at": "A", "label": "40°"},
      {"at": "B", "label": "65°"},
      {"at": "C", "label": "C"}
    ],
    "highlight": "C"
  },
  "final_answer": {
    "latex": "75^\\circ",
    "values": ["75"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Cəmi yaz",
      "explanation": "A+B+C=180°.",
      "latex": "40+65+C=180",
      "why": "Hər düzgün üçbucaqda daxili bucaq cəmi sabitdir.",
      "check": {
        "ask": "40+65 neçədir?",
        "accept": ["105"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "40+60=100, üstəgəl 5."
    },
    {
      "index": 2,
      "title": "C-ni tap",
      "explanation": "C=180−105=75°.",
      "latex": "C=75^\\circ",
      "why": "Yoxlama: 40+65+75=180.",
      "check": {
        "ask": "180−105 neçədir?",
        "accept": ["75"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Cəmi 180-dən çıx, 90-dan yox."
    }
  ]
}
```
