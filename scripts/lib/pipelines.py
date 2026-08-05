"""İki boru xətti. Hər ikisi eyni imzaya malikdir:
    run(item, cfg) -> dict(id, status, raw_output, usage, latency_ms, error)

status: "ok" | "not_implemented" | "error"
"""

from pathlib import Path

from . import llm_client, prompt_loader

REPO_ROOT = Path(__file__).resolve().parents[2]


def run_pipeline_a(item, cfg):
    """A = Texo (ONNX) → LaTeX → mətn LLM → sxem. Texo hələ inteqrasiya olunmayıb (ADR-001).
    Bloklanmır — interfeys kimi qoyulur, "not_implemented" qaytarır ki B tək işə düşə bilsin."""
    return {
        "id": item.get("id"),
        "status": "not_implemented",
        "raw_output": None,
        "usage": None,
        "latency_ms": None,
        "error": "Texo (ONNX) hələ inteqrasiya olunmayıb — bax docs/decisions/ADR-001-ocr-pipeline.md",
    }


def run_pipeline_b(item, cfg):
    """B = Vision LLM tək çağırış → sxem."""
    system_prompt, user_template = prompt_loader.load_prompt_templates()

    image_rel = item.get("image")
    image_path = REPO_ROOT / "evals" / image_rel if image_rel else None
    has_image = image_path is not None and image_path.exists()

    text_input = None if has_image else item.get("canonical")
    user_prompt = prompt_loader.render_user_prompt(
        user_template,
        grade=item.get("grade"),
        subject=item.get("subject"),
        locale="az",
        text=text_input,
    )

    try:
        parsed, usage, latency_ms, raw_text = llm_client.call_vision_llm(
            cfg,
            system_prompt,
            user_prompt,
            image_path=str(image_path) if has_image else None,
        )
    except Exception as exc:  # noqa: BLE001 — hər provayder xətası fərqlidir, hamısı "error" kimi qeyd olunur
        return {
            "id": item.get("id"),
            "status": "error",
            "raw_output": None,
            "usage": None,
            "latency_ms": None,
            "error": str(exc),
        }

    if parsed is None:
        return {
            "id": item.get("id"),
            "status": "error",
            "raw_output": None,
            "usage": usage,
            "latency_ms": latency_ms,
            "error": "model çıxışı JSON deyil (parse xətası)",
        }

    return {
        "id": item.get("id"),
        "status": "ok",
        "raw_output": parsed,
        "usage": usage,
        "latency_ms": latency_ms,
        "error": None,
    }


PIPELINES = {"A": run_pipeline_a, "B": run_pipeline_b}
