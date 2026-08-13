// prompts/solve/core.md + prompts/solve/math.md-dən System/User şablonlarını oxuyur —
// TƏK MƏNBƏ (CLAUDE.md fayl sahibliyi cədvəli). scripts/lib/prompt_loader.py ilə EYNİ çıxarma
// məntiqi (ADR-012): eval harness və istehsalat eyni faylları, eyni qaydayla parçalayır.
// `ADR-014`/HANDOFF 40: əvvəllər tək `prompts/solve-step.md` idi, nüvə + fənn əlavəsi olaraq
// bölündü — `core.md`-dəki `{{MATH_EXAMPLE}}` yer tutucusuna `math.md`-in nümunəsi qoyulur,
// birləşmiş mətn köhnə fayla HƏRFİ EYNİDİR.
import fs from "node:fs";
import path from "node:path";

const CORE_PATH = path.join(process.cwd(), "..", "prompts", "solve", "core.md");
const MATH_PATH = path.join(process.cwd(), "..", "prompts", "solve", "math.md");
// ADR-020 / ClickUp 86eykj7tu — kaskadın Qat 1 promptu. AYRI fayldır, `core.md`-ə şərt kimi
// əlavə edilməyib: Qat 1-in bütün dəyəri promptun KİÇİK olmasındadır (kiçik model onu tam icra
// etsin), `ADR-013` isə ölçdü ki, prompt böyüdükcə məna tələb edən qayda itir.
const TRANSCRIBE_PATH = path.join(process.cwd(), "..", "prompts", "solve", "transcribe.md");

function extractBlock(text: string, heading: string, sourcePath: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("## " + escaped + "\\s*```\\s*([\\s\\S]*?)```");
  const match = text.match(re);
  if (!match) throw new Error(`${sourcePath}-də '## ${heading}' bloku tapılmadı`);
  return match[1].trim();
}

export function loadPromptTemplates(): { system: string; userTemplate: string } {
  const coreText = fs.readFileSync(CORE_PATH, "utf-8");
  const mathText = fs.readFileSync(MATH_PATH, "utf-8");
  const mathExample = extractBlock(mathText, "Nümunə", MATH_PATH);

  const system = extractBlock(coreText, "System", CORE_PATH).replace("{{MATH_EXAMPLE}}", mathExample);
  const userTemplate = extractBlock(coreText, "User (dəyişənlərlə)", CORE_PATH);
  return { system, userTemplate };
}

// Qat 1 (transkripsiya) şablonları — `loadPromptTemplates` ilə EYNİ çıxarma məntiqi, ayrı fayl.
// `{{MATH_EXAMPLE}}` yer tutucusu BURADA YOXDUR: Qat 1 addım nümunəsi görmür (nümunəni görsə
// həll etməyə başlayır — v2→v3 dərsi, "model qaydadan çox nümunəni təqlid edir").
export function loadTranscribeTemplates(): { system: string; userTemplate: string } {
  const text = fs.readFileSync(TRANSCRIBE_PATH, "utf-8");
  return {
    system: extractBlock(text, "System", TRANSCRIBE_PATH),
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
