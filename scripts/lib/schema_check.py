"""STEP-SCHEMA.json-a qarşı validasiya. Sərbəst mətn qəbul edilmir — tam JSON obyekti gözlənilir."""

import json
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


def validate(obj):
    """(is_valid, error_messages) qaytarır. obj None və ya dict deyilsə tək xəta ilə uğursuz olur."""
    if not isinstance(obj, dict):
        return False, ["model çıxışı JSON obyekti deyil"]
    validator = _get_validator()
    errors = sorted(validator.iter_errors(obj), key=lambda e: e.path)
    if not errors:
        return True, []
    messages = [f"{'/'.join(str(p) for p in e.path) or '<root>'}: {e.message}" for e in errors]
    return False, messages
