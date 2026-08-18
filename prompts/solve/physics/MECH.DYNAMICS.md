# MECH.DYNAMICS — dinamika

Nyutonun II qanunu. Qüvvə oxları görünəndə `visual.kind=force_diagram`.
`values` vahidsiz; vahid `latex`-də (E1.2).
Son ədəd `explanation`/`latex`-də yoxdur — `check.ask` istəyir (E1.7).

## Əlavə qaydalar

```
F=ma / sərbəst cisim üçün visual YAZ: {"kind":"force_diagram","body":"m","forces":[{"label":"F","dir_deg":0,"rel":1}]}.
dir_deg: 0=sağ, 90=yuxarı. SVG/path YOX. verified yazma (server null).
explanation/latex "6 N" yazmır; check.ask "2·3 neçədir?"
```

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "m=2 kg, a=3 m/s^2. F tap. (F=ma)",
  "problem_type": "formula",
  "subject": "physics",
  "grade": 9,
  "topic_code": "MECH.DYNAMICS",
  "detected_language": "az",
  "visual": {
    "kind": "force_diagram",
    "body": "m",
    "forces": [{"label": "F", "dir_deg": 0, "rel": 1}]
  },
  "final_answer": {
    "latex": "F = 6\\ \\mathrm{N}",
    "values": ["6"]
  },
  "steps": [
    {
      "index": 1,
      "title": "F = m a",
      "explanation": "Nəticəvi qüvvə kütlə ilə təcilin hasilidir. m və a-nı yerinə qoy.",
      "latex": "F=ma=2\\cdot 3",
      "check": {
        "ask": "2·3 neçədir?",
        "accept": ["6"],
        "input_kind": "number"
      },
      "error_code": "FORMULA_MISAPPLIED",
      "hint": "Nyuton: F=ma, vahid nyuton. Hasili izahda yazma."
    }
  ]
}
```
