"""prompts/solve/core.md + prompts/solve/math.md-dən System/User şablonlarını oxuyur.
prompts/**/*.md tək mənbədir — prompt mətni burada hardcode edilmir (bax CLAUDE.md fayl
sahibliyi cədvəli). `ADR-014`/HANDOFF 40: əvvəllər tək `prompts/solve-step.md` idi, nüvə +
fənn əlavəsi olaraq bölündü — `core.md`-dəki `{{MATH_EXAMPLE}}` yer tutucusuna `math.md`-in
nümunəsi qoyulur, birləşmiş mətn köhnə fayla HƏRFİ EYNİDİR."""

import json
import re
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts" / "solve"
CORE_PATH = PROMPTS_DIR / "core.md"
MATH_PATH = PROMPTS_DIR / "math.md"

_SECTION_RE = "## {name}\\s*```\\s*(.*?)```"
_VERSION_RE = re.compile(r"^#.*\(v([\w.]+)\)", re.MULTILINE)


def _extract_block(text, heading, source_path):
    match = re.search(_SECTION_RE.format(name=re.escape(heading)), text, flags=re.DOTALL)
    if not match:
        raise ValueError(f"{source_path}-də '## {heading}' bloku tapılmadı")
    return match.group(1).strip()


def load_prompt_templates():
    core_text = CORE_PATH.read_text(encoding="utf-8")
    math_text = MATH_PATH.read_text(encoding="utf-8")
    math_example = _extract_block(math_text, "Nümunə", MATH_PATH)

    system = _extract_block(core_text, "System", CORE_PATH)
    system = system.replace("{{MATH_EXAMPLE}}", math_example)
    user_template = _extract_block(core_text, "User (dəyişənlərlə)", CORE_PATH)
    return system, user_template


def load_prompt_version():
    """`prompts/solve/core.md`-in başlığındakı `(v6)` kimi versiya işarəsini oxuyur — HANDOFF
    (38): nəticə faylına yazılmayanda "hansı rəy hansı promptaydı" qarışır (HANDOFF 27-dəki
    "köhnə rəy v6-ya aid edildi" səhvi). Tapılmasa `"unknown"` — səssiz boş qalmır."""
    text = CORE_PATH.read_text(encoding="utf-8")
    match = _VERSION_RE.search(text)
    return f"v{match.group(1)}" if match else "unknown"


def extract_example_json(system_text):
    """System blokunun içindəki nümunə JSON obyektini çıxarır — hardcode edilmiş nümunə YOX,
    promptun özündən oxunur (86eyhnv2r: prompt↔sxem invariant testi). İlk `{`-dən başlayıb
    balanslaşdırılmış JSON dəyərini `json.JSONDecoder.raw_decode` ilə tapır — mətndəki digər
    `{`/`}` işarələrindən (məs. `check` sözünün izahında) təsirlənmir."""
    start = system_text.index("{")
    obj, _end = json.JSONDecoder().raw_decode(system_text, start)
    return obj


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
