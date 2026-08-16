#!/usr/bin/env python3
"""PDF → kəsik. Faza 2 S1. Vision YOX — mətn mövqeyi heuristikası (layout.py).

DİM PDF və kəsiklər git-ə düşmür. DİM mətni DB-yə yazılmır (ADR-016).

    python scripts/corpus/pdf_to_crops.py --pdf path/to.pdf --question-pages 0-7 --n-questions 100 --upload

`--upload` üçün `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (web/.env.local).
Açar stdout-a düşmür.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    raise SystemExit("pip install pymupdf")

from layout import compute_crop_boxes, find_question_labels, parse_col_x_ranges, parse_range

ROOT = Path(__file__).resolve().parents[2]
SAFE_REF = re.compile(r"[^a-zA-Z0-9._-]+")


def sanitize_pdf_ref(raw: str) -> str:
    cleaned = SAFE_REF.sub("-", raw).strip("-").lower()
    return cleaned or "pdf"


def load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(ROOT / "web" / ".env.local")
    load_dotenv(ROOT / ".env")


def crop_jpeg(page, rect: list[float], zoom: float) -> tuple[bytes, int, int]:
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, clip=fitz.Rect(*rect))
    return pix.tobytes("jpeg"), pix.width, pix.height


def write_crop(path: Path, jpeg: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(jpeg)


def upload_object(base_url: str, key: str, object_path: str, jpeg: bytes) -> bool:
    import httpx

    url = f"{base_url.rstrip('/')}/storage/v1/object/corpus/{object_path}"
    res = httpx.post(
        url,
        headers={
            "Authorization": f"Bearer {key}",
            "apikey": key,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        },
        content=jpeg,
        timeout=60.0,
    )
    if not res.is_success:
        print(f"storage {res.status_code} {object_path}", file=sys.stderr)
        return False
    return True


def upsert_row(base_url: str, key: str, row: dict) -> bool:
    import httpx

    url = f"{base_url.rstrip('/')}/rest/v1/corpus_crops"
    res = httpx.post(
        url,
        headers={
            "Authorization": f"Bearer {key}",
            "apikey": key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        params={"on_conflict": "pdf_ref,page,label"},
        json=row,
        timeout=30.0,
    )
    if not res.is_success:
        print(f"rest {res.status_code} {row.get('label')}", file=sys.stderr)
        return False
    return True


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--question-pages", required=True, help="məs. 0-7 (0-based, daxil)")
    ap.add_argument("--n-questions", type=int, default=100)
    ap.add_argument("--pdf-ref", default="", help="default: PDF fayl adı")
    ap.add_argument("--out-dir", default="", help="default: tmp/corpus/<pdf-ref>/")
    ap.add_argument("--col-x-ranges", default="40-75,300-340")
    ap.add_argument("--zoom", type=float, default=2.0)
    ap.add_argument("--upload", action="store_true")
    ap.add_argument("--sample-every", type=int, default=20)
    ap.add_argument("--qa-count", type=int, default=5)
    args = ap.parse_args(argv)

    load_env()
    pdf_path = Path(args.pdf)
    if not pdf_path.is_file():
        print(f"PDF yoxdur: {pdf_path}", file=sys.stderr)
        return 2

    pdf_ref = sanitize_pdf_ref(args.pdf_ref or pdf_path.stem)
    out_dir = Path(args.out_dir) if args.out_dir else ROOT / "tmp" / "corpus" / pdf_ref
    qa_dir = out_dir / "qa"
    col_x_ranges = parse_col_x_ranges(args.col_x_ranges)

    doc = fitz.open(pdf_path)
    pages = parse_range(args.question_pages)
    labels, missing = find_question_labels(doc, pages, col_x_ranges, args.n_questions, strict=False)
    boxes = compute_crop_boxes(doc, labels)

    manifest = {
        "pdf_ref": pdf_ref,
        "source_name": pdf_path.name,
        "n_found": len(boxes),
        "missing": missing,
        "crops": [],
    }

    uploaded = 0
    base_url = os.environ.get("SUPABASE_URL", "").strip()
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if args.upload and (not base_url or not service_key):
        print("upload requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        return 2

    sample_paths: list[Path] = []
    for i, box in enumerate(boxes):
        page = doc[box["page"]]
        jpeg, width, height = crop_jpeg(page, box["rect"], args.zoom)
        sha = hashlib.sha256(jpeg).hexdigest()
        label = f"{box['num']:03d}"
        local_path = out_dir / f"q{label}.jpg"
        write_crop(local_path, jpeg)
        object_path = f"{pdf_ref}/q{label}.jpg"
        entry = {
            "label": str(box["num"]),
            "page": box["page"],
            "bbox": box["bbox"],
            "image_sha256": sha,
            "storage_path": object_path if args.upload else None,
            "width": width,
            "height": height,
            "bytes": len(jpeg),
            "local_path": str(local_path),
        }
        if args.upload:
            ok_obj = upload_object(base_url, service_key, object_path, jpeg)
            row = {
                "pdf_ref": pdf_ref,
                "page": box["page"],
                "label": str(box["num"]),
                "bbox": box["bbox"],
                "storage_path": object_path if ok_obj else None,
                "image_sha256": sha,
                "width": entry["width"],
                "height": entry["height"],
                "bytes": entry["bytes"],
            }
            ok_row = upsert_row(base_url, service_key, row)
            if ok_obj and ok_row:
                uploaded += 1
        manifest["crops"].append(entry)
        if args.sample_every > 0 and i % args.sample_every == 0:
            sample_paths.append(local_path)

    qa_dir.mkdir(parents=True, exist_ok=True)
    qa_taken = sample_paths[: args.qa_count] if args.qa_count else []
    if len(qa_taken) < args.qa_count:
        for box in boxes:
            p = out_dir / f"q{box['num']:03d}.jpg"
            if p not in qa_taken:
                qa_taken.append(p)
            if len(qa_taken) >= args.qa_count:
                break
    for p in qa_taken:
        dest = qa_dir / p.name
        if p.exists() and p.resolve() != dest.resolve():
            dest.write_bytes(p.read_bytes())

    manifest_path = out_dir / "bbox.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"found={len(boxes)} missing={len(missing)} dir={out_dir}")
    if missing:
        print(f"missing labels: {missing}")
    print("qa samples:")
    for p in qa_taken:
        print(f"  {qa_dir / p.name}")
    if args.upload:
        print(f"uploaded={uploaded}/{len(boxes)}")
    if not boxes:
        return 1
    if missing:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
