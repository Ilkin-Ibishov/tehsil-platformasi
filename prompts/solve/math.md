# Fənn əlavəsi — riyaziyyat

`ADR-014` (HANDOFF 40): `prompts/solve/core.md` sxem/qaydaları daşıyır, bura fənnə xas nümunə
düşür — hazırda YALNIZ nümunə JSON-u, çünki fizika/kimya hələ ayrı nümunə tələb etmir
(subject sahəsi onsuz da `math|physics|chemistry` üçün dil-neytraldır, qaydalar dəyişmir).
`prompt_loader` bunu `core.md`-dəki `{{MATH_EXAMPLE}}` yer tutucusuna qoyur — mövzu faylı
yoxdursa fallback (`ADR-030`). `prompts/solve/math/{TOPIC_CODE}.md` varsa onun `Nümunə`
bloku bunu əvəz edir.

`ADR-015` Tapıntı 3b: TƏK nümunə (əvvəllər yalnız 3 addımlıq) modelə "addım sayı budur"
siqnalı verirdi — DB-də ölçülmüş 7 real həllin 6-sı 4 addım idi, sxem 2–6-ya icazə versə də.
v11 (86eyn28kq): birinci nümunə **1 addımlıq** (`5+5`) — əks halda model qayda 3/nümunəyə
uyğun süni ikinci addım doldurur. Sonra 2 addım + 6 addım. `core.md` qayda 15 addım sayının
**mexaniki hesablanmasını** tələb edir. v12: qayda 15 +1 yalnız dövri olmayan yoxlamada
(`y=kx+b` kəsişməsini yenidən yoxlamaq +0) — nümunə JSON-ları dəyişməyib.

`extract_example_json` (schema/struktur invariant testi) HƏMİŞƏ İLK JSON obyektini oxuyur —
ona görə 1-ci nümunə (1 addım) sxemə görə TAM VALİD olmalıdır, qalanları ayrıca əl ilə yoxlanılıb.

E2.4: bu üç nümunədə `visual` YOXDUR — qrafik kömək etmir (cəm, 3x=12, sahə mətni).
DİM kəsişmə / parabola / ədəd oxu üçün `core.md` kompakt kind nümunələri + mövzu faylları.

## Nümunə

```
// Nümunə 1 — TƏK KEÇİD (1 addım, mənalı yoxlama YOXDUR)

{
  "schema_version": 2,
  "canonical": "5+5=?, cəm tapılmalıdır",
  "problem_type": "formula",
  "subject": "math",
  "grade": 5,
  "topic_code": "ARITH.ADDITION",
  "detected_language": "az",
  "final_answer": {
    "latex": "10",
    "values": ["10"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Ədədləri topla",
      "explanation": "Verilmiş iki ədədi topla.",
      "latex": "5+5",
      "why": "Tək keçidli cəmdə ayrı yoxlama addımı qurulmur — nəticənin özü cavabdır.",
      "check": {
        "ask": "5 ilə 5-in cəmi neçədir?",
        "accept": ["10"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "Onluq yoxdur — təklikləri birləşdir."
    }
  ]
}

// Nümunə 2 — SADƏ (2 addım: 1 riyazi keçid + yoxlama)

{
  "schema_version": 2,
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

// Nümunə 3 — MÜRƏKKƏB (6 addım: 5 riyazi keçid + yoxlama)

{
  "schema_version": 2,
  "canonical": "Sahəsi 40 m² olan düzbucaqlının uzunluğu enindən 3 m artıqdır. Düzbucaqlının uzunluğunu tap.",
  "problem_type": "word_problem",
  "subject": "math",
  "grade": 8,
  "topic_code": "ALG.QUADRATIC_EQUATION",
  "detected_language": "az",
  "final_answer": {
    "latex": "uzunluq = 8\\ m",
    "values": ["8"]
  },
  "steps": [
    {
      "index": 1,
      "title": "Tənliyi standart formaya gətir",
      "explanation": "En x olsun, onda uzunluq x+3-dür. Sahə düsturunu (en × uzunluq = 40) açıb standart kvadrat tənlik formasına gətir.",
      "latex": "x^2+3x-40=0",
      "why": "Diskriminant düsturu yalnız standart formada (ax²+bx+c=0) işləyir — əvvəlcə oraya gətirmək lazımdır.",
      "tokens": {"x": "düzbucaqlının eni"},
      "check": {
        "ask": "Sabit hədd (c) neçəyə bərabərdir?",
        "accept": ["-40", "−40"],
        "input_kind": "number"
      },
      "error_code": "SIGN_LOST",
      "hint": "40-ı sağdan sola keçirəndə işarəsi dəyişir."
    },
    {
      "index": 2,
      "title": "Diskriminantı hesabla",
      "explanation": "Diskriminant kökün sayını verir.",
      "latex": "D=b^2-4ac",
      "why": "D-nin işarəsi neçə həqiqi kök olduğunu göstərir — mənfi diskriminant həqiqi kök vermir.",
      "tokens": {"D": "kökün sayını verən ədəd"},
      "check": {
        "ask": "D nə çıxır?",
        "accept": ["169"],
        "input_kind": "number"
      },
      "error_code": "SQUARE_FORGOTTEN",
      "hint": "Əvvəlcə 3² = 9, sonra 4·1·(−40) = −160, D = 9 − (−160)."
    },
    {
      "index": 3,
      "title": "Diskriminantın kökünü tap",
      "explanation": "Kvadrat kök düsturu üçün √D lazımdır.",
      "latex": "\\sqrt{D}",
      "check": {
        "ask": "√D neçəyə bərabərdir?",
        "accept": ["13"],
        "input_kind": "number"
      },
      "error_code": "ARITHMETIC",
      "hint": "13² = 169 olduğunu yoxla."
    },
    {
      "index": 4,
      "title": "Kökləri hesabla",
      "explanation": "Kvadrat tənliyin düsturunu tətbiq et.",
      "latex": "x=\\frac{-b\\pm\\sqrt{D}}{2a}",
      "check": {
        "ask": "(−3+13)/2 neçəyə bərabərdir?",
        "accept": ["5"],
        "input_kind": "number"
      },
      "error_code": "ORDER_OF_OPS",
      "hint": "Əvvəlcə −3+13-ü hesabla, sonra 2-yə böl."
    },
    {
      "index": 5,
      "title": "Fiziki mənalı kökü seç",
      "explanation": "Tənliyin iki kökü var, amma en mənfi ola bilməz — məsələnin şərti kökləri süzgəcdən keçirir.",
      "why": "Riyazi tənliyin bütün kökləri məsələnin CAVABI olmaya bilər — şərtə uyğunluğu yoxlamaq addımın özüdür.",
      "check": {
        "ask": "En mənfi ola bilməzsə, iki kökdən (5 və −8) hansı uyğundur?",
        "accept": ["5"],
        "input_kind": "number"
      },
      "error_code": "SIGN_CHOICE",
      "hint": "Mənfi kökü at, en mənfi olmaz."
    },
    {
      "index": 6,
      "title": "Sahəni yoxla",
      "explanation": "Tapılan eni ilkin şərtdə yerinə qoy və sahənin həqiqətən 40 çıxdığını göstər.",
      "latex": "x(x+3)",
      "check": {
        "ask": "x = 5 qoyanda x(x+3) neçə verir?",
        "accept": ["40"],
        "input_kind": "number"
      },
      "error_code": "SUBSTITUTION_SKIPPED",
      "hint": "5 × 8 hesabla."
    }
  ]
}
```
