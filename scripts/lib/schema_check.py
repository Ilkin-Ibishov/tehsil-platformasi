"""STEP-SCHEMA.json-a qarşı validasiya. Sərbəst mətn qəbul edilmir — tam JSON obyekti gözlənilir."""

import json
import math
from pathlib import Path

from jsonschema import Draft7Validator

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "docs" / "STEP-SCHEMA.json"

_validator = None
_schema = None


def load_schema():
    global _schema
    if _schema is None:
        _schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    return _schema


def _get_validator():
    global _validator
    if _validator is None:
        _validator = Draft7Validator(load_schema())
    return _validator


def collect_enum_values(node=None, path="", exclude_prefixes=("verification",)):
    """Sxemi rekursiv gəzib hər `enum`/`const` dəyərini (yol, dəyərlər) kimi qaytarır.
    `exclude_prefixes`-də adı olan sahələr (default: `verification` — serverdə doldurulur,
    model onu yazmır) və onların içi tamamilə keçilir. Prompt↔sxem invariant testi (86eyhnv2r)
    üçün: modelin yazacağı hər enum dəyəri promptda hərfi-hərfinə olmalıdır."""
    if node is None:
        node = load_schema()

    results = []
    if isinstance(node, dict):
        if "enum" in node:
            results.append((path, list(node["enum"])))
        if "const" in node:
            results.append((path, [node["const"]]))
        for key, value in node.items():
            if key in ("enum", "const"):
                continue
            new_path = f"{path}.{key}" if path else key
            if key in exclude_prefixes:
                continue
            results.extend(collect_enum_values(value, new_path, exclude_prefixes))
    elif isinstance(node, list):
        for i, item in enumerate(node):
            results.extend(collect_enum_values(item, f"{path}[{i}]", exclude_prefixes))
    return results


def _is_finite_number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _extra_keys(obj, allowed):
    return any(k not in allowed for k in obj)


def parse_visual(raw):
    """`web/lib/visual.ts` `parseVisual` — naməlum kind / əlavə sahə → None."""
    if not isinstance(raw, dict):
        return None
    kind = raw.get("kind")
    if kind == "none":
        if _extra_keys(raw, {"kind"}):
            return None
        return {"kind": "none"}
    if kind == "linear":
        if _extra_keys(raw, {"kind", "k", "b"}):
            return None
        if not _is_finite_number(raw.get("k")) or not _is_finite_number(raw.get("b")):
            return None
        return {"kind": "linear", "k": raw["k"], "b": raw["b"]}
    if kind == "quadratic":
        if _extra_keys(raw, {"kind", "a", "b", "c"}):
            return None
        if (
            not _is_finite_number(raw.get("a"))
            or not _is_finite_number(raw.get("b"))
            or not _is_finite_number(raw.get("c"))
        ):
            return None
        return {"kind": "quadratic", "a": raw["a"], "b": raw["b"], "c": raw["c"]}
    if kind == "number_line":
        if _extra_keys(raw, {"kind", "min", "max", "points"}):
            return None
        if not _is_finite_number(raw.get("min")) or not _is_finite_number(raw.get("max")) or raw["max"] <= raw["min"]:
            return None
        points_raw = raw.get("points")
        if not isinstance(points_raw, list) or len(points_raw) > 8:
            return None
        points = []
        for p in points_raw:
            if not isinstance(p, dict):
                return None
            if _extra_keys(p, {"x", "label", "open"}):
                return None
            if not _is_finite_number(p.get("x")):
                return None
            label = p.get("label")
            if label is not None and (not isinstance(label, str) or len(label) > 16):
                return None
            open_pt = p.get("open")
            if open_pt is not None and not isinstance(open_pt, bool):
                return None
            pt = {"x": p["x"]}
            if label is not None:
                pt["label"] = label
            if open_pt is True:
                pt["open"] = True
            points.append(pt)
        return {"kind": "number_line", "min": raw["min"], "max": raw["max"], "points": points}
    return None


def strip_unknown_visual(obj):
    """Production `stripUnknownVisual`: naməlum visual atılır, qalan JSON saxlanır (ADR-031)."""
    if not isinstance(obj, dict) or "visual" not in obj:
        return obj
    next_obj = dict(obj)
    parsed = parse_visual(obj["visual"])
    if parsed is not None:
        next_obj["visual"] = parsed
    else:
        del next_obj["visual"]
    return next_obj


def validate(obj):
    """(is_valid, error_messages) qaytarır. obj None və ya dict deyilsə tək xəta ilə uğursuz olur.
    Naməlum `visual` üçün əvvəl `strip_unknown_visual` çağır — xam `validate` sxem müqaviləsidir."""
    if not isinstance(obj, dict):
        return False, ["model çıxışı JSON obyekti deyil"]
    validator = _get_validator()
    errors = sorted(validator.iter_errors(obj), key=lambda e: e.path)
    if not errors:
        return True, []
    messages = [f"{'/'.join(str(p) for p in e.path) or '<root>'}: {e.message}" for e in errors]
    return False, messages
