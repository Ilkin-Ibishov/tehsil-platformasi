# ALG.RADICALS — kökalma / sadələşdirmə

√(a²)=|a| və vurma qaydası √(ab)=√a·√b (a,b≥0). İşarəni itirmə.

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "√50-ni sadələşdir",
  "problem_type": "formula",
  "subject": "math",
  "grade": 9,
  "topic_code": "ALG.RADICALS",
  "detected_language": "az",
  "final_answer": {
    "latex": "5\\sqrt{2}",
    "values": ["5√2", "5\\sqrt{2}"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Tam kvadrat vuruğu ayır",
      "explanation": "50=25·2 və 25 tam kvadratdır.",
      "latex": "\\sqrt{50}=\\sqrt{25\\cdot2}",
      "why": "Kökalma altında tam kvadrat çıxarılmalıdır.",
      "check": {
        "ask": "50-ni hansı tam kvadrata vurmaq olar? (25 və ya 16)",
        "accept": ["25"],
        "input_kind": "number"
      },
      "error_code": "FACTOR_PAIR",
      "hint": "25·2=50."
    },
    {
      "index": 2,
      "title": "Kökü ayır",
      "explanation": "√(25·2)=√25·√2=5√2.",
      "latex": "5\\sqrt{2}",
      "why": "Yoxlama: (5√2)²=25·2=50.",
      "check": {
        "ask": "5²·2 neçədir?",
        "accept": ["50"],
        "input_kind": "number"
      },
      "error_code": "SQUARE_FORGOTTEN",
      "hint": "Sadələşmiş formanın kvadratı ilkin ədədi verməlidir."
    }
  ]
}
```
