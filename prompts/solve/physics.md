# Fənn əlavəsi — fizika

`ADR-014` / `ADR-026` / E1.3: `core.md` sxem/qaydaları daşıyır, bura fizika nümunəsi düşür.
`prompt_loader` bunu `{{MATH_EXAMPLE}}` yer tutucusuna qoyur — mövzu faylı yoxdursa fallback
(`ADR-030`). `prompts/solve/physics/{TOPIC_CODE}.md` varsa onun `Nümunə` bloku bunu əvəz edir.

E1.2: `final_answer.latex` vahid daşıyır, `values` vahidsiz ədəddir (yoxlama qatı vahidi
ayrı görür; `subject !== "math"` → `verified` həmişə `null`).

`extract_example_json` İLK JSON obyektini oxuyur — 1-ci nümunə sxemə TAM VALİD olmalıdır.

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "v_0=0, a=2 m/s^2, t=4 s. Yol tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 9,
  "topic_code": "MECH.KINEMATICS",
  "detected_language": "az",
  "final_answer": {
    "latex": "s = 16\\ \\mathrm{m}",
    "values": ["16"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Düsturu yaz",
      "explanation": "Başlanğıc sürət sıfırdır. Yol s = v_0 t + a t^2 / 2 = a t^2 / 2.",
      "latex": "s=\\frac{1}{2}at^2",
      "why": "Bərabərtəcilli hərəkətdə v_0=0 olanda xətti hədd düşür.",
      "check": {
        "ask": "a t^2 / 2-də a neçədir?",
        "accept": ["2"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Təcil 2 m/s² — vahidi values-ə yazma."
    },
    {
      "index": 2,
      "title": "Rəqəmləri yerinə qoy",
      "explanation": "s = (1/2)·2·16 = 16 m. Vahid lateksdə qalır; values yalnız 16.",
      "latex": "s=16\\ \\mathrm{m}",
      "why": "Yoxlama: vahidsiz 16, çünki server vahidi ayırır (E1.2).",
      "check": {
        "ask": "v_0=0, a=2, t=4 qoyanda s neçədir?",
        "accept": ["16"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "4²=16; yarısı ilə 2-nin hasili 16."
    }
  ]
}
```
