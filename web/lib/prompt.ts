// prompts/solve/core.md + fənn + (varsa) bölmə faylından System/User şablonlarını oxuyur —
// TƏK MƏNBƏ (CLAUDE.md fayl sahibliyi cədvəli). scripts/lib/prompt_loader.py ilə EYNİ çıxarma
// məntiqi (ADR-012): eval harness və istehsalat eyni faylları, eyni qaydayla parçalayır.
// `ADR-014`/HANDOFF 40: əvvəllər tək `prompts/solve-step.md` idi, nüvə + fənn əlavəsi olaraq
// bölündü — `core.md`-dəki `{{MATH_EXAMPLE}}` yer tutucusuna fənn (və ya mövzu) nümunəsi qoyulur.
// `ADR-030`: Qat 1 `topic_code` seçir; Qat 5 mövzu faylı varsa üç ümumi nümunəni birinə daraldır.
import fs from "node:fs";
import path from "node:path";

const PROMPTS_DIR = path.join(process.cwd(), "..", "prompts", "solve");
const CORE_PATH = path.join(PROMPTS_DIR, "core.md");
const MATH_PATH = path.join(PROMPTS_DIR, "math.md");
// ADR-020 / ClickUp 86eykj7tu — kaskadın Qat 1 promptu. AYRI fayldır, `core.md`-ə şərt kimi
// əlavə edilməyib: Qat 1-in bütün dəyəri promptun KİÇİK olmasındadır (kiçik model onu tam icra
// etsin), `ADR-013` isə ölçdü ki, prompt böyüdükcə məna tələb edən qayda itir.
const TRANSCRIBE_PATH = path.join(PROMPTS_DIR, "transcribe.md");

const TOPIC_CODE_RE = /^[A-Z]{2,12}\.[A-Z0-9_]{1,40}$/;

export type LoadPromptOpts = {
  subject?: string;
  topicCode?: string;
  // Qat 5 mətn yolunda false — şəkil qaydaları Qat 1-dədir (ADR-030). Eval/monolit defolt true.
  includeImageRules?: boolean;
};

function extractBlock(text: string, heading: string, sourcePath: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("## " + escaped + "\\s*```\\s*([\\s\\S]*?)```");
  const match = text.match(re);
  if (!match) throw new Error(`${sourcePath}-də '## ${heading}' bloku tapılmadı`);
  return match[1].trim();
}

function extractBlockOptional(text: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("## " + escaped + "\\s*```\\s*([\\s\\S]*?)```");
  const match = text.match(re);
  return match ? match[1].trim() : null;
}

function readOptional(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

function subjectFolder(subject?: string): "math" | "physics" | "chemistry" {
  if (subject === "physics" || subject === "chemistry") return subject;
  return "math";
}

function stripImageRules(system: string): string {
  return system.replace(/\n═══ ŞƏKİL GİRİŞİ[\s\S]*?(?=\n═══ MƏZMUN QAYDALARI)/, "\n");
}

export type PromptLoadResult = {
  system: string;
  userTemplate: string;
  fallbackUsed: boolean;
  requestedSubject: string;
};

export class UnsupportedSubjectError extends Error {
  readonly requestedSubject: string;
  constructor(requestedSubject: string) {
    super(`unsupported subject: ${requestedSubject}`);
    this.name = "UnsupportedSubjectError";
    this.requestedSubject = requestedSubject;
  }
}

export function subjectUsesMathFallback(subject?: string): boolean {
  const requested = subject?.trim() || "math";
  const folder = subjectFolder(requested);
  if (folder === "math") return false;
  return readOptional(path.join(PROMPTS_DIR, `${folder}.md`)) === null;
}

export function loadPromptTemplates(opts: LoadPromptOpts = {}): PromptLoadResult {
  const coreText = fs.readFileSync(CORE_PATH, "utf-8");
  const requestedSubject = opts.subject?.trim() || "math";
  const folder = subjectFolder(opts.subject);
  const subjectPath = path.join(PROMPTS_DIR, `${folder}.md`);
  const subjectText = readOptional(subjectPath);
  const fallbackUsed = subjectText === null && folder !== "math";
  const exampleSource = subjectText === null ? MATH_PATH : subjectPath;
  const exampleText = subjectText ?? fs.readFileSync(MATH_PATH, "utf-8");
  let example = extractBlock(exampleText, "Nümunə", exampleSource);
  let addendum = "";

  const topicCode = opts.topicCode?.trim() ?? "";
  if (TOPIC_CODE_RE.test(topicCode)) {
    const topicPath = path.join(PROMPTS_DIR, folder, `${topicCode}.md`);
    const topicText = readOptional(topicPath);
    if (topicText) {
      const topicExample = extractBlockOptional(topicText, "Nümunə");
      if (topicExample) example = topicExample;
      const extra = extractBlockOptional(topicText, "Əlavə qaydalar");
      if (extra) addendum = extra;
    }
  }

  let system = extractBlock(coreText, "System", CORE_PATH)
    .replace("{{MATH_EXAMPLE}}", example)
    .replace("{{TOPIC_ADDENDUM}}", addendum);
  if (opts.includeImageRules === false) {
    system = stripImageRules(system);
  }
  const userTemplate = extractBlock(coreText, "User (dəyişənlərlə)", CORE_PATH);
  return { system, userTemplate, fallbackUsed, requestedSubject };
}

// Qat 1 (transkripsiya) şablonları — `loadPromptTemplates` ilə EYNİ çıxarma məntiqi, ayrı fayl.
// `{{MATH_EXAMPLE}}` yer tutucusu BURADA YOXDUR: Qat 1 addım nümunəsi görmür (nümunəni görsə
// həll etməyə başlayır — v2→v3 dərsi, "model qaydadan çox nümunəni təqlid edir").
export function loadTranscribeTemplates(opts: { subject?: string } = {}): { system: string; userTemplate: string } {
  const text = fs.readFileSync(TRANSCRIBE_PATH, "utf-8");
  const branch =
    opts.subject === "physics" ? extractBlockOptional(text, "Fizika şaxəsi") ?? "" : "";
  return {
    system: extractBlock(text, "System", TRANSCRIBE_PATH).replace("{{SUBJECT_BRANCH}}", branch ? `${branch}\n` : ""),
    userTemplate: extractBlock(text, "User (dəyişənlərlə)", TRANSCRIBE_PATH),
  };
}

// scripts/lib/prompt_loader.py::render_user_prompt-un hərfi portu. `{{#if image}}` bloku
// HƏMİŞƏ silinir (eval/istehsalat şəkli ayrıca mesaj hissəsi kimi əlavə edir, mətndə yox) —
// bu, bug deyil, python tərəfin özündəki davranışdır, birbaşa köçürülüb.
export function renderUserPrompt(
  userTemplate: string,
  grade: number,
  subject: string,
  locale: string,
  text?: string
): string {
  let rendered = userTemplate.replace(/\{\{#if image\}\}[\s\S]*?\{\{\/if\}\}/, "");
  if (text) {
    rendered = rendered.replace(/\{\{#if text\}\}([\s\S]*?)\{\{\/if\}\}/, (_m, inner: string) =>
      inner.replace("{{text}}", text)
    );
  } else {
    rendered = rendered.replace(/\{\{#if text\}\}[\s\S]*?\{\{\/if\}\}/, "");
  }
  rendered = rendered.replace("{{grade}}", String(grade));
  rendered = rendered.replace("{{subject}}", subject);
  rendered = rendered.replace("{{locale}}", locale);
  return rendered.trim();
}
