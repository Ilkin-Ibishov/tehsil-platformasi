#!/usr/bin/env python
"""Faza 0 eval harness — iki boru xəttini golden-set/fixture üzərində müqayisə edir.

    python scripts/eval.py --pipeline A --set evals/golden-set.jsonl
    python scripts/eval.py --pipeline B --set evals/golden-set.jsonl
    python scripts/eval.py --pipeline B --set evals/fixtures.jsonl
    python scripts/eval.py --compare
    python scripts/eval.py --selftest

Bax: evals/README.md (metrikalar və qapı dəyərləri), docs/decisions/ADR-001-ocr-pipeline.md.
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass  # Windows konsolunda cp1252 default-u ⚠ kimi simvolları poza bilər

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import leak, llm_client, report, schema_check, verify
from lib.pipelines import PIPELINES

REPO_ROOT = Path(__file__).resolve().parent.parent
RESULTS_DIR = REPO_ROOT / "evals" / "results"


def load_items(set_path):
    items = []
    with open(set_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            items.append(json.loads(line))
    return items


def run(pipeline_name, set_path, today):
    if not set_path.exists():
        print(f"Xəta: {set_path} tapılmadı.", file=sys.stderr)
        return 1

    items = load_items(set_path)
    if not items:
        print(f"⚠ {set_path} boşdur — heç nə işlənmədi.")
        print(
            "Bu, gözlənilən vəziyyət ola bilər: golden-set.jsonl real DİM şəkilləri çəkilənə "
            "qədər boş qalır (bax ClickUp 86eyhk10u). Sintetik test üçün: "
            "--set evals/fixtures.jsonl"
        )
        return 0

    try:
        cfg = llm_client.load_config()
    except llm_client.ConfigError as exc:
        if pipeline_name == "A":
            # A hər halda not_implemented qaytarır — LLM konfiqi lazım deyil, boş cfg kifayətdir.
            cfg = llm_client.LLMConfig(
                model="", api_key="", base_url="", price_input_per_1m=None, price_output_per_1m=None
            )
        else:
            print(f"Xəta: {exc}", file=sys.stderr)
            return 1

    pipeline_fn = PIPELINES[pipeline_name]

    entries = []
    for item in items:
        result = pipeline_fn(item, cfg)
        entry = report.evaluate_item(item, result, cfg)
        entries.append(entry)
        status_marker = {"ok": ".", "error": "E", "not_implemented": "-"}[result["status"]]
        print(status_marker, end="", flush=True)
    print()

    metrics = report.aggregate(entries)
    report.print_report(pipeline_name, metrics)

    out_path = report.write_results(pipeline_name, set_path, entries, metrics, RESULTS_DIR, today)
    print(f"\nNəticə yazıldı: {out_path.relative_to(REPO_ROOT)}")
    return 0


def compare():
    path_a = report.find_latest_result("A", RESULTS_DIR)
    path_b = report.find_latest_result("B", RESULTS_DIR)
    report.print_compare(path_a, path_b)
    return 0


SELFTEST_PATH = REPO_ROOT / "evals" / "selftest-cases.jsonl"


def selftest():
    """Harness-in özünün (schema/verify/leak) düzgün işlədiyini sübut edir — API çağırışı YOX.
    Golden-set gələnə qədər bu, harness-in sınıq olmadığını bilməyin yeganə yoludur."""
    cases = load_items(SELFTEST_PATH)
    failures = []
    for case in cases:
        name = case["case"]
        expect = case["expect"]
        raw = case["model_output"]

        schema_valid, _ = schema_check.validate(raw)
        actual = {"schema_valid": schema_valid}

        if schema_valid:
            values = raw.get("final_answer", {}).get("values", [])
            actual["verified"] = verify.verify_final_answer(case["canonical"], values)
            actual["leaked"] = leak.detect_leak(raw.get("steps", []), values)
        else:
            actual["verified"] = None
            actual["leaked"] = None

        ok = all(actual[k] == expect[k] for k in expect)
        marker = "PASS" if ok else "FAIL"
        print(f"[{marker}] {name}  expect={expect}  actual={actual}")
        if not ok:
            failures.append(name)

    if failures:
        print(f"\n⚠ Harness özü sınıqdır: {', '.join(failures)}. Qapı ölçmədən əvvəl bunu düzəlt.")
        return 1
    print(f"\n{len(cases)}/{len(cases)} self-test keçdi. Harness məntiqi etibarlıdır.")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Faza 0 eval harness")
    parser.add_argument("--pipeline", choices=["A", "B"], help="Hansı boru xətti işə salınsın")
    parser.add_argument("--set", dest="set_path", type=Path, help="golden-set.jsonl və ya fixtures.jsonl")
    parser.add_argument("--compare", action="store_true", help="Ən son A və B nəticələrini müqayisə et")
    parser.add_argument("--selftest", action="store_true", help="Harness-in öz məntiqini yoxla (API çağırışı yoxdur)")
    args = parser.parse_args()

    if args.selftest:
        return selftest()
    if args.compare:
        return compare()
    if not args.pipeline or not args.set_path:
        parser.error("--pipeline və --set birlikdə lazımdır (və ya --compare / --selftest istifadə et)")

    today = date.today().isoformat()
    return run(args.pipeline, args.set_path, today)


if __name__ == "__main__":
    sys.exit(main())
