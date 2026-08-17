# ALG.VIETA_SUM — köklərin cəmi (Viyet)

Eyni ədədlər `ALG.QUADRATIC_EQUATION`-dan FƏRQLİ sualdır (ADR-008). Diskriminant yox — cəm −b/a.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "x^2-5x+6=0-ın köklərinin cəmi",
  "problem_type": "formula",
  "subject": "math",
  "grade": 9,
  "topic_code": "ALG.VIETA_SUM",
  "detected_language": "az",
  "final_answer": {
    "latex": "5",
    "values": ["5"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Viyet cəmini yaz",
      "explanation": "ax²+bx+c=0 üçün köklərin cəmi −b/a-dır. Kökləri tapma.",
      "latex": "x_1+x_2=-b/a",
      "why": "Sual cəmi istəyir — ayrı-ayrı köklər lazım deyil.",
      "check": {
        "ask": "−b/a bu tənlikdə neçədir?",
        "accept": ["5"],
        "input_kind": "number"
      },
      "error_code": "COEFFICIENT_READ",
      "hint": "b = −5, a = 1 → −(−5)/1."
    },
    {
      "index": 2,
      "title": "Köklərin cəmini yoxla",
      "explanation": "Köklər 2 və 3-dürsə, cəmləri Viyet nəticəsi ilə eyni olmalıdır.",
      "latex": "2+3",
      "why": "İki üsul eyni ədədi verməlidir.",
      "check": {
        "ask": "2+3 neçədir?",
        "accept": ["5"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "Viyet cəmi ilə tutuşdur."
    }
  ]
}
```
