"""Provider-agnostik LLM çağırışı. Heç bir provayderə hardcode yoxdur — OpenAI-uyğun
`/chat/completions` interfeysi işlədilir (əksər providerlər, o cümlədən Flash sinifli
vision modellər, bu formatı dəstəkləyir və ya proxy arxasında təqdim edir).

Konfiqurasiya .env-dən:
  MODEL, API_KEY, BASE_URL           — məcburi
  PRICE_INPUT_PER_1M, PRICE_OUTPUT_PER_1M  — xərc hesablaması üçün, verilməsə xərc None qalır
"""

import base64
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()


class ConfigError(RuntimeError):
    pass


@dataclass
class LLMConfig:
    model: str
    api_key: str
    base_url: str
    price_input_per_1m: Optional[float]
    price_output_per_1m: Optional[float]
    temperature: float = 0.2


def load_config():
    model = os.environ.get("MODEL")
    api_key = os.environ.get("API_KEY")
    base_url = os.environ.get("BASE_URL")
    missing = [name for name, val in [("MODEL", model), ("API_KEY", api_key), ("BASE_URL", base_url)] if not val]
    if missing:
        raise ConfigError(
            f".env-də çatışmayan dəyişənlər: {', '.join(missing)}. "
            "MODEL, API_KEY, BASE_URL təyin olunmalıdır."
        )
    price_in = os.environ.get("PRICE_INPUT_PER_1M")
    price_out = os.environ.get("PRICE_OUTPUT_PER_1M")
    return LLMConfig(
        model=model,
        api_key=api_key,
        base_url=base_url.rstrip("/"),
        price_input_per_1m=float(price_in) if price_in else None,
        price_output_per_1m=float(price_out) if price_out else None,
    )


def _image_content(image_path):
    data = Path(image_path).read_bytes()
    encoded = base64.b64encode(data).decode("ascii")
    suffix = Path(image_path).suffix.lstrip(".").lower() or "jpeg"
    return {"type": "image_url", "image_url": {"url": f"data:image/{suffix};base64,{encoded}"}}


def call_vision_llm(cfg, system_prompt, user_prompt, image_path=None):
    """Bir çağırış edir, (parsed_json, usage, latency_ms, raw_text) qaytarır.
    parsed_json None-dursa cavab JSON kimi parse edilə bilmədi (raw_text-ə bax)."""
    content = [{"type": "text", "text": user_prompt}]
    if image_path:
        content.append(_image_content(image_path))

    payload = {
        "model": cfg.model,
        "temperature": cfg.temperature,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content if image_path else user_prompt},
        ],
    }

    started = time.perf_counter()
    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            f"{cfg.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {cfg.api_key}", "Content-Type": "application/json"},
            json=payload,
        )
    latency_ms = (time.perf_counter() - started) * 1000

    resp.raise_for_status()
    body = resp.json()
    raw_text = body["choices"][0]["message"]["content"]
    usage = body.get("usage")

    import json as _json

    try:
        parsed = _json.loads(raw_text)
    except (ValueError, TypeError):
        parsed = None

    return parsed, usage, latency_ms, raw_text
