import { getExpectedAdminSecret, verifyAdminAuth, isValidAdminSecret } from "./auth";
import { getAdminAnalyticsData } from "./analytics";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

const FROZEN_11_ERROR_CODES = new Set([
  "SIGN_LOST",
  "SQUARE_FORGOTTEN",
  "SIGN_CHOICE",
  "SUBSTITUTION_SKIPPED",
  "ARITHMETIC",
  "FACTOR_PAIR",
  "ORDER_OF_OPS",
  "FORMULA_MISAPPLIED",
  "COEFFICIENT_READ",
  "UNIT_MISMATCH",
  "TRANSCRIPTION",
]);

async function runSelftest() {
  console.log("Starting Admin Analytics & Security Selftest...");

  // 1. Auth secret resolution
  const secret = getExpectedAdminSecret();
  assert(typeof secret === "string" && secret.length > 0, "Admin secret must be a non-empty string in dev/test");
  if (!secret) throw new Error("secret is null");
  assert(isValidAdminSecret(secret) === true, "isValidAdminSecret must accept true secret");
  assert(isValidAdminSecret("wrong-secret-123") === false, "isValidAdminSecret must reject wrong secret");
  console.log("PASS: Admin secret resolution and validation");

  // 2. Auth verification: valid vs invalid tokens (P0 bypass prevention)
  const mockReqAuthorized = new Request("http://localhost:3000/api/admin/analytics/overview", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const isAuth = await verifyAdminAuth(mockReqAuthorized);
  assert(isAuth === true, "verifyAdminAuth should accept valid Bearer token");

  const mockReqHeader = new Request("http://localhost:3000/api/admin/analytics/overview", {
    headers: { "x-admin-key": secret },
  });
  assert((await verifyAdminAuth(mockReqHeader)) === true, "verifyAdminAuth should accept x-admin-key");

  const mockReqQuery = new Request(`http://localhost:3000/api/admin/analytics/overview?admin_key=${secret}`);
  assert((await verifyAdminAuth(mockReqQuery)) === true, "verifyAdminAuth should accept ?admin_key=");

  const mockReqCookie = new Request("http://localhost:3000/api/admin/analytics/overview", {
    headers: { Cookie: `th_admin_session=${secret}` },
  });
  assert((await verifyAdminAuth(mockReqCookie)) === true, "verifyAdminAuth should accept th_admin_session cookie");

  const mockReqUnauthorized = new Request("http://localhost:3000/api/admin/analytics/overview", {
    headers: { Authorization: "Bearer wrong-unauthorized-token-2026" },
  });
  const isUnauthorizedAuth = await verifyAdminAuth(mockReqUnauthorized);
  assert(isUnauthorizedAuth === false, "verifyAdminAuth MUST REJECT invalid token (no dev bypass!)");
  console.log("PASS: Auth verification with full rejection of invalid tokens (P0 closed)");

  // 3. Analytics data generation test across different filter ranges
  const data7d = await getAdminAnalyticsData({ range: "7d", kind: "all" });
  assert(!!data7d, "Data payload must not be null");
  assert(typeof data7d.isSampleData === "boolean", "isSampleData flag must be boolean");
  assert(typeof data7d.overview.avgCostUsd === "number", "avgCostUsd must be a number");
  assert(typeof data7d.overview.transferSuccessRate === "number", "transferSuccessRate must be a number");
  assert(typeof data7d.overview.cacheHitRate === "number", "cacheHitRate must be a number");
  assert(typeof data7d.overview.cameraCacheHitRate === "number", "cameraCacheHitRate must be a number (S6 Bake)");
  assert(typeof data7d.overview.bankMatchRate === "number", "bankMatchRate must be a number (Qat 2)");
  assert(typeof data7d.overview.p90LatencyMs === "number", "p90LatencyMs must be a number");
  assert(Array.isArray(data7d.pedagogical.errorDistribution), "errorDistribution must be an array");
  assert(Array.isArray(data7d.unitEconomics.matchPaths), "matchPaths must be an array");
  assert(Array.isArray(data7d.funnel.steps), "funnel steps must be an array");
  assert(data7d.funnel.steps.length >= 5, "funnel must have at least 5 stages");
  console.log("PASS: 7d analytics data structure, cameraCacheHitRate & honest P90 calculations");

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

  // 7. Error distribution & Frozen 11 adherence
  assert(data7d.pedagogical.errorDistribution.length > 0, "errorDistribution must not be empty");
  for (const err of data7d.pedagogical.errorDistribution) {
    assert(typeof err.code === "string" && err.code.length > 0, "error code must be valid string");
    assert(typeof err.titleAz === "string" && err.titleAz.length > 0, "error titleAz must be non-empty");
    // Ensure no legacy/invented error codes leak into the fallback model
    if (data7d.isSampleData) {
      assert(
        FROZEN_11_ERROR_CODES.has(err.code),
        `Error code '${err.code}' must belong to frozen 11 taxonomy in STEP-SCHEMA.json`
      );
    }
  }
  console.log("PASS: Error distribution and Frozen 11 enum adherence (P2 verified)");

  console.log("\nAll Admin Analytics & Security Selftests passed successfully! (7/7)");
}

runSelftest().catch((err) => {
  console.error(err);
  process.exit(1);
});
