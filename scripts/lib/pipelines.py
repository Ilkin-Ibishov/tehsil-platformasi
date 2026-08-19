"""İki boru xətti. Hər ikisi eyni imzaya malikdir:
    run(item, cfg) -> dict(id, status, raw_output, usage, latency_ms, error)

status: "ok" | "not_implemented" | "error" | "failed"

`failed` = API 503/429/timeout retry-dan sonra. n_attempted-ə daxil DEYİL.
`error` = parse / şəkil / konfiq — cəhd sayılır.
"""

from pathlib import Path

from . import llm_client, prompt_loader

REPO_ROOT = Path(__file__).resolve().parents[2]


def eval_image_path(image_rel, repo_root=REPO_ROOT):
    """golden-set `image` sahəsi `evals/`-ə nisbidir (`images/photo_….jpg`).
    `evals/images/` gitignore-dadır — Glob/indeks onu görmür, pathlib görməlidir."""
    if not image_rel:
        return None
    return repo_root / "evals" / image_rel


def resolve_eval_media(item, repo_root=REPO_ROOT, force_text=False):
    """(image_path, text_input, error). Şəkil yazılıb amma diskdə yoxdursa səssiz
    mətn yoluna KEÇMİR — əvvəlki 'evals/images yoxdur' skip-inin kökü bu idi."""
    canonical = item.get("canonical")
    image_rel = item.get("image")
    if force_text:
        if not canonical:
            return None, None, "force_text: canonical yoxdur"
        return None, canonical, None
    if image_rel:
        image_path = eval_image_path(image_rel, repo_root)
        if image_path.exists():
            return image_path, None, None
        return None, None, f"şəkil tapılmadı: {image_path}"
    return None, canonical, None


def _error_result(item, error, status="error", **extra):
    out = {
        "id": item.get("id"),
        "status": status,
        "raw_output": None,
        "raw_text": None,
        "usage": None,
        "latency_ms": None,
        "attempts": None,
        "image_meta": None,
        "error": error,
    }
    out.update(extra)
    return out


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
    """B = Vision LLM tək çağırış → sxem. `--text` olanda şəkil yox, canonical."""
    force_text = bool(getattr(cfg, "force_text", False))
    image_path, text_input, media_error = resolve_eval_media(
        item, force_text=force_text
    )
    if media_error:
        return _error_result(item, media_error)

    has_image = image_path is not None
    has_figure = bool(item.get("has_figure"))
    include_image_rules = has_figure if force_text else has_image
    system_prompt, user_template = prompt_loader.load_prompt_templates(
        subject=item.get("subject"),
        topic_code=item.get("topic_code"),
        include_image_rules=include_image_rules,
    )
    user_prompt = prompt_loader.render_user_prompt(
        user_template,
        grade=item.get("grade"),
        subject=item.get("subject"),
        locale="az",
        text=text_input,
    )

    models_to_try = [cfg.model]
    fallbacks = getattr(cfg, "fallback_models", None) or []
    models_to_try.extend(m for m in fallbacks if m != cfg.model)

    model_used = cfg.model
    fallback_from = None
    use_fast_fallback = bool(getattr(cfg, "fallback_models", None))
    for i, model_id in enumerate(models_to_try):
        try_cfg = cfg
        if i > 0:
            import copy
            try_cfg = copy.copy(cfg)
            try_cfg.model = model_id
            fallback_from = models_to_try[i - 1]
        if use_fast_fallback:
            # Production policy: 2 consecutive 503 -> next model in registry.
            try_cfg.max_attempts = 2

        try:
            parsed, usage, latency_ms, raw_text, attempts, image_meta = llm_client.call_vision_llm(
                try_cfg,
                system_prompt,
                user_prompt,
                image_path=str(image_path) if has_image else None,
            )
            model_used = model_id
            break
        except llm_client.APIFailure as exc:
            if i < len(models_to_try) - 1 and "503" in str(exc):
                import sys
                print(f"\n⚠ {model_id} failed ({exc}), falling back to {models_to_try[i+1]}", file=sys.stderr)
                continue
            return _error_result(item, str(exc), status="failed", attempts=exc.attempts)
        except Exception as exc:  # noqa: BLE001
            return _error_result(item, str(exc))

    if parsed is None:
        return _error_result(
            item,
            "model çıxışı JSON deyil (parse xətası)",
            raw_text=raw_text,
            usage=usage,
            latency_ms=latency_ms,
            attempts=attempts,
            image_meta=image_meta,
            model_used=model_used,
        )

    return {
        "id": item.get("id"),
        "status": "ok",
        "raw_output": parsed,
        "raw_text": raw_text,
        "usage": usage,
        "latency_ms": latency_ms,
        "attempts": attempts,
        "image_meta": image_meta,
        "error": None,
        "model_used": model_used,
        "fallback_from": fallback_from if model_used != cfg.model else None,
    }


PIPELINES = {"A": run_pipeline_a, "B": run_pipeline_b}
