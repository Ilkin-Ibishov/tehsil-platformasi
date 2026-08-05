"""prompts/solve-step.md-dən System/User şablonlarını oxuyur. prompts/*.md tək mənbədir —
prompt mətni burada hardcode edilmir (bax CLAUDE.md fayl sahibliyi cədvəli)."""

import re
from pathlib import Path

PROMPT_PATH = Path(__file__).resolve().parents[2] / "prompts" / "solve-step.md"

_SECTION_RE = "## {name}\\s*```\\s*(.*?)```"


def _extract_block(text, heading):
    match = re.search(_SECTION_RE.format(name=re.escape(heading)), text, flags=re.DOTALL)
    if not match:
        raise ValueError(f"prompts/solve-step.md-də '## {heading}' bloku tapılmadı")
    return match.group(1).strip()


def load_prompt_templates():
    text = PROMPT_PATH.read_text(encoding="utf-8")
    system = _extract_block(text, "System")
    user_template = _extract_block(text, "User (dəyişənlərlə)")
    return system, user_template


def render_user_prompt(user_template, grade, subject, locale, text=None):
    rendered = user_template
    rendered = re.sub(r"\{\{#if image\}\}.*?\{\{/if\}\}", "", rendered, flags=re.DOTALL)
    if text:
        rendered = re.sub(
            r"\{\{#if text\}\}(.*?)\{\{/if\}\}",
            lambda m: m.group(1).replace("{{text}}", text),
            rendered,
            flags=re.DOTALL,
        )
    else:
        rendered = re.sub(r"\{\{#if text\}\}.*?\{\{/if\}\}", "", rendered, flags=re.DOTALL)
    rendered = rendered.replace("{{grade}}", str(grade))
    rendered = rendered.replace("{{subject}}", subject)
    rendered = rendered.replace("{{locale}}", locale)
    return rendered.strip()
