# Fənn əlavəsi — riyaziyyat

`ADR-014` (HANDOFF 40): `prompts/solve/core.md` sxem/qaydaları daşıyır, bura fənnə xas nümunə
düşür — hazırda YALNIZ nümunə JSON-u, çünki fizika/kimya hələ ayrı nümunə tələb etmir
(subject sahəsi onsuz da `math|physics|chemistry` üçün dil-neytraldır, qaydalar dəyişmir).
`prompt_loader` bunu `core.md`-dəki `{{MATH_EXAMPLE}}` yer tutucusuna qoyur — TƏK çağırış
davam edir, birləşmiş mətn əvvəlki `solve-step.md`-lə HƏRFİ EYNİDİR.

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "x^2-5x+6=0",
  "problem_type": "formula",
  "subject": "math",
  "grade": 8,
  "topic_code": "ALG.QUADRATIC_EQUATION",
  "detected_language": "az",
  "final_answer": {
    "latex": "x_1 = 3,\\ x_2 = 2",
    "values": ["3", "2"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Əmsalları oxu",
      "explanation": "Tənlik standart formadadır, deməli üç əmsalı birbaşa götürmək olar.",
      "latex": "ax^2+bx+c=0",
      "why": "Standart forma hər əmsalı öz yerinə bağlayır — düstur yalnız bu formada işləyir.",
      "tokens": {"a": "x² qarşısındakı əmsal", "b": "x qarşısındakı əmsal", "c": "sərbəst hədd"},
      "check": {
        "ask": "b nəyə bərabərdir?",
        "accept": ["-5", "−5"],
        "input_kind": "number"
      },
      "error_code": "SIGN_LOST",
      "hint": "Minus işarəsi ədədin bir hissəsidir: b = −5."
    },
    {
      "index": 2,
      "title": "Diskriminantı hesabla",
      "explanation": "Diskriminant kökün sayını verir: müsbətdirsə iki, sıfırdırsa bir kök var.",
      "latex": "D=b^2-4ac",
      "why": "Kvadrat kökün altındakı ifadə mənfi ola bilməz — buna görə D-nin işarəsi kökün sayını təyin edir.",
      "tokens": {"D": "kökün sayını verən ədəd"},
      "check": {
        "ask": "D nə çıxır?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "SQUARE_FORGOTTEN",
      "hint": "Əvvəlcə (−5)² = 25, sonra 24 çıx."
    },
    {
      "index": 3,
      "title": "Kökləri yoxla",
      "explanation": "Tapdığın kökü ilkin tənlikdə yerinə qoy. Nəticə sıfır verirsə kök doğrudur.",
      "latex": "x^2-5x+6",
      "why": "Yoxlama düsturun yadda saxlanmasını yox, tənliyin mənasını sınayır: kök — bərabərliyi doğru edən ədəddir.",
      "check": {
        "ask": "x = 3 qoyanda sol tərəf nə verir?",
        "accept": ["0"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "9 − 15 + 6 hesabla — nəticə sıfır olmalıdır."
    }
  ]
}
```
