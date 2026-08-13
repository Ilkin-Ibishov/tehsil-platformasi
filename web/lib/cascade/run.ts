// Kaskadın ORKESTRATORU — ClickUp 86eykj7tu / ADR-020.
//
// Bu fayl qatların SIRASINI saxlayan YEGANƏ yerdir. Yeni qat əlavə etmək = `SolveLayer`
// tipini ödəyən modul yazmaq + aşağıdaki massivə düzgün yerdə qoymaq. `/api/solve`, klient
// və telemetriya TOXUNULMUR — taskın "interfeys" tələbi məhz bunu nəzərdə tutur.
//
// ═══ QATLARIN VƏZİYYƏTİ (taskın cədvəli) ═══
//
//   Qat 1  şəkil → transkripsiya       1 vision çağırışı   ~1 s     QURULDU (transcribe.ts,
//                                                                   kaskaddan AYRI çağırılır —
//                                                                   o, şəkil alır, bu qatlar mətn)
//   Qat 2  canonical_hash / rəqəm izi  LLM YOX             <100 ms  QURULDU (bank.ts)
//   Qat 3  şablona oturur → generasiya LLM YOX             ~300 ms  YOX — aşağıdaki qeyd
//   Qat 4  sympy həll edir, LLM izah   yalnız izah         ~3 s     YOX — aşağıdaki qeyd
//   Qat 5  tam həll (mətn üzərində)    tam                 ~10 s    QURULDU (solve-text.ts)
//
// ═══ NİYƏ QAT 3 VƏ 4 BURADA YOXDUR ═══
//
// Qəsdən. Taskın özü onları "sonra"/"tezliklə" kimi işarələyir və hər ikisi bu qatın
// ölçüsündən BÖYÜK ayrı işdir:
//   Qat 3 — `app.store_generated_steps` RPC-si (`0037`) MÖVCUDDUR, amma şablon TANINMASI
//           (hansı canonical hansı şablona oturur) yoxdur — `0038`-in şablonları SQL-də
//           generasiya edilib, TS tərəfdə tanıyıcı yazılmayıb.
//   Qat 4 — sympy SERVERDƏ YOXDUR. `scripts/lib/verify.py` python-dur, `web/lib/verify/
//           answer.ts` isə onun MƏHDUD portudur (yalnız tək dəyişənli tənlik krossyoxlaması,
//           bax route.ts-dəki `verified === null` şərhi). "Cavabı sympy tapır" tələbi
//           python xidməti və ya WASM sympy qərarı deməkdir — ADR tələb edir.
// Boş TODO qoymaq CLAUDE.md qayda 4-ün pozulmasıdır; ona görə qatlar sadəcə massivdə YOXDUR
// və HANDOFF-a yazılır.

import type { Pool } from "pg";
import { makeBankLayers } from "./bank";
import { makeTextSolveLayer } from "./solve-text";
import type { CascadeContext, LayerSolution, SolveLayer } from "./types";

export function buildLayers(pool: Pool): SolveLayer[] {
  return [
    // Sıra UCUZDAN BAHAYA — `ARCHITECTURE.md`-in uyğunlaşdırma sırası.
    ...makeBankLayers(pool), // Qat 2a: hash, Qat 2b: fingerprint
    // ← Qat 3 (şablon) BURAYA girir
    // ← Qat 4 (sympy + izah) BURAYA girir
    makeTextSolveLayer(), // Qat 5
  ];
}

export type CascadeRun = {
  solution: LayerSolution | null;
  // Hansı qatlar cəhd edildi və imtina etdi — telemetriya üçün. Qat paylanması ölçülməsə,
  // hansı qata investisiya etmək lazım olduğu bilinmir (taskın açıq tələbi).
  declinedLayers: string[];
};

export async function runCascade(layers: SolveLayer[], ctx: CascadeContext): Promise<CascadeRun> {
  const declinedLayers: string[] = [];

  for (const layer of layers) {
    if (ctx.signal?.aborted) break;
    let solution: LayerSolution | null;
    try {
      solution = await layer.run(ctx);
    } catch (err) {
      // Bir qatın XƏTASI kaskadı dayandırmır — növbəti qat cəhd edilir. Səbəb: Qat 2-nin DB
      // sorğusu qırılsa (grant regresiyası, gate-78/T1 kimi) şagird həll ALMALIDIR, sadəcə
      // bahalı yolla. Xəta LOGA düşür ki, səssiz deqradasiya olmasın.
      console.error(`[cascade] '${layer.id}' qatı xəta verdi, növbətiyə keçilir:`, err);
      declinedLayers.push(`${layer.id}:error`);
      continue;
    }
    if (solution) return { solution, declinedLayers };
    declinedLayers.push(layer.id);
  }

  return { solution: null, declinedLayers };
}
