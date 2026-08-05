"""Nəticələrin aqreqasiyası, qapı hökmü və JSON/konsol çıxışı.

Qapı guard-ı: n < MIN_GOLDEN_SET_N olduqda faiz ÇAP EDİLMİR, yalnız xam say (m/n) göstərilir.
Səbəb: kiçik n üzərində faiz oxumaq real qapı keçidi kimi yozula bilər (bax evals/README.md).
"""

import json
from pathlib import Path

from . import cost as cost_lib
from . import leak, schema_check, steps_compare, verify

MIN_GOLDEN_SET_N = 30

GATE_FINAL_ANSWER = 0.85
GATE_STEP_SPLIT = 0.75
GATE_SCHEMA_VALIDITY = 1.0


def evaluate_item(item, result, cfg):
    entry = {
        "id": item.get("id") or result.get("id"),
        "status": result["status"],
        "latency_ms": result.get("latency_ms"),
        "error": result.get("error"),
    }

    if result["status"] == "not_implemented":
        return entry

    usage = result.get("usage")
    if cfg.price_input_per_1m is not None and cfg.price_output_per_1m is not None:
        entry["cost_usd"] = cost_lib.compute_cost_usd(
            usage, cfg.price_input_per_1m, cfg.price_output_per_1m
        )
    else:
        entry["cost_usd"] = None

    if result["status"] == "error":
        entry.update(
            {"schema_valid": False, "final_answer_correct": False, "step_split_ok": None, "leaked": None}
        )
        return entry

    raw = result["raw_output"]
    schema_valid, schema_errors = schema_check.validate(raw)
    entry["schema_valid"] = schema_valid
    if not schema_valid:
        entry["schema_errors"] = schema_errors
        entry["final_answer_correct"] = False
        entry["step_split_ok"] = None
        entry["leaked"] = None
        return entry

    canonical = item.get("canonical") or raw.get("canonical", "")
    values = raw.get("final_answer", {}).get("values", [])
    entry["final_answer_correct"] = verify.verify_final_answer(canonical, values)
    entry["step_split_ok"] = steps_compare.step_split_match(
        raw.get("steps", []), item.get("expected_step_count"), item.get("expected_step_titles")
    )
    entry["leaked"] = leak.detect_leak(raw.get("steps", []), values)
    return entry


def _rate(entries, key, is_match, is_denom):
    denom_entries = [e for e in entries if key in e and is_denom(e[key])]
    if not denom_entries:
        return {"rate": None, "matched": 0, "n": 0}
    matched = sum(1 for e in denom_entries if is_match(e[key]))
    return {"rate": matched / len(denom_entries), "matched": matched, "n": len(denom_entries)}


def aggregate(entries):
    attempted = [e for e in entries if e["status"] != "not_implemented"]
    n = len(attempted)

    metrics = {
        "n_total": len(entries),
        "n_attempted": n,
        "n_not_implemented": len(entries) - n,
    }

    if n == 0:
        metrics["note"] = "Heç bir nümunə işlənmədi (bütün nəticələr not_implemented)."
        return metrics

    metrics["schema_validity"] = _rate(attempted, "schema_valid", lambda v: v is True, lambda v: v is not None)
    metrics["final_answer_accuracy"] = _rate(
        attempted, "final_answer_correct", lambda v: v is True, lambda v: v is not None
    )
    metrics["step_split_accuracy"] = _rate(
        attempted, "step_split_ok", lambda v: v is True, lambda v: v is not None
    )
    metrics["leak_rate"] = _rate(attempted, "leaked", lambda v: v is True, lambda v: v is not None)

    costs = [e["cost_usd"] for e in attempted if e.get("cost_usd") is not None]
    latencies = [e["latency_ms"] for e in attempted if e.get("latency_ms") is not None]
    metrics["avg_cost_usd"] = sum(costs) / len(costs) if costs else None
    metrics["avg_latency_ms"] = sum(latencies) / len(latencies) if latencies else None

    metrics["gate_eligible"] = n >= MIN_GOLDEN_SET_N
    if not metrics["gate_eligible"]:
        metrics["gate_status"] = f"QAPI ÖLÇÜLƏ BİLMƏZ (n={n}, minimum {MIN_GOLDEN_SET_N})"
    else:
        fa = metrics["final_answer_accuracy"]["rate"] or 0
        ss = metrics["step_split_accuracy"]["rate"]
        sv = metrics["schema_validity"]["rate"] or 0
        ss_ok = True if ss is None else ss >= GATE_STEP_SPLIT
        gate_pass = fa >= GATE_FINAL_ANSWER and ss_ok and sv >= GATE_SCHEMA_VALIDITY
        metrics["gate_pass"] = gate_pass
        metrics["gate_status"] = "KEÇDİ" if gate_pass else "KEÇMƏDİ"

    return metrics


def write_results(pipeline_name, set_path, entries, metrics, out_dir, date_str):
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{pipeline_name}-{date_str}.json"
    payload = {
        "pipeline": pipeline_name,
        "set": str(set_path),
        "date": date_str,
        "metrics": metrics,
        "items": entries,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path


def _print_metric_line(label, metric_dict, gate_eligible, gate_value=None):
    if metric_dict["n"] == 0:
        print(f"  {label}: ölçülə bilmədi (n=0)")
        return
    if gate_eligible:
        pct = f"{metric_dict['rate'] * 100:.1f}%"
        suffix = f" (qapı: ≥{gate_value * 100:.0f}%)" if gate_value is not None else ""
        print(f"  {label}: {pct} ({metric_dict['matched']}/{metric_dict['n']}){suffix}")
    else:
        print(f"  {label}: {metric_dict['matched']}/{metric_dict['n']} (faiz çap edilmir — n < {MIN_GOLDEN_SET_N})")


def print_report(pipeline_name, metrics):
    print(f"\n=== Pipeline {pipeline_name} ===")
    print(f"n_total={metrics['n_total']}  n_attempted={metrics.get('n_attempted', 0)}  not_implemented={metrics.get('n_not_implemented', 0)}")

    if metrics.get("n_attempted", 0) == 0:
        print(metrics.get("note", ""))
        return

    gate_eligible = metrics.get("gate_eligible", False)
    if not gate_eligible:
        print(f"\n⚠ {metrics['gate_status']}")

    _print_metric_line("Sxem validliyi", metrics["schema_validity"], gate_eligible, GATE_SCHEMA_VALIDITY)
    _print_metric_line("Son cavab dəqiqliyi", metrics["final_answer_accuracy"], gate_eligible, GATE_FINAL_ANSWER)
    _print_metric_line("Addım bölgüsü", metrics["step_split_accuracy"], gate_eligible, GATE_STEP_SPLIT)
    _print_metric_line("Cavab sızması", metrics["leak_rate"], gate_eligible)

    if metrics.get("avg_cost_usd") is not None:
        print(f"  Orta xərc/həll: ${metrics['avg_cost_usd']:.5f}")
    else:
        print("  Orta xərc/həll: ölçülmədi (PRICE_INPUT_PER_1M/PRICE_OUTPUT_PER_1M .env-də yoxdur)")
    if metrics.get("avg_latency_ms") is not None:
        print(f"  Orta latensiya: {metrics['avg_latency_ms']:.0f} ms")

    if gate_eligible:
        print(f"\nQapı: {metrics['gate_status']}")


def find_latest_result(pipeline_name, out_dir):
    candidates = sorted(out_dir.glob(f"{pipeline_name}-*.json"))
    return candidates[-1] if candidates else None


def print_compare(path_a, path_b):
    print("\n=== Müqayisə: A vs B ===")
    for label, path in (("A", path_a), ("B", path_b)):
        if path is None:
            print(f"{label}: nəticə tapılmadı — əvvəlcə `--pipeline {label}` ilə işə sal.")
    if path_a is None or path_b is None:
        return

    data_a = json.loads(Path(path_a).read_text(encoding="utf-8"))
    data_b = json.loads(Path(path_b).read_text(encoding="utf-8"))

    print(f"A: {path_a.name}")
    print(f"B: {path_b.name}")

    for key, label in (
        ("schema_validity", "Sxem validliyi"),
        ("final_answer_accuracy", "Son cavab dəqiqliyi"),
        ("step_split_accuracy", "Addım bölgüsü"),
        ("leak_rate", "Cavab sızması"),
    ):
        ma = data_a["metrics"].get(key, {})
        mb = data_b["metrics"].get(key, {})
        eligible_a = data_a["metrics"].get("gate_eligible", False)
        eligible_b = data_b["metrics"].get("gate_eligible", False)
        va = f"{ma['rate']*100:.1f}%" if eligible_a and ma.get("rate") is not None else f"{ma.get('matched', 0)}/{ma.get('n', 0)}"
        vb = f"{mb['rate']*100:.1f}%" if eligible_b and mb.get("rate") is not None else f"{mb.get('matched', 0)}/{mb.get('n', 0)}"
        print(f"  {label}: A={va}  B={vb}")

    for key, label in (("avg_cost_usd", "Orta xərc"), ("avg_latency_ms", "Orta latensiya")):
        va = data_a["metrics"].get(key)
        vb = data_b["metrics"].get(key)
        print(f"  {label}: A={va}  B={vb}")

    if not (data_a["metrics"].get("gate_eligible") and data_b["metrics"].get("gate_eligible")):
        print(f"\n⚠ Ən azı bir tərəf qapı üçün kifayət qədər nümunəyə malik deyil (minimum {MIN_GOLDEN_SET_N}). Qapı hökmü verilmir.")
