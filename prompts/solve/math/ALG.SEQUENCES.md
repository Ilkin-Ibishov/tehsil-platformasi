# ALG.SEQUENCES — ardıcıllıq (ümumi hədd)

n-ci hədd düsturunu ədədlə yoxla. Proqressiya düsturunu kor-koranə yazma.
Tək `a_n` ədədi qrafik tələb etmir — bu nümunədə `visual` YOXDUR.

## Əlavə qaydalar

```
Interval / bərabərsizlik / açıq-qapalı nöqtə oxda kömək edirsə visual YAZ:
{"kind":"number_line","min":…,"max":…,"points":[{"x":…,"label":"A","open":false}]}.
Tək a_n tapmaq üçün visual YAZMA. SVG/path YOX. Naməlum kind UYDURMA.
```

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "a_n=2n+1; a_5-i tap",
  "problem_type": "formula",
  "subject": "math",
  "grade": 9,
  "topic_code": "ALG.SEQUENCES",
  "detected_language": "az",
  "final_answer": {
    "latex": "11",
    "values": ["11"]
  },
  "steps": [
    {
      "index": 1,
      "title": "n=5 qoy",
      "explanation": "Ümumi hədd düsturunda n-i 5 ilə əvəz et.",
      "latex": "a_5=2\\cdot5+1",
      "why": "Ardıcıllığın n-ci həddi düsturun birbaşa tətbiqidir.",
      "check": {
        "ask": "2·5+1 neçədir?",
        "accept": ["11"],
        "input_kind": "number"
      },
      "error_code": "ORDER_OF_OPS",
      "hint": "Əvvəl vur, sonra topla."
    },
    {
      "index": 2,
      "title": "Əvvəlki həddlələ yoxla",
      "explanation": "a_1=3, a_2=5, a_3=7 — hər addımda +2; a_5=11 uyğundur.",
      "latex": "3,5,7,9,11",
      "why": "Düstur səhvdirsə kiçik n-lər də səhv çıxar.",
      "check": {
        "ask": "a_1 neçədir?",
        "accept": ["3"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "n=1 qoy: 2·1+1."
    }
  ]
}
```
