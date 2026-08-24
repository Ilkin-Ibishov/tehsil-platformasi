// Kaskadın MÜQAVİLƏSİ — ClickUp 86eykj7tu / ADR-020.
//
// Taskın öz sözləri: "bütün qatlar indi qurulmur — indi qurulan şey İNTERFEYSDİR, ki sonrakı
// qatlar yenidən yazılma tələb etmədən əlavə olunsun". Bu fayl həmin interfeysdir.
//
// Quruluş:
//   Qat 1 (transcribe.ts)  şəkil → Transcript | Refusal        — TƏK vision çağırışı
//   Qat 2..5 (SolveLayer)  Transcript → LayerSolution | null    — şəkli GÖRMÜR
//
// `null` qaytarmaq = "bu qat cavab verə bilmir, növbətiyə keç". İstisna atmaq = "xəta oldu,
// kaskad dayanmalıdır". Bu fərq qəsdən kəskindir: imtina NORMAL haldır (Qat 2 bankda tapmır),
// xəta isə deyil.
//
// Yeni qat əlavə etmək = bu tipi ödəyən modul yazmaq + `run.ts`-dəki massivə DÜZGÜN YERDƏ
// qoymaq. Nə `/api/solve`, nə klient, nə telemetriya dəyişir.

import type { LLMUsage } from "../llm";
import type { VisualSpec } from "../visual";

// docs/TELEMETRY.md-dəki `match_path` taksonomiyası — YENİ dəyər əlavə etmək telemetriya
// müqaviləsini dəyişməkdir (CLAUDE.md: TELEMETRY.md Cowork-un sahibliyindədir).
// `image_cache` HANDOFF 82-də (`0045`) əlavə edilib.
// `template` ADR-021-də (Qat 3) əlavə edilib — Cowork-un `docs/TELEMETRY.md`-i HƏLƏ
// YENİLƏMƏYİB (bax ADR-021 §"Yeni match_path dəyəri"). Kaskad özü bayraq arxasında olduğu
// üçün bu dəyər hələ heç bir real telemetriya sətrinə düşmür — production-a təsirsizdir.
export type MatchPath = "hash" | "fingerprint" | "embedding" | "llm" | "image_cache" | "template";

export type LayerId = "bank_hash" | "bank_fingerprint" | "template" | "sympy" | "llm_text";

// Qat 1-in müvəffəqiyyətli çıxışı. `docs/TRANSCRIBE-SCHEMA.json` ilə eyni sahələr —
// validasiyadan KEÇMİŞ formadır, ona görə məcburi sahələr burada optional DEYİL.
export type Transcript = {
  canonical: string;
  subject: string;
  grade: number;
  topicCode: string;
  problemType: string | null;
  ocrConfidence: string | null;
  detectedLanguage: string | null;
  hasFigure: boolean;
};

export type Candidate = { label: string; preview: string };

// Qat 1-in rədd qapısı. Klient tərəfi bunu mövcud imtina/seçim ekranlarında göstərir
// (ADR-007) — yeni UI vəziyyəti yaranmır.
export type Refusal = {
  status: "unreadable" | "not_a_problem" | "multiple_problems" | "cut_off" | "unsupported";
  reason: string;
  candidates?: Candidate[];
};

// STEP-SCHEMA addımının KLİENTƏ GÖRÜNƏN forması — `check.accept` ÇIXARILMIŞ (ADR-017).
// Bankdan gələn addımlar DB-də ARTIQ bu formadadır (ölçüldü: 226 tərcümənin heç birində
// `accept` yoxdur), LLM-dən gələnlər `stripAccept`-dən keçir.
export type PublicStep = {
  index?: number;
  title?: string;
  explanation?: string;
  error_code?: string;
  hint?: string;
  check?: { ask?: string; input_kind?: string };
  [key: string]: unknown;
};

// LLM-in XAM addımı — `check.accept` HƏLƏ İÇİNDƏDİR. `PublicStep`-dən AYRI tip olması
// qəsdlidir: sızma yoxlaması (`detectLeak`, ADR-005) və `private.step_answers` yazısı
// `accept`-ə EHTİYAC DUYUR, klientə gedən forma isə onu DAŞIMAMALIDIR (ADR-017). İki tip
// olmasa, `accept`-i çıxarmağı bir yerdə unutmaq kompilyatorda GÖRÜNMƏZ olardı.
export type RawStep = {
  index?: number;
  title?: string;
  explanation?: string;
  error_code?: string;
  hint?: string;
  check?: { ask?: string; accept?: string[]; input_kind?: string };
  [key: string]: unknown;
};

export type FinalAnswer = { latex: string; values: string[]; choice?: string };

export type StepAnswerRow = { step_index: number | undefined; accept: string[] | undefined; input_kind: string };

// Bir qatın cavabı.
//
// KRİTİK AYRIM — `questionId` vs `newQuestion`:
//   `questionId` doludur  → qat MÖVCUD bank sətrini tapdı. `/api/solve` YENİ sual YARATMIR,
//                           yalnız `hit_count`-u artırır. Cavab DB-də artıq var.
//   `newQuestion` doludur → qat YENİ həll istehsal etdi. `/api/solve` onu sympy ilə yoxlayır,
//                           `questions`/`question_translations`/`private.*`-a yazır.
// İkisi birdən dolu OLA BİLMƏZ — tip səviyyəsində ayrılıb.
export type LayerSolution =
  | {
      layer: LayerId;
      matchPath: MatchPath;
      questionId: string;
      steps: PublicStep[];
      verification: { verified: boolean | null; method: string };
      visual?: VisualSpec | null;
      newQuestion?: never;
      costUsd: number | null;
      latencyMs: number;
      usage: LLMUsage | null;
      fallbackUsed?: boolean;
      fallbackFrom?: string | null;
    }
  | {
      layer: LayerId;
      matchPath: MatchPath;
      questionId?: never;
      steps: PublicStep[];
      newQuestion: {
        finalAnswer: FinalAnswer;
        stepAnswerRows: StepAnswerRow[];
        rawSteps: RawStep[];
        model: string | null;
      };
      costUsd: number | null;
      latencyMs: number;
      usage: LLMUsage | null;
      visual?: VisualSpec | null;
      fallbackUsed?: boolean;
      fallbackFrom?: string | null;
    };

export type CascadeContext = {
  transcript: Transcript;
  // Girişdən gələn (şagirdin seçdiyi) dəyərlər — transkripsiya onları TƏSHİH edə bilər,
  // amma izahların dili HƏMİŞƏ girişdən gəlir (ADR-008).
  locale: string;
  requestedGrade: number;
  requestedSubject: string;
  /** Optional pedagogical tone from client profile (`dostyana` | `yetkin` | `qisa`). */
  pedagogicalTone?: string;
  signal?: AbortSignal;
  useSoakAdapter?: boolean;
  /**
   * COST-LATENCY-SAFE-SEQUENCE addım 5: Qat 5 axını zamanı hər tamamlanmış
   * PublicStep (accept YOX — ADR-017). Bank/şablon qatları bunu çağırmır.
   */
  onPublicStep?: (step: PublicStep) => void;
  logEvent?: (name: string, props: Record<string, unknown>) => Promise<void>;
  strictSubject?: boolean;
};

export type SolveLayer = {
  id: LayerId;
  // `null` → imtina (normal), istisna → xəta (kaskad dayanır).
  run(ctx: CascadeContext): Promise<LayerSolution | null>;
};
