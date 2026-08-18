# Fizika həll promptları

`ADR-026` / E1.3 + E1.8: `prompts/solve/physics.md` fənn nümunəsi + mövzu faylları
(`MECH.*`, `THERMO.*`, `ELEC.*`, `MAG.*`, `EM.*`, `OPT.REFRACTION`). Loader
`physics.md` tapanda `math.md`-ə düşmür — `prompt.subject_fallback` yazılmır.
`visual` nümunəsi: `MECH.DYNAMICS` → `force_diagram`. `MECH.KINEMATICS` tək-ədəd
nümunəsində visual YOX. Naməlum kind serverdə atılır, həll qalır.

E1.7: `physics.md` `## Əlavə qaydalar` sızma intizamını daşıyır və mövzu faylı ilə
BİRLEŞİR. Yeni kodlar da eyni qayda ilə yazılıb (E1.8).
