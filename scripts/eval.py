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
    """`--set` cwd-yə nisbidir; tapılmasa repo kökündən yoxla (scripts/ cwd fərqi).
    Qısa ad (`physics-30`) `evals/golden-set-<ad>.jsonl` kimi açılır."""
    if set_path.exists():
        return set_path.resolve()
    alt = REPO_ROOT / set_path
    if alt.exists():
        return alt.resolve()
    name = set_path.name
    if not name.endswith(".jsonl"):
        for cand in (
            REPO_ROOT / "evals" / f"golden-set-{name}.jsonl",
            REPO_ROOT / "evals" / f"{name}.jsonl",
        ):
            if cand.exists():
                return cand.resolve()
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
        status_marker = {"ok": ".", "error": "E", "failed": "F", "not_implemented": "-"}.get(
            result["status"], "?"
        )
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


def _dummy_cfg():
    return llm_client.LLMConfig(
        model="mock",
        api_key="x",
        base_url="https://example.invalid",
        price_input_per_1m=None,
        price_output_per_1m=None,
    )


def _selftest_api_failure_exclusion():
    """503/timeout `failed` — n_attempted-dən çıxır, səhv cavab sayılmır."""
    failures = []
    cfg = _dummy_cfg()
    failed_result = {
        "id": "drop",
        "status": "failed",
        "raw_output": None,
        "error": "LLM HTTP 503 after 5 attempts",
        "attempts": 5,
        "latency_ms": 1200,
    }
    ev = report.evaluate_item({"id": "drop", "expected_status": "ok"}, failed_result, cfg)
    ok_ev = ev.get("schema_valid") is None and ev.get("final_answer_correct") is None
    print(
        f"[{'PASS' if ok_ev else 'FAIL'}] failed_not_scored_as_wrong  "
        f"schema={ev.get('schema_valid')} fa={ev.get('final_answer_correct')}"
    )
    if not ok_ev:
        failures.append("failed_not_scored_as_wrong")

    ok_entry = {
        "id": "ok1",
        "status": "ok",
        "schema_valid": True,
        "final_answer_correct": True,
        "verify_conflict": False,
        "choice_match": None,
        "step_structural": None,
        "leaked": False,
        "hallucination": None,
        "false_refusal": None,
        "status_match": None,
    }
    metrics = report.aggregate([ok_entry, ev])
    ok_n = metrics["n_attempted"] == 1 and metrics["n_failed"] == 1
    rate = metrics["api_failure_rate"]
    ok_rate = rate["matched"] == 1 and rate["n"] == 2 and abs((rate["rate"] or -1) - 0.5) < 1e-9
    schema_n = metrics["schema_validity"]["n"]
    ok_schema = schema_n == 1
    print(
        f"[{'PASS' if ok_n else 'FAIL'}] failed_excluded_from_n_attempted  "
        f"n_attempted={metrics['n_attempted']} n_failed={metrics['n_failed']}"
    )
    print(f"[{'PASS' if ok_rate else 'FAIL'}] api_failure_rate  {rate}")
    print(f"[{'PASS' if ok_schema else 'FAIL'}] failed_excluded_from_schema  schema_n={schema_n}")
    if not ok_n:
        failures.append("failed_excluded_from_n_attempted")
    if not ok_rate:
        failures.append("api_failure_rate")
    if not ok_schema:
        failures.append("failed_excluded_from_schema")
    return failures


def _selftest_llm_retry():
    """503 sonra 200 — retry; 5×503/timeout — APIFailure. sleep mock (gözləmə yox)."""
    from unittest.mock import patch

    import httpx

    failures = []
    cfg = _dummy_cfg()
    ok_body = {
        "choices": [{"message": {"content": "{\"ok\": true}"}}],
        "usage": {"prompt_tokens": 1, "completion_tokens": 1},
    }

    class _Seq:
        def __init__(self, codes):
            self.codes = list(codes)
            self.n = 0

        def post(self, *args, **kwargs):
            code = self.codes[min(self.n, len(self.codes) - 1)]
            self.n += 1
            if code == "timeout":
                raise httpx.TimeoutException("mock timeout")
            req = httpx.Request("POST", "https://example.invalid/chat/completions")
            return httpx.Response(
                code,
                json=ok_body if code == 200 else {"error": "unavailable"},
                request=req,
            )

    class _Client:
        def __init__(self, seq):
            self._seq = seq

        def __enter__(self):
            return self._seq

        def __exit__(self, *args):
            return False

    seq = _Seq([503, 503, 200])
    with patch("lib.llm_client.time.sleep"), patch(
        "lib.llm_client.httpx.Client", lambda **kw: _Client(seq)
    ):
        parsed, _u, _lat, _raw, attempts, _meta = llm_client.call_vision_llm(cfg, "sys", "user")
    ok_retry = parsed == {"ok": True} and attempts == 3 and seq.n == 3
    print(
        f"[{'PASS' if ok_retry else 'FAIL'}] retry_503_then_ok  "
        f"attempts={attempts} posts={seq.n} parsed={parsed}"
    )
    if not ok_retry:
        failures.append("retry_503_then_ok")

    seq5 = _Seq([503, 503, 503, 503, 503])
    raised = None
    with patch("lib.llm_client.time.sleep"), patch(
        "lib.llm_client.httpx.Client", lambda **kw: _Client(seq5)
    ):
        try:
            llm_client.call_vision_llm(cfg, "sys", "user")
        except llm_client.APIFailure as exc:
            raised = exc
    ok_fail = (
        raised is not None
        and raised.attempts == llm_client.MAX_ATTEMPTS
        and seq5.n == llm_client.MAX_ATTEMPTS
        and "503" in str(raised)
    )
    print(
        f"[{'PASS' if ok_fail else 'FAIL'}] retry_exhausted_is_api_failure  "
        f"attempts={getattr(raised, 'attempts', None)} posts={seq5.n} err={raised}"
    )
    if not ok_fail:
        failures.append("retry_exhausted_is_api_failure")

    seq_t = _Seq(["timeout"] * llm_client.MAX_ATTEMPTS)
    raised_t = None
    with patch("lib.llm_client.time.sleep"), patch(
        "lib.llm_client.httpx.Client", lambda **kw: _Client(seq_t)
    ):
        try:
            llm_client.call_vision_llm(cfg, "sys", "user")
        except llm_client.APIFailure as exc:
            raised_t = exc
    ok_t = raised_t is not None and "timeout" in str(raised_t).lower()
    print(f"[{'PASS' if ok_t else 'FAIL'}] timeout_exhausted_is_api_failure  err={raised_t}")
    if not ok_t:
        failures.append("timeout_exhausted_is_api_failure")

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
    leaked = leak.detect_leak(example.get("steps", []), values)
    ok_c = leaked is False and "Sızma qadağası" in system
    print(f"[{'PASS' if ok_c else 'FAIL'}] physics_example_no_leak  leaked={leaked}")
    if not ok_c:
        failures.append("physics_example_no_leak")
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


def _selftest_choice_kind():
    """choice_match_rate yalnız curriculum; iq_logic ayrıca sətir."""
    failures = []
    cur = {
        "id": "c1",
        "status": "ok",
        "question_kind": "curriculum",
        "choice_match": True,
        "schema_valid": True,
        "final_answer_correct": None,
        "verify_conflict": False,
        "leaked": False,
        "hallucination": None,
        "false_refusal": False,
        "status_match": None,
        "step_structural": None,
    }
    iq_wrong = {**cur, "id": "i1", "question_kind": "iq_logic", "choice_match": False}
    metrics = report.aggregate([cur, iq_wrong])
    cr = metrics["choice_match_rate"]
    ir = metrics["choice_match_rate_iq_logic"]
    ok_c = cr["matched"] == 1 and cr["n"] == 1
    ok_i = ir["matched"] == 0 and ir["n"] == 1 and metrics["n_iq_logic"] == 1
    print(f"[{'PASS' if ok_c else 'FAIL'}] choice_curriculum_excludes_iq  {cr}")
    print(f"[{'PASS' if ok_i else 'FAIL'}] choice_iq_logic_separate  iq={ir} n_iq={metrics['n_iq_logic']}")
    if not ok_c:
        failures.append("choice_curriculum_excludes_iq")
    if not ok_i:
        failures.append("choice_iq_logic_separate")
    return failures


def selftest():
    n_cases, case_failures = _selftest_cases()
    invariant_failures = _selftest_prompt_schema_invariants()
    image_failures = _selftest_image_resolve()
    physics_failures = _selftest_physics_prompt()
    api_failures = _selftest_api_failure_exclusion()
    retry_failures = _selftest_llm_retry()
    kind_failures = _selftest_choice_kind()
    failures = (
        case_failures
        + invariant_failures
        + image_failures
        + physics_failures
        + api_failures
        + retry_failures
        + kind_failures
    )
    extra = 2 + 3 + 3 + 4 + 3 + 2  # prompt + image + physics + failed-exclusion + retry + choice-kind
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
