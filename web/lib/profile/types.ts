export type Locale = "az" | "ru" | "en" | "tr";
export type Role = "sagird" | "valideyn";
export type PedagogicalTone = "dostyana" | "yetkin" | "qisa";
export type VisualTone = "genc" | "yetkin";
export type Goal = "dim" | "buraxilis" | "mekteb" | "olimpiada";

export type ProfileData = {
  deviceId: string;
  fullName: string;
  inviteCode: string | null;
  locale: Locale;
  role: Role;
  grade: number;
  goal: Goal;
  visualTone: VisualTone;
  pedagogicalTone: PedagogicalTone;
  onboarded: boolean;
  streakDays: number;
  lastActiveDate: string; // "YYYY-MM-DD"
};

export type SolvedAttemptItem = {
  id: string;
  topicCode: string;
  topicTitle: string;
  canonical: string;
  stepsCount: number;
  errorCodesCount: number;
  timestamp: number;
  completed: boolean;
  currentStepIndex?: number;
};

export type ErrorStats = {
  code: string;
  label: string;
  count: number;
  parentNote: string;
};

export type TopicStats = {
  topicCode: string;
  title: string;
  totalAttempts: number;
  masteryPercent: number;
};

export type ProgressReportData = {
  totalSolves: number;
  selfStepPercent: number;
  immediateAnswerCount: number;
  avgTimeMinutes: number;
  avgTimeSeconds: number;
  summaryText: string;
  repeatedErrors: ErrorStats[];
  topicMasteries: TopicStats[];
  weeklyActivity: number[]; // 7 days (B.e .. B), count of solves
};
