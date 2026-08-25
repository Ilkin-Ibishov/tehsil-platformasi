import {
  getStoredProfile,
  saveProfile,
  getHistoryItems,
  saveHistoryItem,
  getProgressReport,
  recordErrorCode,
} from "./storage.ts";

let fails = 0;

function check(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${JSON.stringify(got)} (gözlənilən ${JSON.stringify(expected)})`);
}

const initial = getStoredProfile();
check("initial grade default", typeof initial.grade, "number");
check("initial locale default", initial.locale, "az");
check("initial visual tone", initial.grade <= 8 ? "genc" : "yetkin", initial.visualTone);

const updated = saveProfile({
  fullName: "Aysel Məmmədova",
  grade: 6,
  role: "valideyn",
  pedagogicalTone: "dostyana",
  goal: "buraxilis",
  onboarded: true,
});
check("updated fullName", updated.fullName, "Aysel Məmmədova");
check("updated grade", updated.grade, 6);
check("updated role", updated.role, "valideyn");
check("updated ped tone", updated.pedagogicalTone, "dostyana");
check("updated goal", updated.goal, "buraxilis");
check("updated onboarded", updated.onboarded, true);
check("visual tone from grade 6", updated.visualTone, "genc");

saveHistoryItem({
  id: "test_attempt_1",
  topicCode: "ALG.LINEAR_EQUATION",
  topicTitle: "Xətti tənlik",
  canonical: "5x + 3 = 18",
  stepsCount: 3,
  errorCodesCount: 0,
  timestamp: Date.now(),
  completed: true,
});
const history = getHistoryItems();
check("history item saved", history.length >= 1 && history[0].id === "test_attempt_1", true);

recordErrorCode("SIGN_LOST");
recordErrorCode("SIGN_LOST");
recordErrorCode("ARITHMETIC");

const report = getProgressReport();
check("report totalSolves positive", report.totalSolves >= 1, true);
check("report has SIGN_LOST", report.repeatedErrors.some((e) => e.code === "SIGN_LOST" && e.count >= 2), true);
check("report topicMasteries length", report.topicMasteries.length >= 1, true);
check("report weeklyActivity has 7 days", report.weeklyActivity.length, 7);

console.log(fails === 0 ? "\nProfile storage selftest keçdi." : `\n${fails} test uğursuz.`);
process.exit(fails === 0 ? 0 : 1);
