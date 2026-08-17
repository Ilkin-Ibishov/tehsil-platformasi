# ALG.LINEAR_EQUATION — xətti tənlik

`math.md` nümunə 2 qrafiksiz `3x=12` qalır (visual yox). Bu mövzu faylı DİM ox
kəsişməsini göstərir — qrafik kömək edir, ona görə `visual.kind=linear`.

## Əlavə qaydalar

```
y=kx+b qrafiki / ox kəsişməsi varsa visual YAZ: {"kind":"linear","k":…,"b":…} (ədəd).
3x=12 kimi qrafiksiz tənlikdə visual YAZMA. SVG/path YOX. kəsişməni yenidən yoxlamaq dövri +0 (qayda 8/15).
```

## Nümunə

```
{
  "schema_version": 2,
  "canonical": "y=kx+b qrafiki x-oxunu (5;0), y-oxunu (0;−5) nöqtəsində kəsir. k+b tap.",
  "problem_type": "formula",
  "subject": "math",
  "grade": 9,
  "topic_code": "ALG.LINEAR_EQUATION",
  "detected_language": "az",
  "visual": {"kind": "linear", "k": 1, "b": -5},
  "final_answer": {
    "latex": "k+b=-4",
    "values": ["-4"]
  },
  "steps": [
    {
      "index": 1,
      "title": "y-kəsişməsindən b-ni oxu",
      "explanation": "Qrafik y-oxunu (0;−5)-də kəsir — bu, b əmsalıdır.",
      "latex": "b=-5",
      "why": "y=kx+b-də x=0 olanda y=b — y-kəsişməsi birbaşa b-dir.",
      "check": {
        "ask": "y-oxunu kəsən nöqtənin y-i neçədir?",
        "accept": ["-5", "−5"],
        "input_kind": "number"
      },
      "error_code": "COEFFICIENT_READ",
      "hint": "(0;−5) nöqtəsində y-koordinat b-dir."
    },
    {
      "index": 2,
      "title": "x-kəsişməsindən k-nı tap",
      "explanation": "x-oxunu (5;0) kəsir. 0=k·5+b düsturunda b-ni qoy, k-nı tap.",
      "latex": "0=5k+b",
      "why": "x-kəsişməsində y=0. b artıq məlumdur — bir tənlik, bir naməlum.",
      "check": {
        "ask": "b=−5 olanda 5k nəyə bərabərdir?",
        "accept": ["5"],
        "input_kind": "number"
      },
      "error_code": "SIGN_LOST",
      "hint": "0=5k+(−5) → 5k=5."
    },
    {
      "index": 3,
      "title": "k ilə b-nin cəmini tap",
      "explanation": "Məsələ k+b istəyir. Tapdığın k ilə b-ni topla. Kəsişməni yenidən yoxlamaq dövri olardı.",
      "latex": "k+b",
      "why": "Cəm yeni keçiddir. Eyni kəsişməyə qayıtmaq qayda 8-ə görə yoxlama sayılmır.",
      "check": {
        "ask": "k ilə b-nin cəmi neçədir?",
        "accept": ["-4", "−4"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "Müsbət və mənfini topla."
    }
  ]
}
```
