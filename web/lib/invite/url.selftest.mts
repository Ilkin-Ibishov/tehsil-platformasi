// Selftest for extractInviteCodeFromSearch and URL sanitization
// Usage: npx tsx lib/invite/url.selftest.mts

import { extractInviteCodeFromSearch } from "./url.ts";

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
} else {
  console.log(`\n${CASES.length}/${CASES.length} invite URL selftests passed.`);
}
