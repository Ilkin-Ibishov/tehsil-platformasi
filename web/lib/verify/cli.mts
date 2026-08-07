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

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

const raw = await readStdin();
const { canonical, values } = JSON.parse(raw) as { canonical: string; values: string[] };
const verified = equationCrossCheck(canonical, values);
process.stdout.write(JSON.stringify({ verified }));
