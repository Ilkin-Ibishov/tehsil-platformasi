# GEO.VECTORS — vektorlar

Toplama: uyğun koordinatları topla. Uzunluq üçün √(x²+y²).
Cəm üçbucağı görünəndə `visual.kind=triangle`.

## Əlavə qaydalar

```
Vektor cəmi / üçbucaq qaydası üçün visual YAZ: {"kind":"triangle","vertices":[O,A,C]}.
Tək uzunluq √(x²+y²) mətnində visual YAZMA. SVG/path YOX.
```

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "a=(2;3), b=(1;−1); a+b vektorunu tap",
  "problem_type": "geometry",
  "subject": "math",
  "grade": 10,
  "topic_code": "GEO.VECTORS",
  "detected_language": "az",
  "visual": {
    "kind": "triangle",
    "vertices": [
      {"label": "O", "x": 0, "y": 0},
      {"label": "A", "x": 2, "y": 3},
      {"label": "C", "x": 3, "y": 2}
    ],
    "sides": [
      {"from": "O", "to": "A", "label": "a"},
      {"from": "A", "to": "C", "label": "b"},
      {"from": "O", "to": "C", "label": "a+b"}
    ],
    "highlight": "OC"
  },
  "final_answer": {
    "latex": "(3;2)",
    "values": ["(3;2)", "3;2"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Koordinatları topla",
      "explanation": "a+b=(2+1; 3+(−1)).",
      "latex": "(2+1;\\ 3-1)",
      "why": "Vektor cəmi eyni ölçülü uyğun komponentlərin cəmidir.",
      "check": {
        "ask": "2+1 neçədir?",
        "accept": ["3"],
        "input_kind": "number"
      },
      "error_code": "SIGN_LOST",
      "hint": "İkinci komponentdə −1 var."
    },
    {
      "index": 2,
      "title": "Nəticəni yaz",
      "explanation": "a+b=(3;2).",
      "latex": "(3;2)",
      "why": "Yoxlama: (3;2)−b=(3−1;2−(−1))=(2;3)=a.",
      "check": {
        "ask": "3+(−1) neçədir?",
        "accept": ["2"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "3−1=2."
    }
  ]
}
```
