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
   Açar yoxdursa `--answer-key-pages` buraxılır; `expected_choice` jsonl-ə yazılmır
   (insan sonra kitabçadan/həllindən doldurur — LLM yox).
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
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    raise SystemExit("pip install pymupdf")

from corpus.layout import compute_crop_boxes, find_question_labels, parse_col_x_ranges, parse_range


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


_LATIN_CHOICE_RE = re.compile(r"^[A-E]$")


def load_answer_key_json(path: Path) -> dict:
    """Kitabça açarı JSON — YALNIZ latin `answer_key`. Cyrillic homoqlif (А U+0410, Е U+0415)
    `choice_match`-i 0% göstərər və model uğursuzluğu kimi görünər. Boş nömrə (məs. #251)
    icazəlidir — expected_choice yazılmır."""
    data = json.loads(path.read_text(encoding="utf-8"))
    raw = data.get("answer_key")
    if not isinstance(raw, dict):
        raise RuntimeError(f"{path}: 'answer_key' (latin) yoxdur — raw_cyrillic işlətmə")
    answers = {}
    for key, val in raw.items():
        n = int(key)
        letter = str(val).strip()
        if any(ord(ch) >= 0x0400 for ch in letter):
            raise RuntimeError(
                f"{path}: answer_key[{n}]={letter!r} kiril homoqlifdir — latin A–E lazımdır"
            )
        if not _LATIN_CHOICE_RE.match(letter):
            raise RuntimeError(f"{path}: answer_key[{n}]={letter!r} latin A–E deyil")
        answers[n] = letter
    return answers


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--question-pages", required=True, help="məs. 0-7 (0-based, daxil olmaqla)")
    ap.add_argument(
        "--answer-key-pages",
        default="",
        help="məs. 8-9. Boşdursa expected_choice yazılmır — açar yoxdursa insan doldurur.",
    )
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
    ap.add_argument(
        "--answer-key-json",
        default="",
        help="latin answer_key JSON (evals/keys/ir_vB-answer-key.json). PDF açarından üstündür — homoqlif tələsi.",
    )
    args = ap.parse_args()

    col_x_ranges = parse_col_x_ranges(args.col_x_ranges)

    doc = fitz.open(args.pdf)
    q_pages = parse_range(args.question_pages)
    a_pages = parse_range(args.answer_key_pages) if args.answer_key_pages else None

    labels, _missing = find_question_labels(doc, q_pages, col_x_ranges, args.n_questions)
    single_column = len(col_x_ranges) == 1
    boxes = compute_crop_boxes(doc, labels, single_column=single_column)

    repo_root = Path(__file__).resolve().parent.parent
    img_dir = repo_root / "evals" / "images" / args.out_name
    render_crops(doc, boxes, img_dir, zoom=args.zoom)

    answers = {}
    if args.answer_key_json:
        answers = load_answer_key_json(Path(args.answer_key_json))
    elif a_pages is not None:
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
                "question_kind": "curriculum",
            }
            if n in answers:
                entry["expected_choice"] = answers[n]
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    # Windows konsolu (cp1252) Azərbaycan simvollarını yaza bilməyəndə çökməsin deyə ASCII-ə
    # düşür (məzmun fayllara UTF-8 ilə ARTIQ yazılıb, bu YALNIZ konsol xülasəsidir).
    n_keyed = sum(1 for n in range(1, args.n_questions + 1) if n in answers)
    try:
        print(f"{args.n_questions} sual: {img_dir} (şəkillər) + {golden_path} (golden-set)")
        print(f"expected_choice (latin): {n_keyed}/{args.n_questions}")
        print("DİQQƏT: fiqur-ağır suallarda kəsmə natamam ola bilər — çıxan PNG-ləri BİR DƏFƏ göz gəzdir.")
    except UnicodeEncodeError:
        print(f"{args.n_questions} questions written: {img_dir} + {golden_path}")
        print(f"latin expected_choice: {n_keyed}/{args.n_questions}")
        print("NOTE: figure-heavy questions may crop incompletely - spot-check the PNGs once.")


if __name__ == "__main__":
    main()
