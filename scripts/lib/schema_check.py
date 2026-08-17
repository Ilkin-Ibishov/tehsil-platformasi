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
    if kind == "triangle":
        if _extra_keys(raw, {"kind", "vertices", "sides", "angles", "highlight"}):
            return None
        vertices_raw = raw.get("vertices")
        if not isinstance(vertices_raw, list) or len(vertices_raw) != 3:
            return None
        vertices = []
        for v in vertices_raw:
            if not isinstance(v, dict) or _extra_keys(v, {"x", "y", "label"}):
                return None
            if not _is_finite_number(v.get("x")) or not _is_finite_number(v.get("y")):
                return None
            label = v.get("label")
            if label is not None and (not isinstance(label, str) or len(label) > 8):
                return None
            pt = {"x": v["x"], "y": v["y"]}
            if label is not None:
                pt["label"] = label
            vertices.append(pt)
        out = {"kind": "triangle", "vertices": vertices}
        if "sides" in raw:
            sides_raw = raw["sides"]
            if not isinstance(sides_raw, list) or len(sides_raw) > 3:
                return None
            sides = []
            for s in sides_raw:
                if not isinstance(s, dict) or _extra_keys(s, {"from", "to", "label"}):
                    return None
                if not isinstance(s.get("from"), str) or len(s["from"]) > 8:
                    return None
                if not isinstance(s.get("to"), str) or len(s["to"]) > 8:
                    return None
                side = {"from": s["from"], "to": s["to"]}
                lab = s.get("label")
                if lab is not None:
                    if not isinstance(lab, str) or len(lab) > 12:
                        return None
                    side["label"] = lab
                sides.append(side)
            out["sides"] = sides
        if "angles" in raw:
            angles_raw = raw["angles"]
            if not isinstance(angles_raw, list) or len(angles_raw) > 3:
                return None
            angles = []
            for a in angles_raw:
                if not isinstance(a, dict) or _extra_keys(a, {"at", "label"}):
                    return None
                if not isinstance(a.get("at"), str) or len(a["at"]) > 8:
                    return None
                if not isinstance(a.get("label"), str) or len(a["label"]) > 12:
                    return None
                angles.append({"at": a["at"], "label": a["label"]})
            out["angles"] = angles
        highlight = raw.get("highlight")
        if highlight is not None:
            if not isinstance(highlight, str) or len(highlight) > 16:
                return None
            out["highlight"] = highlight
        return out
    if kind == "circle":
        if _extra_keys(raw, {"kind", "center", "r", "radius_label", "chord", "tangent"}):
            return None
        center = raw.get("center")
        if not isinstance(center, dict) or _extra_keys(center, {"x", "y", "label"}):
            return None
        if not _is_finite_number(center.get("x")) or not _is_finite_number(center.get("y")):
            return None
        if not _is_finite_number(raw.get("r")) or raw["r"] <= 0:
            return None
        c = {"x": center["x"], "y": center["y"]}
        if center.get("label") is not None:
            if not isinstance(center["label"], str) or len(center["label"]) > 8:
                return None
            c["label"] = center["label"]
        out = {"kind": "circle", "center": c, "r": raw["r"]}
        rlab = raw.get("radius_label")
        if rlab is not None:
            if not isinstance(rlab, str) or len(rlab) > 8:
                return None
            out["radius_label"] = rlab
        for key in ("chord", "tangent"):
            if key not in raw:
                continue
            seg = _parse_segment(raw[key])
            if seg is None:
                return None
            out[key] = seg
        return out
    if kind == "force_diagram":
        if _extra_keys(raw, {"kind", "body", "forces"}):
            return None
        if not isinstance(raw.get("body"), str) or len(raw["body"]) > 16:
            return None
        forces_raw = raw.get("forces")
        if not isinstance(forces_raw, list) or not (1 <= len(forces_raw) <= 8):
            return None
        forces = []
        for f in forces_raw:
            if not isinstance(f, dict) or _extra_keys(f, {"label", "dir_deg", "rel"}):
                return None
            if not isinstance(f.get("label"), str) or len(f["label"]) > 12:
                return None
            if not _is_finite_number(f.get("dir_deg")) or not _is_finite_number(f.get("rel")):
                return None
            if f["rel"] <= 0 or f["rel"] > 2:
                return None
            forces.append({"label": f["label"], "dir_deg": f["dir_deg"], "rel": f["rel"]})
        return {"kind": "force_diagram", "body": raw["body"], "forces": forces}
    if kind == "cartesian":
        if _extra_keys(raw, {"kind", "points", "label", "x_min", "x_max", "y_min", "y_max"}):
            return None
        pts_raw = raw.get("points")
        if not isinstance(pts_raw, list) or not (2 <= len(pts_raw) <= 40):
            return None
        points = []
        for p in pts_raw:
            if not isinstance(p, dict) or _extra_keys(p, {"x", "y"}):
                return None
            if not _is_finite_number(p.get("x")) or not _is_finite_number(p.get("y")):
                return None
            points.append({"x": p["x"], "y": p["y"]})
        out = {"kind": "cartesian", "points": points}
        lab = raw.get("label")
        if lab is not None:
            if not isinstance(lab, str) or len(lab) > 24:
                return None
            out["label"] = lab
        for key in ("x_min", "x_max", "y_min", "y_max"):
            if key in raw:
                if not _is_finite_number(raw[key]):
                    return None
                out[key] = raw[key]
        if "x_min" in out and "x_max" in out and out["x_max"] <= out["x_min"]:
            return None
        if "y_min" in out and "y_max" in out and out["y_max"] <= out["y_min"]:
            return None
        return out
    return None


def _parse_segment(raw):
    if not isinstance(raw, dict) or _extra_keys(raw, {"x1", "y1", "x2", "y2", "label"}):
        return None
    if not all(_is_finite_number(raw.get(k)) for k in ("x1", "y1", "x2", "y2")):
        return None
    seg = {"x1": raw["x1"], "y1": raw["y1"], "x2": raw["x2"], "y2": raw["y2"]}
    lab = raw.get("label")
    if lab is not None:
        if not isinstance(lab, str) or len(lab) > 12:
            return None
        seg["label"] = lab
    return seg


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
