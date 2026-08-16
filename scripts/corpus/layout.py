"""DIM-tərzi iki sütunlu səhifədə sual nömrəsi + kəsmə qutusu — vision YOX.

`pdf_to_golden_set.py` və `corpus/pdf_to_crops.py` eyni heuristikanı paylaşır.
"""

from collections import defaultdict


def parse_range(spec: str) -> range:
    """'0-7' -> range(0, 8)."""
    lo, hi = spec.split("-")
    return range(int(lo), int(hi) + 1)


def parse_col_x_ranges(spec: str) -> list[tuple[float, float]]:
    out = []
    for part in spec.split(","):
        lo, hi = part.split("-")
        out.append((float(lo), float(hi)))
    return out


def find_question_labels(doc, question_pages: range, col_x_ranges, n_questions: int, *, strict: bool = True):
    """Sual nömrələrini ardıcıl tapır. Hər etiket: dict(page, num, y0, col)."""
    expected = 1
    labels = []
    for pi in question_pages:
        if expected > n_questions:
            break
        p = doc[pi]
        page_mid = p.rect.width / 2
        words = p.get_text("words")
        cands = []
        for w in words:
            x0, y0, _x1, _y1, text = w[0], w[1], w[2], w[3], w[4]
            t = text.strip().rstrip(".").rstrip(")")
            if not t.isdigit():
                continue
            if any(lo <= x0 <= hi for lo, hi in col_x_ranges):
                cands.append((x0, y0, int(t)))
        col1 = sorted([c for c in cands if c[0] < page_mid], key=lambda c: c[1])
        col2 = sorted([c for c in cands if c[0] >= page_mid], key=lambda c: c[1])
        for x0, y0, val in col1 + col2:
            if val == expected:
                col = 1 if x0 < page_mid else 2
                labels.append({"page": pi, "num": expected, "y0": y0, "col": col})
                expected += 1
                if expected > n_questions:
                    break
    missing = set(range(1, n_questions + 1)) - {l["num"] for l in labels}
    if missing and strict:
        raise RuntimeError(
            f"Sual nömrələri tapılmadı: {sorted(missing)} — col_x_ranges/n_questions-u yoxla."
        )
    return labels, sorted(missing)


def compute_crop_boxes(doc, labels, top_margin=6, footer_margin=20):
    by_pc = defaultdict(list)
    for lab in labels:
        by_pc[(lab["page"], lab["col"])].append(lab)
    for k in by_pc:
        by_pc[k].sort(key=lambda item: item["y0"])

    boxes = []
    for lab in labels:
        p = doc[lab["page"]]
        page_w, page_h = p.rect.width, p.rect.height
        page_mid = page_w / 2
        siblings = by_pc[(lab["page"], lab["col"])]
        idx = siblings.index(lab)
        y_top = max(0, lab["y0"] - top_margin)
        y_bottom = siblings[idx + 1]["y0"] - top_margin if idx + 1 < len(siblings) else page_h - footer_margin
        x_left = 20 if lab["col"] == 1 else page_mid - 5
        x_right = page_mid + 5 if lab["col"] == 1 else page_w - 15
        x0, y0, x1, y1 = x_left, y_top, x_right, y_bottom
        boxes.append(
            {
                "num": lab["num"],
                "page": lab["page"],
                "rect": [x0, y0, x1, y1],
                "bbox": {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0},
            }
        )
    return boxes
