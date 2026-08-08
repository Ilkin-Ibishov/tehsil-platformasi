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

from lib import leak, llm_client, prompt_loader, report, schema_check, steps_compare, verify
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


def run(pipeline_name, set_path, today, image_max_px=None):
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

    if image_max_px is not None:
        cfg.image_max_px = image_max_px

    pipeline_fn = PIPELINES[pipeline_name]

    entries = []
    for item in items:
        result = pipeline_fn(item, cfg)
        entry = report.evaluate_item(item, result, cfg)
        entries.append(entry)
        status_marker = {"ok": ".", "error": "E", "not_implemented": "-"}[result["status"]]
        print(status_marker, end="", flush=True)
    print()

    human_review = report.load_human_review(report.find_latest_human_review(RESULTS_DIR))
    metrics = report.aggregate(entries, human_review=human_review)
    report.print_report(pipeline_name, metrics)

    out_path = report.write_results(pipeline_name, set_path, entries, metrics, RESULTS_DIR, today)
    print(f"\nNəticə yazıldı: {out_path.relative_to(REPO_ROOT)}")

    prompt_version = prompt_loader.load_prompt_version()
    summary_path = report.write_summary(
        pipeline_name, set_path, entries, metrics, prompt_version, RESULTS_DIR, today
    )
    print(f"Xülasə (git-ə gedir) yazıldı: {summary_path.relative_to(REPO_ROOT)}")
    return 0


def compare():
    path_a = report.find_latest_result("A", RESULTS_DIR)
    path_b = report.find_latest_result("B", RESULTS_DIR)
    report.print_compare(path_a, path_b, RESULTS_DIR)
    return 0


SELFTEST_PATH = REPO_ROOT / "evals" / "selftest-cases.jsonl"


def _selftest_cases():
    """Mock model çıxışlarını schema/verify/leak/steps_compare/hallüsinasiya məntiqindən keçirir.
    API çağırışı YOX. Golden-set gələnə qədər bu, harness-in sınıq olmadığını bilməyin yeganə yoludur."""
    cases = load_items(SELFTEST_PATH)
    failures = []
    for case in cases:
        name = case["case"]
        expect = case["expect"]
        raw = case["model_output"]

        schema_valid, _ = schema_check.validate(raw)
        actual = {"schema_valid": schema_valid}

        has_solution = schema_valid and bool(raw.get("steps"))
        if has_solution:
            values = raw.get("final_answer", {}).get("values", [])
            answer_is_root = case.get("answer_is_root")
            if answer_is_root is None:
                answer_is_root = True
            verified, conflict = verify.verify_final_answer(
                case["canonical"], values,
                golden_values=case.get("golden_values"),
                answer_values_are=case.get("answer_values_are") or "alternate_forms",
                answer_is_root=answer_is_root,
            )
            actual["verified"] = verified
            actual["conflict"] = conflict
            actual["leaked"] = leak.detect_leak(raw.get("steps", []), values)
            actual["structural_all_pass"] = steps_compare.check_structure(raw.get("steps", []))["all_pass"]
            actual["choice_match"] = report._choice_match(case.get("expected_choice"), raw)
        else:
            actual["verified"] = None
            actual["conflict"] = None
            actual["leaked"] = None
            actual["structural_all_pass"] = None
            actual["choice_match"] = None

        expected_status = case.get("expected_status") or "ok"
        actual["hallucination"] = report.is_hallucination(expected_status, raw)
        actual["false_refusal"] = report.is_false_refusal(expected_status, raw)

        ok = all(actual[k] == expect[k] for k in expect)
        marker = "PASS" if ok else "FAIL"
        print(f"[{marker}] {name}  expect={expect}  actual={actual}")
        if not ok:
            failures.append(name)

    return len(cases), failures


def _selftest_prompt_schema_invariants():
    """86eyhnv2r: prompt ↔ sxem invariantı, API çağırışı olmadan.
    İSTİQAMƏT BİRTƏRƏFLİDİR — sınarsa düzəldiləcək şey promptdur, STEP-SCHEMA.json və ya
    check_structure DEYİL (bax prompts/solve/core.md, docs/STEP-SCHEMA.json başlıqlarındakı
    "TOXUNMA" qeydləri)."""
    failures = []
    system_text, _user_template = prompt_loader.load_prompt_templates()

    # (a) Enum örtüyü: modelin yazdığı hər enum/const dəyəri promptda hərfi-hərfinə olmalıdır.
    missing = []
    for path, values in schema_check.collect_enum_values():
        for value in values:
            needle = str(value)
            if needle not in system_text:
                missing.append(f"{path} = {value!r}")
    ok_a = not missing
    marker_a = "PASS" if ok_a else "FAIL"
    print(f"[{marker_a}] prompt_enum_coverage  missing={missing}")
    if not ok_a:
        failures.append("prompt_enum_coverage")

    # (b) Nümunə uyğunluğu: System blokundakı JSON nümunəsi sxemə valid VƏ struktur 5 şərtini keçməlidir.
    try:
        example = prompt_loader.extract_example_json(system_text)
    except (ValueError, json.JSONDecodeError) as exc:
        print(f"[FAIL] prompt_example_valid  nümunə JSON tapılmadı/parse olunmadı: {exc}")
        failures.append("prompt_example_valid")
        example = None

    if example is not None:
        schema_valid, schema_errors = schema_check.validate(example)
        detail = {"schema_valid": schema_valid}
        ok_b = schema_valid
        if schema_valid:
            structural = steps_compare.check_structure(example.get("steps", []))
            detail["structural"] = structural
            ok_b = structural["all_pass"]
        else:
            detail["schema_errors"] = schema_errors
        marker_b = "PASS" if ok_b else "FAIL"
        print(f"[{marker_b}] prompt_example_valid  {detail}")
        if not ok_b:
            failures.append("prompt_example_valid")

    return failures


def selftest():
    n_cases, case_failures = _selftest_cases()
    invariant_failures = _selftest_prompt_schema_invariants()
    failures = case_failures + invariant_failures
    total = n_cases + 2  # 2 = prompt_enum_coverage + prompt_example_valid

    if failures:
        print(f"\n⚠ Harness özü sınıqdır: {', '.join(failures)}. Qapı ölçmədən əvvəl bunu düzəlt.")
        if "prompt_enum_coverage" in failures or "prompt_example_valid" in failures:
            print(
                "  DİQQƏT: bu ikisi prompt↔sxem invariantıdır — sınarsa düzəldiləcək şey "
                "prompts/solve/core.md-dir, STEP-SCHEMA.json/steps_compare.py deyil."
            )
        return 1
    print(f"\n{total}/{total} self-test keçdi. Harness məntiqi etibarlıdır.")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Faza 0 eval harness")
    parser.add_argument("--pipeline", choices=["A", "B"], help="Hansı boru xətti işə salınsın")
    parser.add_argument("--set", dest="set_path", type=Path, help="golden-set.jsonl və ya fixtures.jsonl")
    parser.add_argument("--compare", action="store_true", help="Ən son A və B nəticələrini müqayisə et")
    parser.add_argument("--selftest", action="store_true", help="Harness-in öz məntiqini yoxla (API çağırışı yoxdur)")
    parser.add_argument(
        "--image-max-px", dest="image_max_px", type=int, default=None,
        help="Şəkil kiçiltmə hədəfi (default: .env-dəki IMAGE_MAX_PX, ya da 1600). 800/1200/1600 müqayisəsi üçün."
    )
    args = parser.parse_args()

    if args.selftest:
        return selftest()
    if args.compare:
        return compare()
    if not args.pipeline or not args.set_path:
        parser.error("--pipeline və --set birlikdə lazımdır (və ya --compare / --selftest istifadə et)")

    today = date.today().isoformat()
    return run(args.pipeline, args.set_path, today, image_max_px=args.image_max_px)


if __name__ == "__main__":
    sys.exit(main())
