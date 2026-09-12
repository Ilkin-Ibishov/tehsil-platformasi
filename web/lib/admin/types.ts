// Admin Analitika Tipləri — 4 Funksional Sütun və Əməliyyat Mərkəzi
export type TimeRange = "24h" | "7d" | "30d" | "all";
export type EnvironmentKind = "all" | "student" | "soak" | "tester";

export type AdminFilterParams = {
  range: TimeRange;
  kind: EnvironmentKind;
};

// Əsas KPI İcmal Kartları
export type AdminOverviewKPIs = {
  totalSolves: number;
  completedSolves: number;
  completionRate: number; // 0 - 100 %
  
  // Vahid İqtisadiyyatı ($0.010 hədəfi)
  avgCostUsd: number;
  totalCostUsd: number;
  costTargetAlert: boolean; // avgCostUsd > 0.010 olanda true
  cacheHitRate: number; // match_path != 'llm' olanların faizi (0 - 100 %)

  // Pedaqoji Nəbz
  transferSuccessRate: number; // transfer_correct = true % (Həqiqi öyrənmə)
  revealedAnswerRate: number; // revealed_answer = true % (Təslim olma/köçürmə)

  // Texniki və AI Sağlamlığı
  avgLatencyMs: number;
  p90LatencyMs: number;
  sympyVerifiedRate: number; // verified=true %
  pendingTaxonomyCount: number; // v_taxonomy_review sətir sayı
  unresolvedReportsCount: number; // bug_reports sayı
};

// SÜTUN 1: Pedaqoji Nəbz & Səhv Xəritəsi
export type ErrorCodeStat = {
  code: string;
  titleAz: string;
  count: number;
  percentage: number;
  studentCount: number;
};

export type PedagogicalHealthData = {
  transferSuccessRate: number;
  revealedAnswerRate: number;
  completionRate: number;
  hintsImpact: {
    hintsOpenedCount: number;
    whyOpenedCount: number;
    successAfterHintRate: number;
  };
  errorDistribution: ErrorCodeStat[];
  topicFailureHotspots: Array<{
    topicCode: string;
    topicTitle: string;
    totalAttempts: number;
    errorCount: number;
    topErrorCode: string;
  }>;
};

// SÜTUN 2: Vahid İqtisadiyyatı & Kaskad Keş
export type MatchPathItem = {
  path: "bank" | "image_cache" | "hash" | "fingerprint" | "template" | "embedding" | "llm" | "other";
  label: string;
  count: number;
  percentage: number;
  costUsd: number;
  avgLatencyMs: number;
};

export type DailyCostPoint = {
  date: string;
  solves: number;
  avgCostUsd: number;
  totalCostUsd: number;
  llmSolves: number;
  cachedSolves: number;
};

export type UnitEconomicsData = {
  avgCostUsd: number;
  targetCostUsd: number; // 0.010
  costTargetAlert: boolean;
  cacheHitRate: number;
  matchPaths: MatchPathItem[];
  dailyTrends: DailyCostPoint[];
  tokenEfficiency: {
    totalTokensIn: number;
    totalTokensOut: number;
    cachedTokens: number;
    cacheSavingsPct: number;
  };
  latencyHistogram: {
    p50Ms: number;
    p90Ms: number;
    p99Ms: number;
    waitingAbandonedCount: number;
  };
};

// SÜTUN 3: Səyahət Qıfı (Funnel)
export type FunnelStep = {
  id: string;
  label: string;
  count: number;
  conversionFromStart: number; // 0 - 100 %
  dropOffRate: number; // əvvəlki addımdan düşüş %
};

export type StudentFunnelData = {
  steps: FunnelStep[];
  stepAbandonment: Array<{
    stepIndex: number;
    count: number;
    percentage: number;
  }>;
  frictionSignals: {
    multiCandidatesShownRate: number; // candidates.shown > 1
    transcriptCorrectedRate: number; // transcript.corrected
    cameraRefusalCount: number;
  };
};

// SÜTUN 4: AI & Texniki Sağlamlıq
export type AIHealthData = {
  sympyVerification: {
    verifiedTrueCount: number;
    verifiedFalseCount: number;
    methodNoneCount: number;
    verifiedPercentage: number;
    reasons: Array<{ reason: string; count: number }>;
  };
  modelsUsed: Array<{
    modelId: string;
    callCount: number;
    totalCostUsd: number;
    avgLatencyMs: number;
    fallbackCount: number;
  }>;
  recentBugReports: Array<{
    id: string;
    attemptId: string | null;
    route: string | null;
    description: string;
    createdAt: string;
    hasCapture: boolean;
  }>;
  pendingTaxonomyCount: number;
};

// Tam Admin Dashboard Məlumat Paketi
export type AdminDashboardPayload = {
  timestamp: string;
  filters: AdminFilterParams;
  overview: AdminOverviewKPIs;
  pedagogical: PedagogicalHealthData;
  unitEconomics: UnitEconomicsData;
  funnel: StudentFunnelData;
  aiHealth: AIHealthData;
};

// Taksonomiya Triage Tipləri
export type TaxonomyReviewItem = {
  nov: "topic" | "error";
  code: string;
  titleAz: string;
  needsReview: boolean;
  active: boolean;
  suggestedTitle?: string;
  suggestedTarget?: string;
  mergeReason?: string;
};

export type TaxonomyTriageResponse = {
  total: number;
  items: TaxonomyReviewItem[];
  byDomain: Record<string, string[]>;
  suggestedAdoptions: Array<{ code: string; titleAz: string; category: string }>;
  suggestedMerges: Array<{ source: string; target: string; reason: string }>;
};

// Runtime Config Tipləri
export type AppConfigItem = {
  key: string;
  value: string;
  updatedAt: string;
  description: string;
  possibleValues?: string[];
};
