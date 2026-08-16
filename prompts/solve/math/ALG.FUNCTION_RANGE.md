# ALG.FUNCTION_RANGE — funksiyanın qiymət çoxluğu

Tərif oblastı ilə qiymət oblastını qarışdırmamaq. Sadə kvadrat funksiya nümunəsi.

## Nümunə

```
{
  "schema_version": 1,
  "canonical": "f(x)=x^2+1 funksiyasının qiymət çoxluğu (x∈R)",
  "problem_type": "formula",
  "subject": "math",
  "grade": 10,
  "topic_code": "ALG.FUNCTION_RANGE",
  "detected_language": "az",
  "final_answer": {
    "latex": "[1;+\\infty)",
    "values": ["[1;+∞)"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Minimumu tap",
      "explanation": "x² ≥ 0 olduğu üçün x²+1 ≥ 1. Ən kiçik qiymət x=0-da alınır.",
      "latex": "f(0)=1",
      "why": "Qiymət çoxluğu — funksiyanın çıxış dəyərləridir, giriş (tərif) oblastı deyil.",
      "check": {
        "ask": "f-nin ən kiçik qiyməti neçədir?",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "x² heç vaxt mənfi olmur."
    },
    {
      "index": 2,
      "title": "Qiymət çoxluğunu yaz",
      "explanation": "f bütün [1;+∞) qiymətlərini alır — yuxarı sərhəd yoxdur.",
      "latex": "E(f)=[1;+\\infty)",
      "why": "Yoxlama: f(x)=3 üçün x=±√2 həqiqi kök var.",
      "check": {
        "ask": "f(x)=3 tənliyinin həqiqi kökü varmı? (bəli=1, xeyr=0)",
        "accept": ["1"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "3≥1 olduğu üçün kök olmalıdır."
    }
  ]
}
```
