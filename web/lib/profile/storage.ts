import type {
  ProfileData,
  ProgressReportData,
  SolvedAttemptItem,
  Locale,
  Role,
  Goal,
  VisualTone,
  ErrorStats,
  TopicStats,
} from "./types";
import { normalizePedagogicalTone } from "./tone-prompt";

const KEYS = {
  DEVICE_ID: "th_device_id",
  INVITE_CODE: "th_invite_code",
  LOCALE: "th_locale",
  ROLE: "th_role",
  GRADE: "th_grade",
  GOAL: "th_goal",
  VISUAL_TONE: "th_visual_tone",
  PEDAGOGICAL_TONE: "th_pedagogical_tone",
  ONBOARDED: "th_onboarded",
  STREAK_DAYS: "th_streak_days",
  LAST_ACTIVE_DATE: "th_last_active_date",
  HISTORY: "th_history_items",
  ERROR_STATS: "th_error_stats",
} as const;

const ERROR_CODES = new Set([
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

const memoryStore: Record<string, string> = {};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeGet(key: string, fallback: string): string {
  if (isBrowser()) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // ignore
    }
  }
  return key in memoryStore ? memoryStore[key] : fallback;
}

function safeSet(key: string, value: string): void {
  memoryStore[key] = value;
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota exceeded or private browsing — fail safely
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolveOnboarded(): boolean {
  const raw = safeGet(KEYS.ONBOARDED, "");
  if (raw === "true") return true;
  if (raw === "false") return false;
  // Legacy installs (pre-profile): invite or device already present → skip forcing onboarding.
  const hasLegacy =
    Boolean(safeGet(KEYS.INVITE_CODE, "")) ||
    (isBrowser() && Boolean(localStorage.getItem(KEYS.DEVICE_ID)));
  if (hasLegacy) {
    safeSet(KEYS.ONBOARDED, "true");
    return true;
  }
  return false;
}

export function getStoredProfile(): ProfileData {
  const gradeNum = Math.min(11, Math.max(5, parseInt(safeGet(KEYS.GRADE, "9"), 10) || 9));
  const visualToneDefault: VisualTone = gradeNum <= 8 ? "genc" : "yetkin";
  const visualTone = (safeGet(KEYS.VISUAL_TONE, visualToneDefault) as VisualTone) || visualToneDefault;
  const pedTone = normalizePedagogicalTone(safeGet(KEYS.PEDAGOGICAL_TONE, "yetkin"));
  const locale = (safeGet(KEYS.LOCALE, "az") as Locale) || "az";
  const role = (safeGet(KEYS.ROLE, "sagird") as Role) || "sagird";
  const goal = (safeGet(KEYS.GOAL, "dim") as Goal) || "dim";
  const inviteCode = safeGet(KEYS.INVITE_CODE, "");
  const deviceId = safeGet(KEYS.DEVICE_ID, "");
  const streakDays = parseInt(safeGet(KEYS.STREAK_DAYS, "1"), 10) || 1;
  const lastActiveDate = safeGet(KEYS.LAST_ACTIVE_DATE, todayIso());

  return {
    deviceId: deviceId || "pending",
    inviteCode: inviteCode || null,
    locale: ["az", "ru", "en", "tr"].includes(locale) ? locale : "az",
    role: role === "valideyn" ? "valideyn" : "sagird",
    grade: gradeNum,
    goal: ["dim", "buraxilis", "mekteb", "olimpiada"].includes(goal) ? goal : "dim",
    visualTone: visualTone === "genc" ? "genc" : "yetkin",
    pedagogicalTone: pedTone,
    onboarded: resolveOnboarded(),
    streakDays,
    lastActiveDate,
  };
}

export function saveProfile(partial: Partial<ProfileData>): ProfileData {
  if (partial.locale) safeSet(KEYS.LOCALE, partial.locale);
  if (partial.role) safeSet(KEYS.ROLE, partial.role);
  if (typeof partial.grade === "number") {
    const g = Math.min(11, Math.max(5, partial.grade));
    safeSet(KEYS.GRADE, String(g));
    if (!partial.visualTone) {
      safeSet(KEYS.VISUAL_TONE, g <= 8 ? "genc" : "yetkin");
    }
  }
  if (partial.goal) safeSet(KEYS.GOAL, partial.goal);
  if (partial.visualTone) safeSet(KEYS.VISUAL_TONE, partial.visualTone);
  if (partial.pedagogicalTone) safeSet(KEYS.PEDAGOGICAL_TONE, normalizePedagogicalTone(partial.pedagogicalTone));
  if (typeof partial.onboarded === "boolean") safeSet(KEYS.ONBOARDED, String(partial.onboarded));
  if (partial.inviteCode !== undefined) safeSet(KEYS.INVITE_CODE, partial.inviteCode || "");
  if (typeof partial.streakDays === "number") safeSet(KEYS.STREAK_DAYS, String(partial.streakDays));
  if (partial.lastActiveDate) safeSet(KEYS.LAST_ACTIVE_DATE, partial.lastActiveDate);

  return getStoredProfile();
}

/** Update streak when the student is active today. */
export function touchStreak(): ProfileData {
  const profile = getStoredProfile();
  const today = todayIso();
  if (profile.lastActiveDate === today) return profile;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yIso = yesterday.toISOString().slice(0, 10);
  const nextStreak = profile.lastActiveDate === yIso ? profile.streakDays + 1 : 1;
  return saveProfile({ streakDays: nextStreak, lastActiveDate: today });
}

export function getHistoryItems(): SolvedAttemptItem[] {
  try {
    const raw = isBrowser() ? localStorage.getItem(KEYS.HISTORY) : memoryStore[KEYS.HISTORY];
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SolvedAttemptItem[]) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: SolvedAttemptItem): void {
  try {
    const current = getHistoryItems();
    const updated = [item, ...current.filter((x) => x.id !== item.id)].slice(0, 20);
    const json = JSON.stringify(updated);
    memoryStore[KEYS.HISTORY] = json;
    if (isBrowser()) localStorage.setItem(KEYS.HISTORY, json);
  } catch {
    // Quota exceeded
  }
}

export function recordErrorCode(code: string): void {
  if (!code || !ERROR_CODES.has(code)) return;
  try {
    const raw = safeGet(KEYS.ERROR_STATS, "{}");
    const map = JSON.parse(raw) as Record<string, number>;
    map[code] = (map[code] ?? 0) + 1;
    safeSet(KEYS.ERROR_STATS, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getErrorStats(): ErrorStats[] {
  try {
    const raw = safeGet(KEYS.ERROR_STATS, "{}");
    const map = JSON.parse(raw) as Record<string, number>;
    return Object.entries(map)
      .map(([code, count]) => ({
        code,
        label: code,
        count,
        parentNote: code,
      }))
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function computeTopicMasteries(history: SolvedAttemptItem[]): TopicStats[] {
  const byTopic = new Map<string, { title: string; total: number; completed: number }>();
  for (const h of history) {
    const key = h.topicCode || "MATH.GENERAL";
    const cur = byTopic.get(key) ?? { title: h.topicTitle || key, total: 0, completed: 0 };
    cur.total += 1;
    if (h.completed) cur.completed += 1;
    if (h.topicTitle) cur.title = h.topicTitle;
    byTopic.set(key, cur);
  }
  return [...byTopic.entries()]
    .map(([topicCode, v]) => ({
      topicCode,
      title: v.title,
      totalAttempts: v.total,
      masteryPercent: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.totalAttempts - a.totalAttempts)
    .slice(0, 6);
}

function computeWeeklyActivity(history: SolvedAttemptItem[]): number[] {
  // Index 0 = Monday … 6 = Sunday (matches home chart labels B.e … B)
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = (now.getDay() + 6) % 7; // Mon=0
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - day);

  for (const h of history) {
    const d = new Date(h.timestamp);
    if (d < startOfWeek) continue;
    const idx = (d.getDay() + 6) % 7;
    counts[idx] += 1;
  }
  return counts;
}

export function getProgressReport(): ProgressReportData {
  const history = getHistoryItems();
  const totalSolves = history.length;
  const completedSolves = history.filter((h) => h.completed).length;
  const selfStepPercent = totalSolves > 0 ? Math.round((completedSolves / totalSolves) * 100) : 0;
  const topicMasteries = computeTopicMasteries(history);
  const top = topicMasteries[0];

  return {
    totalSolves,
    selfStepPercent,
    // Incomplete solves (abandoned / answer revealed early) — not "looked at answer" yet;
    // client has no reveal count locally, so we expose incompletes as a proxy signal.
    immediateAnswerCount: Math.max(0, totalSolves - completedSolves),
    avgTimeMinutes: totalSolves > 0 ? 2 : 0,
    avgTimeSeconds: totalSolves > 0 ? 14 : 0,
    // UI builds localized summary from totalSolves + top topic title.
    summaryText: top?.title ?? "",
    repeatedErrors: getErrorStats(),
    topicMasteries,
    weeklyActivity: computeWeeklyActivity(history),
  };
}
