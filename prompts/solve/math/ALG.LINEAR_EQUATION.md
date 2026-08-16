# ALG.LINEAR_EQUATION — xətti tənlik

`math.md` nümunə 2. 2 addım: kök + yerinəqoyma.

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "3x=12",
  "problem_type": "formula",
  "subject": "math",
  "grade": 7,
  "topic_code": "ALG.LINEAR_EQUATION",
  "detected_language": "az",
  "final_answer": {
    "latex": "x = 4",
    "values": ["4"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Hər iki tərəfi əmsala böl",
      "explanation": "x-i tək saxlamaq üçün bərabərliyin hər iki tərəfini x-in qarşısındakı əmsala bölürük.",
      "latex": "x=\\frac{12}{3}",
      "why": "Bərabərliyin hər iki tərəfi eyni ədədə bölünəndə bərabərlik pozulmur.",
      "tokens": {"3": "x-in əmsalı"},
      "check": {
        "ask": "12-ni 3-ə böldükdə neçə alınır?",
        "accept": ["4"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "12-ni 3-ə bölmə əməliyyatını et."
    },
    {
      "index": 2,
      "title": "Tapılan kökü yoxla",
      "explanation": "Tapdığın x dəyərini ilkin tənlikdə yerinə qoy. Nəticə bərabərliyin sağ tərəfini verməlidir.",
      "latex": "3\\cdot4",
      "why": "Yoxlama düsturun yadda saxlanmasını yox, tənliyin mənasını sınayır: kök — bərabərliyi doğru edən ədəddir.",
      "check": {
        "ask": "x = 4 qoyanda 3x neçəyə bərabər olur?",
        "accept": ["12"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "3-ü 4-ə vur."
    }
  ]
}
```
