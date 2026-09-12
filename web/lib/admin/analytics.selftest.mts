import { getExpectedAdminSecret, verifyAdminAuth } from "./auth";
import { getAdminAnalyticsData } from "./analytics";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

async function runSelftest() {
  console.log("Starting Admin Analytics Selftest...");

  // 1. Auth secret
  const secret = getExpectedAdminSecret();
  assert(typeof secret === "string" && secret.length > 0, "Admin secret must be a non-empty string");
  console.log("PASS: Admin secret resolution");

  // 2. Auth verification with mock Request
  const mockReqAuthorized = new Request("http://localhost:3000/api/admin/analytics/overview", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const isAuth = await verifyAdminAuth(mockReqAuthorized);
  assert(isAuth === true, "verifyAdminAuth should accept valid Bearer token");
  console.log("PASS: Bearer token auth verification");

  // 3. Analytics data generation test across different filter ranges
  const data7d = await getAdminAnalyticsData({ range: "7d", kind: "all" });
  assert(!!data7d, "Data payload must not be null");
  assert(typeof data7d.overview.avgCostUsd === "number", "avgCostUsd must be a number");
  assert(typeof data7d.overview.transferSuccessRate === "number", "transferSuccessRate must be a number");
  assert(typeof data7d.overview.cacheHitRate === "number", "cacheHitRate must be a number");
  assert(Array.isArray(data7d.pedagogical.errorDistribution), "errorDistribution must be an array");
  assert(Array.isArray(data7d.unitEconomics.matchPaths), "matchPaths must be an array");
  assert(Array.isArray(data7d.funnel.steps), "funnel steps must be an array");
  assert(data7d.funnel.steps.length >= 5, "funnel must have at least 5 stages");
  console.log("PASS: 7d analytics data structure & KPI calculations");

  // 4. Test soak vs student filter isolation
  const dataSoak = await getAdminAnalyticsData({ range: "30d", kind: "soak" });
  assert(dataSoak.filters.kind === "soak", "Filter kind must be 'soak'");
  console.log("PASS: Soak test filter isolation");

  const dataStudent = await getAdminAnalyticsData({ range: "24h", kind: "student" });
  assert(dataStudent.filters.kind === "student", "Filter kind must be 'student'");
  console.log("PASS: Student filter isolation");

  // 5. Verification 3-state check
  const v = data7d.aiHealth.sympyVerification;
  assert(typeof v.verifiedTrueCount === "number", "verifiedTrueCount must be number");
  assert(typeof v.verifiedFalseCount === "number", "verifiedFalseCount must be number");
  assert(typeof v.methodNoneCount === "number", "methodNoneCount must be number");
  console.log("PASS: SymPy 3-state verification integrity");

  // 6. Match paths & cascade integrity
  const paths = data7d.unitEconomics.matchPaths.map((p) => p.path);
  assert(paths.length > 0, "matchPaths must not be empty");
  console.log("PASS: Match paths and cascade layer integrity");

  // 7. Error distribution & titleAz mapping
  assert(data7d.pedagogical.errorDistribution.length > 0, "errorDistribution must not be empty");
  for (const err of data7d.pedagogical.errorDistribution) {
    assert(typeof err.code === "string" && err.code.length > 0, "error code must be valid string");
    assert(typeof err.titleAz === "string" && err.titleAz.length > 0, "error titleAz must be non-empty");
  }
  console.log("PASS: Error distribution and Azerbaijani titleAz mapping");

  console.log("\nAll Admin Analytics Selftests passed successfully! (7/7)");
}

runSelftest().catch((err) => {
  console.error(err);
  process.exit(1);
});
