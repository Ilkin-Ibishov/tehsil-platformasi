# GEO.VECTORS — vektorlar

Toplama: uyğun koordinatları topla. Uzunluq üçün √(x²+y²).

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
