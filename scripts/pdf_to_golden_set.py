#!/usr/bin/env python3
r"""pdf_to_golden_set.py — DIM-tərzi test PDF-indən avtomatlaşdırılmış golden-set qurur.

Ilkin-in tapşırığı (2026-08-15, HANDOFF 104/105): "şəkil -> həllər" boru xəttini çoxlu sayda
real sualla test etmək — LLM çağırışı OLMADAN (kəsmə tamamilə proqramla aparılır, mətn
mövqeyi əsasında), token xərci YALNIZ faktiki `scripts/eval.py --pipeline B` çağırışında yaranır.

NECƏ İŞLƏYİR
------------
1. PDF-i PyMuPDF (`pip install pymupdf`) ilə açır, hər səhifədəki söz-mövqelərini oxuyur.
2. Sual nömrələrini (1, 2, 3, ...) İKİ SÜTUNLU səhifə düzülüşündə (sol/sağ marjin
   x-koordinatına görə) ARDICIL uyğunlaşdıraraq tapır — YALNIZ ardıcıl gözlənilən ədədə tam
   bərabər olan, düzgün sütun mövqeyində olan token QƏBUL EDİLİR (təsadüfi düstur rəqəmləri
   YANLIŞLIQLA uyğun gəlməsin deyə).
3. Hər sualın kəsmə qutusu: öz nömrə etiketinin y-koordinatından EYNİ SÜTUNDAKI NÖVBƏTİ
   sualın y-koordinatına qədər (son sualsa səhifə sonuna qədər), sütunun tam eninə.
4. Hər səhifəni yüksək ayırdetmə ilə (ZOOM=3) render edir, kəsmə qutusunu tətbiq edir, PNG
   kimi saxlayır.
5. Cavab açarı səhifələrini (aralığı CLI-dən verilir) `\d{1,3}-[A-E]` naxışı ilə parse edir.
6. `evals/golden-set-<ad>.jsonl` yazır — mövcud `evals/README.md` sxeminə uyğun
   (`id`, `image`, `expected_choice`, `expected_status: "ok"`), YALNIZ bu üç sahə + mənbə
   qeydi. `canonical`/`final_answer_values` YAZILMIR (mətn ground truth yoxdur — məqsəd YALNIZ
   variant seçimi dəqiqliyini ölçməkdir, sxem validliyi/hallüsinasiya ilə yanaşı).

MƏHDUDİYYƏT (əl ilə yoxlanmalı): şəkil/diaqram-ağır suallarda (məs. konus/silindr kəsiyi
sualları) fiqurların öz koordinatları mətn axınından kənara düşə bilər — kəsmə qutusu boş
qala bilər. Script bunu AVTOMATİK aşkarlamır, `--preview-dir` ilə çıxan bütün PNG-ləri BİR
DƏFƏ göz gəzdirmək tövsiyə olunur (100 sualda 1-2 belə hal gözlənilən haldır).

İSTİFADƏ
--------
    pip install pymupdf
    python scripts/pdf_to_golden_set.py \
        --pdf "path/to/test-toplusu.pdf" \
        --question-pages 0-7 \
        --answer-key-pages 8-9 \
        --out-name dim-100test-2025 \
        --grade 11 --subject math

Çıxış: `evals/images/<out-name>/qNNN.png` (gitignored) + `evals/golden-set-<out-name>.jsonl`.

ADR-003 QEYDİ: orijinal PDF REPO-YA KOPYALANMIR, YALNIZ kəsilmiş sual şəkilləri (kiçik,
gitignored) və cavab HƏRFİ (sual mətni DEYİL) saxlanılır — DİM-in mətn ifadəsi hərfi
saxlanmır, YALNIZ "hansı variant düzgündür" məlumatı.
"""

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    raise SystemExit("pip install pymupdf")


def parse_range(spec: str) -> range:
    """'0-7' -> range(0,8). '8-9' -> range(8,10)."""
    lo, hi = spec.split("-")
    return range(int(lo), int(hi) + 1)


def find_question_labels(doc, question_pages: range, col_x_ranges, n_questions: int):
    """Sual nömrə etiketlərini ardıcıl (1..n_questions) tapır. Hər etiket: dict(page,num,y0,col)."""
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
            x0, y0, x1, y1, text = w[0], w[1], w[2], w[3], w[4]
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
    if missing:
        raise RuntimeError(
            f"Sual nömrələri tapılmadı: {sorted(missing)} — col_x_ranges/n_questions-u yoxla, "
            "PDF fərqli sütun mövqeyi/say işlədə bilər."
        )
    return labels


def compute_crop_boxes(doc, labels, top_margin=6, footer_margin=20):
    by_pc = defaultdict(list)
    for l in labels:
        by_pc[(l["page"], l["col"])].append(l)
    for k in by_pc:
        by_pc[k].sort(key=lambda l: l["y0"])

    boxes = []
    for l in labels:
        p = doc[l["page"]]
        page_w, page_h = p.rect.width, p.rect.height
        page_mid = page_w / 2
        siblings = by_pc[(l["page"], l["col"])]
        idx = siblings.index(l)
        y_top = max(0, l["y0"] - top_margin)
        y_bottom = siblings[idx + 1]["y0"] - top_margin if idx + 1 < len(siblings) else page_h - footer_margin
        x_left = 20 if l["col"] == 1 else page_mid - 5
        x_right = page_mid + 5 if l["col"] == 1 else page_w - 15
        boxes.append({"num": l["num"], "page": l["page"], "rect": [x_left, y_top, x_right, y_bottom]})
    return boxes


def render_crops(doc, boxes, out_dir: Path, zoom: float = 3.0):
    out_dir.mkdir(parents=True, exist_ok=True)
    mat = fitz.Matrix(zoom, zoom)
    for b in boxes:
        p = doc[b["page"]]
        clip = fitz.Rect(*b["rect"])
        pix = p.get_pixmap(matrix=mat, clip=clip)
        pix.save(str(out_dir / f"q{b['num']:03d}.png"))


def parse_answer_key(doc, answer_key_pages: range, n_questions: int) -> dict:
    text = "\n".join(doc[pi].get_text() for pi in answer_key_pages)
    pairs = re.findall(r"(\d{1,3})-([A-E])", text)
    answers = {}
    conflicts = {}
    for num_s, letter in pairs:
        n = int(num_s)
        if 1 <= n <= n_questions:
            answers.setdefault(n, set()).add(letter)
    for n, letters in answers.items():
        if len(letters) > 1:
            conflicts[n] = sorted(letters)
    if conflicts:
        raise RuntimeError(f"Cavab açarında ziddiyyət: {conflicts}")
    missing = set(range(1, n_questions + 1)) - set(answers.keys())
    if missing:
        raise RuntimeError(f"Cavab açarında çatışmayan suallar: {sorted(missing)}")
    return {n: next(iter(v)) for n, v in answers.items()}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--question-pages", required=True, help="məs. 0-7 (0-based, daxil olmaqla)")
    ap.add_argument("--answer-key-pages", required=True, help="məs. 8-9")
    ap.add_argument("--n-questions", type=int, default=100)
    ap.add_argument("--out-name", required=True, help="evals/golden-set-<ad>.jsonl və evals/images/<ad>/")
    ap.add_argument("--grade", type=int, default=11)
    ap.add_argument("--subject", default="math")
    ap.add_argument("--zoom", type=float, default=3.0)
    ap.add_argument(
        "--col-x-ranges",
        default="40-75,300-340",
        help="sütun başlanğıcı x-aralıqları, vergüllə ayrılmış 'lo-hi,lo-hi' (PDF-ə görə dəyişə bilər)",
    )
    args = ap.parse_args()

    col_x_ranges = []
    for part in args.col_x_ranges.split(","):
        lo, hi = part.split("-")
        col_x_ranges.append((float(lo), float(hi)))

    doc = fitz.open(args.pdf)
    q_pages = parse_range(args.question_pages)
    a_pages = parse_range(args.answer_key_pages)

    labels = find_question_labels(doc, q_pages, col_x_ranges, args.n_questions)
    boxes = compute_crop_boxes(doc, labels)

    repo_root = Path(__file__).resolve().parent.parent
    img_dir = repo_root / "evals" / "images" / args.out_name
    render_crops(doc, boxes, img_dir, zoom=args.zoom)

    answers = parse_answer_key(doc, a_pages, args.n_questions)

    golden_path = repo_root / "evals" / f"golden-set-{args.out_name}.jsonl"
    with open(golden_path, "w", encoding="utf-8") as f:
        for n in range(1, args.n_questions + 1):
            entry = {
                "id": f"{args.out_name}-{n:03d}",
                "image": f"images/{args.out_name}/q{n:03d}.png",
                "source": f"pdf:{Path(args.pdf).name}#q{n}",
                "grade": args.grade,
                "subject": args.subject,
                "expected_status": "ok",
                "expected_choice": answers[n],
            }
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    # Windows konsolu (cp1252) Azərbaycan simvollarını yaza bilməyəndə çökməsin deyə ASCII-ə
    # düşür (məzmun fayllara UTF-8 ilə ARTIQ yazılıb, bu YALNIZ konsol xülasəsidir).
    try:
        print(f"{args.n_questions} sual: {img_dir} (şəkillər) + {golden_path} (golden-set)")
        print("DİQQƏT: fiqur-ağır suallarda kəsmə natamam ola bilər — çıxan PNG-ləri BİR DƏFƏ göz gəzdir.")
    except UnicodeEncodeError:
        print(f"{args.n_questions} questions written: {img_dir} + {golden_path}")
        print("NOTE: figure-heavy questions may crop incompletely - spot-check the PNGs once.")


if __name__ == "__main__":
    main()
