// scripts/eval.py-in çağırdığı komanda sətri interfeysi (ADR-012 Qərar 4 yeniləməsi).
// TƏK MƏQSƏD: eval-ın `equation_cross_check`-i istehsalatla EYNİ TS koddan (`answer.ts`) alması —
// PHASE-1 S3-ün "iki fərqli implementasiya olmasın" tələbini artıq HƏQİQƏTƏN yerinə yetirir
// (əvvəllər ADR-012 bunu "qəbul edilmiş risk" kimi yazmışdı, indi bağlanır).
//
// stdin-dən JSON oxuyur: {"canonical": "...", "values": ["..."]}
// stdout-a JSON yazır: {"verified": true|false|null}
//
// `direct_compare` (golden-əsaslı, yalnız eval-a aiddir) BURAYA daxil edilmir — istehsalatda
// heç vaxt golden_values olmur, ona görə divergensiya riski onda yoxdur (ADR-012, Qərar 1).

import { equationCrossCheck } from "./answer.ts";
import { createInterface } from "node:readline";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

function handle(line: string): string {
  try {
    const { canonical, values } = JSON.parse(line) as { canonical: string; values: string[] };
    return JSON.stringify({ verified: equationCrossCheck(canonical, values) });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
}

// --server: davamlı rejim. NDJSON — hər sətir bir sorğu, hər sətir bir cavab.
// Səbəb: hər element üçün ayrı Node prosesi qaldırmaq ~1 san/çağırış idi və ilk
// (soyuq) çağırış 15 san timeout-u keçirdi — harness səssizcə sınıq qalırdı.
if (process.argv.includes("--server")) {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    process.stdout.write(handle(line) + "\n");
  }
} else {
  process.stdout.write(handle(await readStdin()));
}
