import { checkInviteCode, getAllValidInviteCodes } from "./guards.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

// 1. Check all built-in pilot invites exist
const all = getAllValidInviteCodes();
check("contains invite01", all.has("invite01"), true);
check("contains invite02", all.has("invite02"), true);
check("contains invite20", all.has("invite20"), true);
check("contains ilkin-01", all.has("ilkin-01"), true);
check("contains soak-dim-01", all.has("soak-dim-01"), true);
check("contains test-01", all.has("test-01"), true);

// 2. Case-insensitivity & trimming
check("check lowercase invite01", checkInviteCode("invite01"), { ok: true, studentRef: "invite01" });
check("check UPPERCASE INVITE01", checkInviteCode("INVITE01"), { ok: true, studentRef: "invite01" });
check("check mixed case InViTe02", checkInviteCode("InViTe02"), { ok: true, studentRef: "invite02" });
check("check with whitespace '  invite03  '", checkInviteCode("  invite03  "), { ok: true, studentRef: "invite03" });

// 3. Invalid codes rejected
check("check invalid code 'bad_code'", checkInviteCode("bad_code"), { ok: false });
check("check empty string", checkInviteCode(""), { ok: false });
check("check non-string", checkInviteCode(123), { ok: false });

console.log(fails === 0 ? "\nGuards invite selftest keçdi." : `\n${fails} test uğursuz.`);
process.exit(fails === 0 ? 0 : 1);
