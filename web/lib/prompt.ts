// prompts/solve-step.md-dən System/User şablonlarını oxuyur — TƏK MƏNBƏ (CLAUDE.md fayl
// sahibliyi cədvəli). scripts/lib/prompt_loader.py ilə EYNİ çıxarma məntiqi (ADR-012):
// eval harness və istehsalat eyni faylı, eyni qaydayla parçalayır.
import fs from "node:fs";
import path from "node:path";

const PROMPT_PATH = path.join(process.cwd(), "..", "prompts", "solve-step.md");

function extractBlock(text: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("## " + escaped + "\\s*```\\s*([\\s\\S]*?)```");
  const match = text.match(re);
  if (!match) throw new Error(`prompts/solve-step.md-də '## ${heading}' bloku tapılmadı`);
  return match[1].trim();
}

export function loadPromptTemplates(): { system: string; userTemplate: string } {
  const text = fs.readFileSync(PROMPT_PATH, "utf-8");
  const system = extractBlock(text, "System");
  const userTemplate = extractBlock(text, "User \\(dəyişənlərlə\\)");
  return { system, userTemplate };
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
