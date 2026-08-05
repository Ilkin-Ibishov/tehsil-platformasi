"""STEP-SCHEMA.json-a qarşı validasiya. Sərbəst mətn qəbul edilmir — tam JSON obyekti gözlənilir."""

import json
from pathlib import Path

from jsonschema import Draft7Validator

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "docs" / "STEP-SCHEMA.json"

_validator = None


def _get_validator():
    global _validator
    if _validator is None:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        _validator = Draft7Validator(schema)
    return _validator


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
