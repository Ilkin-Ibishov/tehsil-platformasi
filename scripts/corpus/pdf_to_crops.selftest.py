#!/usr/bin/env python3
"""Synthetic two-column PDF → ≥20 crops. Vision/network YOX.

    python scripts/corpus/pdf_to_crops.selftest.py
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    raise SystemExit("pip install pymupdf")

from layout import compute_crop_boxes, find_question_labels, parse_col_x_ranges, parse_range
from pdf_to_crops import crop_jpeg, main as crops_main, sanitize_pdf_ref

fails = 0


def check(label: str, got, expected) -> None:
    global fails
    ok = got == expected
    if not ok:
        fails += 1
    print(f"{'PASS' if ok else 'FAIL'}  {label} -> {got!r} (expected {expected!r})")


def make_synthetic_pdf(path: Path, n_questions: int = 24, per_page: int = 8) -> None:
    """Two-column A4. Left column fills first (1,2,3…), then right — DIM layout.py sırası."""
    doc = fitz.open()
    n_pages = (n_questions + per_page - 1) // per_page
    q = 1
    rows = per_page // 2
    for _ in range(n_pages):
        page = doc.new_page(width=595, height=842)
        page_nums: list[int] = []
        for _i in range(per_page):
            if q > n_questions:
                break
            page_nums.append(q)
            q += 1
        left = page_nums[:rows]
        right = page_nums[rows:]
        for row, num in enumerate(left):
            y = 60 + row * 180
            page.insert_text((50, y), f"{num}.", fontsize=14)
            page.insert_text((74, y), "2x+3=7", fontsize=11)
        for row, num in enumerate(right):
            y = 60 + row * 180
            page.insert_text((320, y), f"{num}.", fontsize=14)
            page.insert_text((344, y), "2x+3=7", fontsize=11)
    doc.save(path)
    doc.close()


def run() -> int:
    check("sanitize", sanitize_pdf_ref("DIM 2025 v1.pdf"), "dim-2025-v1.pdf")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        pdf = tmp_path / "synthetic.pdf"
        make_synthetic_pdf(pdf, 24)
        out = tmp_path / "crops"
        rc = crops_main(
            [
                "--pdf",
                str(pdf),
                "--question-pages",
                "0-2",
                "--n-questions",
                "24",
                "--pdf-ref",
                "synthetic-selftest",
                "--out-dir",
                str(out),
                "--qa-count",
                "5",
                "--sample-every",
                "20",
            ]
        )
        check("exit 0", rc, 0)
        jpgs = sorted(out.glob("q*.jpg"))
        check(">=20 crops", len(jpgs) >= 20, True)
        check("exactly 24", len(jpgs), 24)
        check("bbox.json", (out / "bbox.json").is_file(), True)
        qa = list((out / "qa").glob("q*.jpg"))
        check("qa 5", len(qa), 5)

        doc = fitz.open(pdf)
        labels, missing = find_question_labels(
            doc, parse_range("0-2"), parse_col_x_ranges("40-75,300-340"), 24, strict=True
        )
        check("missing none", missing, [])
        boxes = compute_crop_boxes(doc, labels)
        check("24 boxes", len(boxes), 24)
        jpeg, _w, _h = crop_jpeg(doc[boxes[0]["page"]], boxes[0]["rect"], 2.0)
        check("jpeg bytes", jpeg[:2], b"\xff\xd8")
        doc.close()

    if fails:
        print(f"\n{fails} failed")
        return 1
    print("\nall passed")
    return 0


if __name__ == "__main__":
    sys.exit(run())
