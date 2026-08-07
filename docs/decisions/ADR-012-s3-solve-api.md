# ADR-012 — S3 `/api/solve`: yoxlama məntiqi TS-ə köçürüldü, `attempts.device_id`, dəvət kodu paylaşılan sirdir

## Kontekst

`docs/PHASE-1.md` S3 üç şeyi tələb edir: (1) `/api/solve`-in real implementasiyası, (2)
`scripts/lib`-dəki `schema_check`/`verify`/`leak` məntiqinin TS-ə köçürülməsi VƏ YA Python
serverless funksiya kimi saxlanması — **amma iki fərqli implementasiya olmasın**, (3) dəvət
kodu + `device_id` üzrə serverdə gündəlik limit (30).

Üç arxitektur qərarı tələb olunurdu, hamısı bu ADR-də.

## Qərar 1 — yoxlama məntiqi: Python serverless YOX, TS port

**Seçim: TS-ə köçürüldü** (`web/lib/verify/`), Python serverless funksiya seçilmədi.

Səbəb: Vercel-in Python runtime-ı `web/`-dən (Root Directory) kənardakı `scripts/lib/*.py`-ı
funksiya bundle-ına daxil edib-etməyəcəyi sənədləşdirilməmiş/qeyri-müəyyəndir ("Python Vercel
Functions include all files from your project that are reachable at build time" — "project"
Root Directory-yə aiddirmi, repo kökünə aiddirmi aydın deyil). Bunu canlı deploy olmadan
yoxlamaq mümkün deyildi, bu sessiyada isə nə Vercel yazma girişi, nə canlı test şəraiti var idi.
Cross-runtime (Next.js → daxili Python funksiya HTTP çağırışı) `next dev`-də də işləməzdi —
yalnız `vercel dev` dəstəkləyir, S1a-dan bəri qurulmuş lokal iş axınını (`next dev`) pozardı.

**Nəticə — praktik dəyişiklik:** istehsalat yoxlaması (`equation_cross_check`) aşkarlandı ki,
əslində CAS-a (tam simvolik sadələşdirməyə) ehtiyac duymur — yekun yoxlama HƏMİŞƏ **ədədi**dir
(`residual.is_number` → `abs(complex(residual)) < 1e-6`). `sympy.simplify` yalnız simvolik
ifadəni ədədə endirmək üçün vasitə idi. Bu, `mathjs`-in `evaluate()`-i ilə (simvolu ədədi
qiymətlə əvəz edib iki tərəfi ədədi hesablamaq) funksional ekvivalentdir.

**Köçürülənlər (`web/lib/verify/`):**
- `schema.ts` — `ajv` (Draft-07) `docs/STEP-SCHEMA.json`-a qarşı. Mexaniki port, uyğunsuzluq riski yoxdur.
- `leak.ts` — `leak.py`-ın hərfi portu (regex sərhəd yoxlaması). Sympy-dən asılı deyil, riskiz.
- `answer.ts` — `verify.py`-ın YALNIZ istehsalatda işləyən yolu: `equation_cross_check` +
  `_value_satisfies`. `direct_compare` (golden-əsaslı 1-ci qat) köçürülmədi — istehsalatda
  `golden_values` heç vaxt yoxdur (yalnız eval harness-də mövcuddur), ona görə production path
  onsuz da həmişə `cross`-a düşürdü.

**Bilinən fərq (qeyd olunur, gizlədilmir):** sympy-nin `implicit_multiplication_application`
transformu (`5x` → `5*x`) mathjs-də yoxdur — regex-əsaslı ön emal (`5x`→`5*x`, `)x`→`)*x`)
əlavə edildi, amma bu, sympy-nin tam parser-i qədər davamlı deyil. Mürəkkəb ifadələrdə
(iç-içə funksiyalar, çoxdəyişənli tənliklər) sympy-dən fərqli nəticə verə bilər. Bu, `ADR-009`-un
xəbərdarlıq etdiyi sinifdəndir: **ölçünün özü** səhv olduqda model günahlandırılır. Tövsiyə:
S3 canlıya çıxdıqdan sonra ilk 30 həllin `verify_conflict`/`unreadable` nisbəti izlənməlidir —
gözlənilməz yüksəkdirsə, səbəb model deyil, bu port ola bilər.

`scripts/lib/*.py` **toxunulmadı** — eval harness dəyişmədi, iki müstəqil implementasiya
indi rəsmən mövcuddur (TS istehsalat, Python eval). Divergensiya riski qəbul edilir, çünki
alternativ (cross-runtime Python funksiya çağırışı) bu sessiyada yoxlanıla bilməyən daha
böyük risk idi.

## Qərar 2 — `attempts.device_id`, `user_id` yox

`docs/DATA-MODEL.md`-dəki `attempts` cədvəli `user_id fk` göstərir, amma **auth Faza 1-in
xaricindədir** (`docs/PHASE-1.md` → "Sahə daxilində/xaricində"). Gündəlik limit `device_id`
üzrə hesablanmalıdır (`events` cədvəlinin artıq işlətdiyi eyni model). `0002` miqrasiyası
`attempts.user_id`-ni **nullable** saxlayır (gələcək auth üçün) və `device_id uuid not null`
əlavə edir. Limit sorğusu: `completed=true` olan (yəni **çatdırılmış**) sətirlər sayılır —
`docs/PHASE-1.md` S5-in invariantına uyğun ("İmtina, seçim və kəsmə gündəlik limitdən sayılmır").

## Qərar 3 — dəvət kodu: tək paylaşılan sirr, cədvəl yox

Test qrupu 20 nəfərdir, `docs/PHASE-1.md`: "sadə paylaşılan kod". Per-user kod cədvəli
overengineering olardı. `INVITE_CODE` env dəyişəni (server-only) — `/api/solve`
`invite_code` form sahəsini bu dəyərlə müqayisə edir, uyğun olmasa `403`.

## Nəticə

`web/app/api/solve/route.ts` LLM çağırışını edir (`prompts/solve-step.md`-dən **fayldan**
oxunan prompt, `scripts/lib/prompt_loader.py` ilə eyni çıxarma məntiqi — TS portu),
sxem yoxlayır (bir dəfə retry), sympy-ekvivalent ədədi yoxlamadan keçirir, `problems`/
`solutions`/`attempts`-a yazır. `verified=false` və ya sxem etibarsızdırsa istifadəçiyə
`status: unreadable` qaytarılır (`docs/PHASE-1.md` server qaydası 1).
