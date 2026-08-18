"""prompts/solve/core.md + fənn + (varsa) bölmə faylından System/User şablonlarını oxuyur.
prompts/**/*.md tək mənbədir — prompt mətni burada hardcode edilmir (bax CLAUDE.md fayl
sahibliyi cədvəli). `ADR-014`/HANDOFF 40: əvvəllər tək `prompts/solve-step.md` idi, nüvə +
fənn əlavəsi olaraq bölündü — `core.md`-dəki `{{MATH_EXAMPLE}}` yer tutucusuna fənn (və ya
mövzu) nümunəsi qoyulur. `ADR-030`: Qat 1 topic_code seçir; Qat 5 mövzu faylı varsa nümunəni
daraldır. Argsız çağırış eval/qızıl dəsti üçün əvvəlki core+math çıxışını saxlayır."""

import json
import re
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts" / "solve"
CORE_PATH = PROMPTS_DIR / "core.md"
MATH_PATH = PROMPTS_DIR / "math.md"

_SECTION_RE = "## {name}\\s*```\\s*(.*?)```"
_VERSION_RE = re.compile(r"^#.*\(v([\w.]+)\)", re.MULTILINE)
_TOPIC_CODE_RE = re.compile(r"^[A-Z]{2,12}\.[A-Z0-9_]{1,40}$")


def _extract_block(text, heading, source_path):
    match = re.search(_SECTION_RE.format(name=re.escape(heading)), text, flags=re.DOTALL)
    if not match:
        raise ValueError(f"{source_path}-də '## {heading}' bloku tapılmadı")
    return match.group(1).strip()


def _extract_block_optional(text, heading):
    match = re.search(_SECTION_RE.format(name=re.escape(heading)), text, flags=re.DOTALL)
    return match.group(1).strip() if match else None


def _subject_folder(subject):
    if subject in ("physics", "chemistry"):
        return subject
    return "math"


def _strip_image_rules(system):
    return re.sub(
        r"\n═══ ŞƏKİL GİRİŞİ[\s\S]*?(?=\n═══ MƏZMUN QAYDALARI)",
        "\n",
        system,
        count=1,
    )


def load_prompt_templates(subject=None, topic_code=None, include_image_rules=True):
    core_text = CORE_PATH.read_text(encoding="utf-8")
    folder = _subject_folder(subject)
    subject_path = PROMPTS_DIR / f"{folder}.md"
    if subject_path.exists():
        example_text = subject_path.read_text(encoding="utf-8")
        example_source = subject_path
    else:
        example_text = MATH_PATH.read_text(encoding="utf-8")
        example_source = MATH_PATH
    example = _extract_block(example_text, "Nümunə", example_source)
    addendum = _extract_block_optional(example_text, "Əlavə qaydalar") or ""

    code = (topic_code or "").strip()
    if _TOPIC_CODE_RE.match(code):
        topic_path = PROMPTS_DIR / folder / f"{code}.md"
        if topic_path.exists():
            topic_text = topic_path.read_text(encoding="utf-8")
            topic_example = _extract_block_optional(topic_text, "Nümunə")
            if topic_example:
                example = topic_example
            extra = _extract_block_optional(topic_text, "Əlavə qaydalar")
            if extra:
                addendum = f"{addendum}\n{extra}".strip() if addendum else extra

    system = _extract_block(core_text, "System", CORE_PATH)
    system = system.replace("{{MATH_EXAMPLE}}", example)
    system = system.replace("{{TOPIC_ADDENDUM}}", addendum)
    if include_image_rules is False:
        system = _strip_image_rules(system)
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
