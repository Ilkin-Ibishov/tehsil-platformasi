// npx tsx web/lib/crop-box.selftest.mts
import { FULL_FRAME_CROP_BOX, STUDENT_CROP_BOX, initialCropBox } from "./crop-box.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

check("şagird: tarixi dar çərçivə", initialCropBox({ soak: false }), STUDENT_CROP_BOX);
check("soak: tam kadr", initialCropBox({ soak: true }), FULL_FRAME_CROP_BOX);
check("şagird nisbəti 0.8/0.44", Number((STUDENT_CROP_BOX.w / STUDENT_CROP_BOX.h).toFixed(3)), 1.818);
check("soak nisbəti 1", FULL_FRAME_CROP_BOX.w / FULL_FRAME_CROP_BOX.h, 1);

if (fails) {
  console.log(`\n${fails} uğursuz.`);
  process.exit(1);
}
console.log("\nOK");
