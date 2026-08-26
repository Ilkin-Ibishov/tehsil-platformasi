// Selftest for extractInviteCodeFromSearch and URL sanitization
// Usage: npx tsx lib/invite/url.selftest.mts

import { extractInviteCodeFromSearch, validateAndStoreInviteCode } from "./url.ts";

const CASES: [string, string | null][] = [
  ["?invite=ILKIN2026", "ILKIN2026"],
  ["?code=TEST1234", "TEST1234"],
  ["?invite_code=SOAK_AUTO_2026", "SOAK_AUTO_2026"],
  ["?utm_source=telegram&invite=ILKIN2026", "ILKIN2026"],
  ["?invite=ILKIN2026.", "ILKIN2026"], // trailing dot from message
  ["?invite=ILKIN2026,", "ILKIN2026"], // trailing comma
  ["?invite=ILKIN2026!", "ILKIN2026"], // trailing exclamation
  ["?invite=%20SPACED%20", "SPACED"], // percent-encoded space
  ["?invite=   ", null], // empty after trim
  ["?invite=", null], // empty param
  ["", null], // no query
  ["?foo=bar", null], // unrelated param
  ["?invite=" + "A".repeat(100), null], // exceeds max length (64)
];

let fails = 0;
for (const [search, expected] of CASES) {
  const got = extractInviteCodeFromSearch(search);
  const ok = got === expected;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(search)} -> ${JSON.stringify(got)} (expected ${JSON.stringify(expected)})`);
}

if (fails > 0) {
  console.error(`\n${fails}/${CASES.length} invite URL selftests failed.`);
  process.exit(1);
}
console.log(`\n${CASES.length}/${CASES.length} invite URL extract selftests passed.`);

const origFetch = globalThis.fetch;
const bodies: unknown[] = [];
globalThis.fetch = (async (_url: string, init?: { body?: string }) => {
  bodies.push(JSON.parse(String(init?.body ?? "{}")));
  return { ok: true } as Response;
}) as typeof fetch;

const ok = await validateAndStoreInviteCode("invite01", "dev-abc");
const body = bodies[0] as { invite_code?: string; device_id?: string };
const bodyOk = body?.invite_code === "invite01" && body?.device_id === "dev-abc";
if (!bodyOk) fails++;
console.log(`${bodyOk ? "PASS" : "FAIL"}  validate body has invite_code+device_id -> ${JSON.stringify(body)}`);
const okPass = ok === "ok";
if (!okPass) fails++;
console.log(`${okPass ? "PASS" : "FAIL"}  validate 200 returns ok`);

bodies.length = 0;
globalThis.fetch = (async () => ({ ok: false, status: 403 }) as Response) as typeof fetch;
const rejected = await validateAndStoreInviteCode("bad", "dev-abc");
const rejectOk = rejected === "invalid";
if (!rejectOk) fails++;
console.log(`${rejectOk ? "PASS" : "FAIL"}  validate 403 returns invalid`);

globalThis.fetch = (async () => ({ ok: false, status: 409 }) as Response) as typeof fetch;
const used = await validateAndStoreInviteCode("invite01", "other-dev");
const usedOk = used === "already_used";
if (!usedOk) fails++;
console.log(`${usedOk ? "PASS" : "FAIL"}  validate 409 returns already_used`);

globalThis.fetch = (async () => {
  throw new Error("offline");
}) as typeof fetch;
const net = await validateAndStoreInviteCode("invite01", "dev-abc");
const netOk = net === "network";
if (!netOk) fails++;
console.log(`${netOk ? "PASS" : "FAIL"}  validate fetch throw returns network`);

globalThis.fetch = origFetch;

if (fails > 0) {
  console.error(`\ninvite URL selftests failed.`);
  process.exit(1);
}
console.log(`invite URL selftests passed.`);
