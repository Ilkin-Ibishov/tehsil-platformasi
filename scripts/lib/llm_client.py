"""Provider-agnostik LLM çağırışı. Heç bir provayderə hardcode yoxdur — OpenAI-uyğun
`/chat/completions` interfeysi işlədilir (əksər providerlər, o cümlədən Flash sinifli
vision modellər, bu formatı dəstəkləyir və ya proxy arxasında təqdim edir).

Konfiqurasiya .env-dən:
  MODEL, API_KEY, BASE_URL           — məcburi
  PRICE_INPUT_PER_1M, PRICE_OUTPUT_PER_1M  — xərc hesablaması üçün, verilməsə xərc None qalır
  JSON_MODE=0                        — response_format={"type":"json_object"}-i söndürür
                                        (bəzi provayderlər dəstəkləmir, 400 qaytarır)
  IMAGE_MAX_PX                       — şəkil kiçiltmə hədəfi (default 1600), --image-max-px ilə üstələnir

ADR-006: real telefon şəkilləri (HEIC, EXIF döndərilmiş, 4-8MB) üçün ön emal burada olur.
"""

import base64
import io
import os
import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

# cwd-dən asılı olmayaraq repo kökündəki .env — əks halda `scripts/`-dən işlədəndə
# MODEL/API_KEY tapılmır və vision eval "skip" kimi görünür.
_REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_REPO_ROOT / ".env")

# Match web/lib/llm.ts RETRYABLE_STATUS / exponential backoff. Eval is a batch
# job: 5 attempts (llm.ts uses 3) because 2026-08-17 vision 8/10 died on 503/timeout.
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
MAX_ATTEMPTS = 5
RETRY_BASE_DELAY_S = 4.0
HTTP_TIMEOUT_S = 120.0


class ConfigError(RuntimeError):
    pass


class APIFailure(RuntimeError):
    """503/429/5xx/timeout after retries. Eval records `failed` — not a wrong answer."""

    def __init__(self, message, attempts=None):
        super().__init__(message)
        self.attempts = attempts


@dataclass
class LLMConfig:
    model: str
    api_key: str
    base_url: str
    price_input_per_1m: Optional[float]
    price_output_per_1m: Optional[float]
    temperature: float = 0.2
    json_mode: bool = True
    image_max_px: int = 1600
    force_text: bool = False


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
    json_mode_raw = os.environ.get("JSON_MODE", "1").strip().lower()
    json_mode = json_mode_raw not in ("0", "false", "no")
    image_max_px = int(os.environ.get("IMAGE_MAX_PX", "1600"))
    return LLMConfig(
        model=model,
        api_key=api_key,
        base_url=base_url.rstrip("/"),
        price_input_per_1m=float(price_in) if price_in else None,
        price_output_per_1m=float(price_out) if price_out else None,
        json_mode=json_mode,
        image_max_px=image_max_px,
    )


def _ensure_heif_support(path):
    if path.suffix.lstrip(".").lower() not in ("heic", "heif"):
        return
    try:
        import pillow_heif

        pillow_heif.register_heif_opener()
    except ImportError as exc:
        raise RuntimeError(
            f"{path.name} HEIC/HEIF formatındadır, amma pillow-heif quraşdırılmayıb "
            "(`pip install -r scripts/requirements.txt`). Səssiz uğursuzluq yoxdur — bu xətanı düzəlt."
        ) from exc


def _image_content(image_path, max_px=1600, jpeg_quality=85):
    """Şəkli açır, EXIF-ə görə döndərir, RGB-yə çevirir (alfa-kanallı PNG/GIF JPEG kimi
    saxlanıla bilməz), ən uzun tərəfi max_px-ə kiçildir və HƏMİŞƏ JPEG kimi yenidən kodlayır.
    Bu, giriş formatından (HEIC/PNG/WEBP/JPG) asılı olmayaraq çıxış MIME-ni "image/jpeg"
    kimi sabitləyir — ayrıca uzantı→MIME xəritəsinə ehtiyac qalmır.

    (content_dict, meta) qaytarır. meta = {"image_px": "WxH", "image_bytes": N}.
    """
    try:
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise RuntimeError(
            "Pillow quraşdırılmayıb (`pip install -r scripts/requirements.txt`)."
        ) from exc

    path = Path(image_path)
    _ensure_heif_support(path)

    try:
        image = Image.open(path)
        image.load()
    except Exception as exc:  # noqa: BLE001 — PIL onlarla fərqli xəta növü ata bilər, hamısı aydın mesaja çevrilir
        raise RuntimeError(f"{path.name} şəkil kimi açıla bilmədi: {exc}") from exc

    image = ImageOps.exif_transpose(image)
    if image.mode != "RGB":
        image = image.convert("RGB")

    longest_side = max(image.size)
    if longest_side > max_px:
        scale = max_px / longest_side
        new_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
        image = image.resize(new_size, Image.LANCZOS)

    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=jpeg_quality)
    jpeg_bytes = buf.getvalue()
    encoded = base64.b64encode(jpeg_bytes).decode("ascii")

    content = {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded}"}}
    meta = {"image_px": f"{image.width}x{image.height}", "image_bytes": len(jpeg_bytes)}
    return content, meta


def _retry_delay_s(attempt, retry_after=None):
    """attempt is 1-based. Honors Retry-After seconds when the header is numeric."""
    delay = RETRY_BASE_DELAY_S * (2 ** (attempt - 1))
    if retry_after:
        try:
            delay = max(delay, float(retry_after))
        except (TypeError, ValueError):
            pass
    return delay * (0.5 + random.random())


def call_vision_llm(cfg, system_prompt, user_prompt, image_path=None):
    """Bir çağırış edir (429/5xx/timeout-da MAX_ATTEMPTS-ə qədər eksponensial retry),
    (parsed_json, usage, latency_ms, raw_text, attempts, image_meta) qaytarır.

    latency_ms YALNIZ son (uğurlu, ya da son uğursuz) cəhdin müddətidir — retry-lar
    arasındakı gözləmə DAXİL DEYİL, əks halda bir rate-limit bütün orta latensiya
    ölçüsünü korlayardı. Cəhd sayı `attempts`-də ayrıca görünür.

    Retry tükənəndə `APIFailure` atır — HTTPStatusError yox. Eval bunu `failed`
    kimi yazır və n_attempted-dən çıxarır (səhv cavab sayılmır).
    """
    image_meta = None
    content = [{"type": "text", "text": user_prompt}]
    if image_path:
        image_content, image_meta = _image_content(image_path, max_px=cfg.image_max_px)
        content.append(image_content)

    payload = {
        "model": cfg.model,
        "temperature": cfg.temperature,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content if image_path else user_prompt},
        ],
    }
    if cfg.json_mode:
        payload["response_format"] = {"type": "json_object"}

    url = f"{cfg.base_url}/chat/completions"
    headers = {"Authorization": f"Bearer {cfg.api_key}", "Content-Type": "application/json"}

    resp = None
    latency_ms = None
    attempts = 0
    last_exc = None
    with httpx.Client(timeout=HTTP_TIMEOUT_S) as client:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            attempts = attempt
            started = time.perf_counter()
            try:
                resp = client.post(url, headers=headers, json=payload)
            except httpx.TimeoutException as exc:
                latency_ms = (time.perf_counter() - started) * 1000
                last_exc = exc
                if attempt < MAX_ATTEMPTS:
                    time.sleep(_retry_delay_s(attempt))
                    continue
                raise APIFailure(
                    f"LLM timeout after {attempts} attempts ({HTTP_TIMEOUT_S:.0f}s)",
                    attempts=attempts,
                ) from exc
            except httpx.RequestError as exc:
                latency_ms = (time.perf_counter() - started) * 1000
                last_exc = exc
                if attempt < MAX_ATTEMPTS:
                    time.sleep(_retry_delay_s(attempt))
                    continue
                raise APIFailure(
                    f"LLM network error after {attempts} attempts: {exc}",
                    attempts=attempts,
                ) from exc
            latency_ms = (time.perf_counter() - started) * 1000

            if resp.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_ATTEMPTS:
                time.sleep(_retry_delay_s(attempt, resp.headers.get("Retry-After")))
                continue
            break

    if resp is None:
        raise APIFailure(
            str(last_exc) if last_exc else "LLM çağırışı cavabsız qaldı",
            attempts=attempts,
        )
    if resp.status_code in RETRYABLE_STATUS_CODES:
        raise APIFailure(
            f"LLM HTTP {resp.status_code} after {attempts} attempts",
            attempts=attempts,
        )
    resp.raise_for_status()
    body = resp.json()
    raw_text = body["choices"][0]["message"]["content"]
    usage = body.get("usage")

    import json as _json

    try:
        parsed = _json.loads(raw_text)
    except (ValueError, TypeError):
        parsed = None

    return parsed, usage, latency_ms, raw_text, attempts, image_meta
