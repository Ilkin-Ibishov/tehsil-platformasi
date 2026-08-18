# Fənn əlavəsi — fizika

`ADR-014` / `ADR-026` / E1.3: `core.md` sxem/qaydaları daşıyır, bura fizika nümunəsi düşür.
`prompt_loader` bunu `{{MATH_EXAMPLE}}` yer tutucusuna qoyur — mövzu faylı yoxdursa fallback
(`ADR-030`). `prompts/solve/physics/{TOPIC_CODE}.md` varsa onun `Nümunə` bloku bunu əvəz edir.

E1.2: `final_answer.latex` vahid daşıyır, `values` vahidsiz ədəddir (yoxlama qatı vahidi
ayrı görür; `subject !== "math"` → `verified` həmişə `null`).

E1.7: fizika həlli düstur → yerinəqoyma → ədəd gedir. `explanation` və `latex` son ədədi
VERMİR — onu `check.ask` şagirddən istəyir. Əks halda leak 17% (riyaziyyat qapısı 0%).

`extract_example_json` İLK JSON obyektini oxuyur — 1-ci nümunə sxemə TAM VALİD olmalıdır.

## Əlavə qaydalar

```
Sızma qadağası (fizika): addımın explanation VƏ latex sahəsi son ədədi VERMİR.
Son rəqəm yalnız check.ask-də şagirddən istənilir. Vahidli "20 m/s" ilə vahidsiz "20" eyni sızmadır.
Pis:  explanation "s=16 m" / latex "s=16\\mathrm{m}"
Yaxşı: latex "s=\\frac12 a t^2" və ya "s=\\frac12\\cdot2\\cdot4^2"; check.ask "a=2, t=4 qoyanda s neçədir?"
values vahidsiz qalır (E1.2). verified yazma.
Nisbət/bərabərlik cavabı values-də tək "1" OLMAZ — "nu1=nu2" yaz. Tomson 1/(2π√(LC)) izahda "1" sızmasıdır; düsturu yalnız latex-ə qoy.
topic_code dəqiq: MECH.MOMENTUM_CONSERVATION → MECH.MOMENTUM; PHYS.SELF_INDUCTION / MAG.INDUCTANCE / PHYS.MAGNETIC_ENERGY → ELEC.INDUCTION. Uydurma kod yazma.
```

## Nümunə

```
// Nümunə 1 — kinematika, tək keçid (son ədəd yalnız check.ask-də)

{
  "schema_version": 2,
  "canonical": "v_0=0, a=4 m/s^2, t=3 s. Yol tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 9,
  "topic_code": "MECH.KINEMATICS",
  "detected_language": "az",
  "final_answer": {
    "latex": "s = 18\\ \\mathrm{m}",
    "values": ["18"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Düsturu yaz, rəqəmləri qoy",
      "explanation": "Başlanğıc sürət sıfırdır. Yol s = a t^2 / 2. a və t-ni yerinə qoy, hasili şagird hesabla.",
      "latex": "s=\\frac{1}{2}a t^2=\\frac{1}{2}\\cdot 4\\cdot 3^{2}",
      "why": "Bərabərtəcilli hərəkətdə v_0=0 olanda xətti hədd düşür. Son ədəd explanation/latex-də yoxdur.",
      "check": {
        "ask": "a=4, t=3 qoyanda s neçədir?",
        "accept": ["18"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Əvvəl t^2, sonra yarısı ilə a-nın hasili. Vahidi values-ə yazma."
    }
  ]
}

// Nümunə 2 — dalğa (örtülməmiş mövzu fallback)

{
  "schema_version": 2,
  "canonical": "v=300 m/s, λ=4 m. Tezliyi tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MECH.WAVES",
  "detected_language": "az",
  "final_answer": {
    "latex": "f = 75\\ \\mathrm{Hz}",
    "values": ["75"]
  },
  "steps": [
    {
      "index": 1,
      "title": "f = v / λ",
      "explanation": "Tezlik sürətin dalğa uzunluğuna nisbətidir. v və λ-nı yerinə qoy.",
      "latex": "f=\\frac{v}{\\lambda}=\\frac{300}{4}",
      "check": {
        "ask": "300-ü 4-ə böləndə f neçədir?",
        "accept": ["75"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "f=v/λ, vahid herts. Son ədədi izahda yazma."
    }
  ]
}

// Nümunə 3 — hidrostatika

{
  "schema_version": 2,
  "canonical": "Maye sütunu ρ, h. Təzyiq p=ρgh; g=10. p-ni ρh ilə tap.",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "MECH.HYDROSTATICS",
  "detected_language": "az",
  "final_answer": {
    "latex": "p = 10\\rho h",
    "values": ["10"]
  },
  "steps": [
    {
      "index": 1,
      "title": "p = ρ g h",
      "explanation": "Hidrostatik təzyiq sıxlıq, g və hündürlüyün hasilidir. g-ni yerinə qoy.",
      "latex": "p=\\rho g h=\\rho\\cdot 10\\cdot h",
      "check": {
        "ask": "g=10 olanda p neçə ρh-dir?",
        "accept": ["10"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "p=ρgh, g=10. Əmsalı check.ask istəyir."
    }
  ]
}

// Nümunə 4 — termodinamikanın I qanunu

{
  "schema_version": 2,
  "canonical": "Q=800 J, A=200 J. ΔU tap (I qanun).",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 11,
  "topic_code": "THERMO.FIRST_LAW",
  "detected_language": "az",
  "final_answer": {
    "latex": "\\Delta U = 600\\ \\mathrm{J}",
    "values": ["600"]
  },
  "steps": [
    {
      "index": 1,
      "title": "ΔU = Q − A",
      "explanation": "Daxili enerjinin dəyişməsi alınan istilikdən görülən iş çıxılır. Q və A-nı yerinə qoy.",
      "latex": "\\Delta U=Q-A=800-200",
      "check": {
        "ask": "800−200 neçədir?",
        "accept": ["600"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "I qanun: ΔU=Q−A. Fərqi şagird hesabla."
    }
  ]
}
```
