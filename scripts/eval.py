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
from lib.pipelines import PIPELINES, resolve_eval_media, eval_image_path

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


def resolve_set_path(set_path):
    """`--set` cwd-yə nisbidir; tapılmasa repo kökündən yoxla (scripts/ cwd fərqi)."""
    if set_path.exists():
        return set_path.resolve()
    alt = REPO_ROOT / set_path
    if alt.exists():
        return alt.resolve()
    return set_path


def preflight_images(items, force_text):
    """Şəkil sahəsi olan itemlər üçün disk yoxlaması. 0 tapılsa eval-ı skip etmə — xəta ilə çıx."""
    if force_text:
        return 0, 0, []
    listed = 0
    missing = []
    for item in items:
        rel = item.get("image")
        if not rel:
            continue
        listed += 1
        path = eval_image_path(rel)
        if path is None or not path.exists():
            missing.append(rel)
    return listed, listed - len(missing), missing


def run(pipeline_name, set_path, today, image_max_px=None, force_text=False, limit=None):
    set_path = resolve_set_path(set_path)
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

    if limit is not None:
        items = items[:limit]

    listed, found, missing = preflight_images(items, force_text)
    if listed:
        print(f"Vision: {found}/{listed} şəkil tapıldı ({REPO_ROOT / 'evals' / 'images'})")
        if missing:
            print(f"  çatışmayan: {', '.join(missing[:5])}{'…' if len(missing) > 5 else ''}", file=sys.stderr)
        if found == 0:
            print(
                "Xəta: bu dəst şəkil istəyir, amma heç biri diskdə yoxdur. "
                "`evals/images/` .gitignore-dadır — Glob/indeks onu görmür; pathlib ilə yoxla. "
                "Mətn yolu üçün --text və canonical lazımdır.",
                file=sys.stderr,
            )
            return 1

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
    cfg.force_text = force_text

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
        raw = schema_check.strip_unknown_visual(case["model_output"])

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


def _selftest_image_resolve():
    """Vision skip-inin kökü: gitignore + səssiz fallback. Şəkil varsa path işləməli,
    yoxdursa error (canonical-a keçmə)."""
    failures = []
    item = {"id": "r01", "image": "images/photo_2026-08-05_22-15-36.jpg"}
    path, text, err = resolve_eval_media(item)
    ok = err is None and path is not None and path.exists() and text is None
    print(f"[{'PASS' if ok else 'FAIL'}] vision_image_exists  path={path} err={err}")
    if not ok:
        failures.append("vision_image_exists")

    missing_item = {"id": "ghost", "image": "images/does-not-exist.jpg", "canonical": "x=1"}
    path2, text2, err2 = resolve_eval_media(missing_item)
    ok2 = err2 is not None and path2 is None and text2 is None
    print(f"[{'PASS' if ok2 else 'FAIL'}] missing_image_is_error  err={err2}")
    if not ok2:
        failures.append("missing_image_is_error")

    text_item = {"id": "t1", "image": "images/does-not-exist.jpg", "canonical": "3x=12"}
    path3, text3, err3 = resolve_eval_media(text_item, force_text=True)
    ok3 = err3 is None and path3 is None and text3 == "3x=12"
    print(f"[{'PASS' if ok3 else 'FAIL'}] force_text_uses_canonical  text={text3}")
    if not ok3:
        failures.append("force_text_uses_canonical")

    return failures


def _selftest_physics_prompt():
    """E1.3: physics.md + MECH.KINEMATICS nümunəsi math fallback deyil, sxem validdir."""
    failures = []
    system, _ = prompt_loader.load_prompt_templates(
        subject="physics", topic_code="MECH.KINEMATICS"
    )
    ok = (
        '"subject": "physics"' in system
        and "MECH.KINEMATICS" in system
        and "Sahəsi 40" not in system
    )
    print(f"[{'PASS' if ok else 'FAIL'}] physics_kinematics_example")
    if not ok:
        failures.append("physics_kinematics_example")
        return failures
    try:
        example = prompt_loader.extract_example_json(system)
    except (ValueError, json.JSONDecodeError) as exc:
        print(f"[FAIL] physics_example_valid  {exc}")
        failures.append("physics_example_valid")
        return failures
    schema_valid, schema_errors = schema_check.validate(example)
    structural = steps_compare.check_structure(example.get("steps", [])) if schema_valid else None
    ok_b = schema_valid and structural and structural["all_pass"] and example.get("subject") == "physics"
    values = (example.get("final_answer") or {}).get("values") or []
    unitless = all("m" not in str(v).lower() and "N" not in str(v) for v in values)
    ok_b = ok_b and unitless
    print(f"[{'PASS' if ok_b else 'FAIL'}] physics_example_valid  schema={schema_valid} structural={structural} values={values}")
    if not ok_b:
        if not schema_valid:
            print(f"  schema_errors={schema_errors}")
        failures.append("physics_example_valid")
    return failures


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
    image_failures = _selftest_image_resolve()
    physics_failures = _selftest_physics_prompt()
    failures = case_failures + invariant_failures + image_failures + physics_failures
    extra = 2 + 3 + 2  # prompt invariants + image-resolve + physics
    total = n_cases + extra

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
    parser.add_argument(
        "--text", action="store_true",
        help="Şəkli ignore et, canonical mətn yolu (E2.4 visual ölçməsi). canonical məcburidir.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Yalnız ilk N item (smoke).")
    args = parser.parse_args()

    if args.selftest:
        return selftest()
    if args.compare:
        return compare()
    if not args.pipeline or not args.set_path:
        parser.error("--pipeline və --set birlikdə lazımdır (və ya --compare / --selftest istifadə et)")

    today = date.today().isoformat()
    return run(
        args.pipeline,
        args.set_path,
        today,
        image_max_px=args.image_max_px,
        force_text=args.text,
        limit=args.limit,
    )


if __name__ == "__main__":
    sys.exit(main())
