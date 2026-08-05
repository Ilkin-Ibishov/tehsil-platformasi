"""Nəticələrin aqreqasiyası, qapı hökmü və JSON/konsol çıxışı.

Qapı guard-ı: n < MIN_GOLDEN_SET_N olduqda faiz ÇAP EDİLMİR, yalnız xam say (m/n) göstərilir.
Səbəb: kiçik n üzərində faiz oxumaq real qapı keçidi kimi yozula bilər (bax evals/README.md).

Addım bölgüsü ADR-004-ə görə ikiyə ayrılır:
  - step_split_structural  — avtomatik, obyektiv (steps_compare.py)
  - step_split_pedagogical — insan rəyi (evals/results/human-review-<tarix>.jsonl), yoxdursa
    qapı "NATAMAM" olur, heç vaxt "KEÇDİ" demir.

ADR-006: hallüsinasiya = golden set `expected_status != "ok"` olduğu halda model YENƏ DƏ
`steps`/`final_answer` qaytarır (yəni imtina etmək əvəzinə uydurur). Qapı **0%** — digər bütün
metrikalardan vacibdir, çünki uydurma həll uydurma error_code-a, o da zəhərlənmiş səhv
xəritəsinə aparır (bax CLAUDE.md qızıl qayda). Artıq ehtiyat (false refusal) — əks hal, simmetrik
ölçülür, qapısı yoxdur. `status_match` yalnız informativdir: imtina səbəbinin (`unreadable` vs
`cut_off` və s.) dəqiq uyğunluğunu göstərir, hallüsinasiya hökmünə təsir etmir.
"""

import json
from pathlib import Path

from . import cost as cost_lib
from . import leak, schema_check, steps_compare, verify

MIN_GOLDEN_SET_N = 30

GATE_FINAL_ANSWER = 0.85
GATE_SCHEMA_VALIDITY = 1.0
GATE_STEP_SPLIT_STRUCTURAL = 1.0
GATE_STEP_SPLIT_PEDAGOGICAL = 0.75
GATE_HALLUCINATION = 0.0

HUMAN_REVIEW_NOTE = "insan rəyi yoxdur — qapı natamam"


def actual_status(raw_output):
    """Modelin qaytardığı `status` — yoxdursa (və ya boşdursa) sxemə görə 'ok' sayılır.
    raw_output dict deyilsə (məs. JSON parse alınmadı) None — bilinmir."""
    if not isinstance(raw_output, dict):
        return None
    return raw_output.get("status") or "ok"


def is_hallucination(expected_status, raw_output):
    """ADR-006: golden set imtina gözləyirdi (`expected_status != "ok"`), model isə HƏLL
    qaytardı (`steps`/`final_answer` var) — status sahəsindən asılı olmayaraq. `expected_status`
    "ok"/None-dursa tətbiq olunmur → None. Heç bir çıxış yoxdursa (parse xətası) hallüsinasiya
    DEYİL — bu ayrı, artıq schema_valid=False kimi qeyd olunan uğursuzluqdur."""
    if expected_status in (None, "ok"):
        return None
    if not isinstance(raw_output, dict):
        return False
    return bool(raw_output.get("steps")) or bool(raw_output.get("final_answer"))


def is_false_refusal(expected_status, raw_output):
    """Simmetrik ehtiyat metrikası: golden set `ok` gözləyirdi, model imtina etdi. Qapısı yoxdur."""
    if expected_status not in (None, "ok"):
        return None
    if not isinstance(raw_output, dict):
        return None
    return actual_status(raw_output) != "ok"


def status_match(expected_status, raw_output):
    """Yalnız informativ: imtina gözlənilən halda modelin dediyi SƏBƏB (status dəyəri) dəqiq
    uyğundurmu (məs. gözlənilən 'unreadable', model 'cut_off' deyibsə uyğun deyil, amma bu
    hallüsinasiya deyil — imtina edib, sadəcə səbəb fərqlidir). Qapıya girmir."""
    if expected_status in (None, "ok"):
        return None
    if not isinstance(raw_output, dict):
        return None
    return actual_status(raw_output) == expected_status


def evaluate_item(item, result, cfg):
    raw_output = result.get("raw_output")
    expected_status = item.get("expected_status") or "ok"

    entry = {
        "id": item.get("id") or result.get("id"),
        "status": result["status"],
        "latency_ms": result.get("latency_ms"),
        "attempts": result.get("attempts"),
        "image_meta": result.get("image_meta"),
        "error": result.get("error"),
        "raw_output": raw_output,
        "raw_text": result.get("raw_text"),
        "usage": result.get("usage"),
        "expected_status": expected_status,
        "actual_status": actual_status(raw_output),
        "ocr_confidence": raw_output.get("ocr_confidence") if isinstance(raw_output, dict) else None,
        "hallucination": is_hallucination(expected_status, raw_output),
        "false_refusal": is_false_refusal(expected_status, raw_output),
        "status_match": status_match(expected_status, raw_output),
    }

    if result["status"] == "not_implemented":
        return entry

    if cfg.price_input_per_1m is not None and cfg.price_output_per_1m is not None:
        entry["cost_usd"] = cost_lib.compute_cost_usd(
            entry["usage"], cfg.price_input_per_1m, cfg.price_output_per_1m
        )
    else:
        entry["cost_usd"] = None

    if result["status"] == "error":
        entry.update(
            {"schema_valid": False, "final_answer_correct": False, "step_structural": None, "leaked": None}
        )
        return entry

    raw = result["raw_output"]
    schema_valid, schema_errors = schema_check.validate(raw)
    entry["schema_valid"] = schema_valid
    if not schema_valid:
        entry["schema_errors"] = schema_errors
        entry["final_answer_correct"] = False
        entry["step_structural"] = None
        entry["leaked"] = None
        return entry

    canonical = item.get("canonical") or raw.get("canonical", "")
    values = raw.get("final_answer", {}).get("values", [])
    entry["final_answer_correct"] = verify.verify_final_answer(canonical, values)
    entry["step_structural"] = steps_compare.check_structure(raw.get("steps", []))
    entry["leaked"] = leak.detect_leak(raw.get("steps", []), values)
    return entry


def _rate(entries, key, is_match, is_denom):
    denom_entries = [e for e in entries if key in e and is_denom(e[key])]
    if not denom_entries:
        return {"rate": None, "matched": 0, "n": 0}
    matched = sum(1 for e in denom_entries if is_match(e[key]))
    return {"rate": matched / len(denom_entries), "matched": matched, "n": len(denom_entries)}


def _structural_rate(entries, condition):
    structs = [e["step_structural"] for e in entries if e.get("step_structural") is not None]
    if not structs:
        return {"rate": None, "matched": 0, "n": 0}
    matched = sum(1 for s in structs if s[condition] is True)
    return {"rate": matched / len(structs), "matched": matched, "n": len(structs)}


def load_human_review(path):
    """{"id": ..., "verdict": true|false, "note": "..."} sətirlərini {id: verdict} dict-ə çevirir."""
    verdicts = {}
    if path is None:
        return verdicts
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            verdicts[row["id"]] = bool(row["verdict"])
    return verdicts


def find_latest_human_review(results_dir):
    candidates = sorted(results_dir.glob("human-review-*.jsonl"))
    return candidates[-1] if candidates else None


def successful(entries):
    """Yalnız faktiki çıxış verən item-lər ("ok") — "not_implemented" və "error" statuslu
    item-lərin nə addımı var, nə də insan review edə biləcəyi məzmunu."""
    return [e for e in entries if e.get("status") == "ok"]


def pedagogical_summary(entries, human_review):
    """entries — evaluate_item()-dən çıxan siyahı (və ya nəticə JSON-undakı "items")."""
    if not human_review:
        return {"rate": None, "matched": 0, "n": 0, "note": HUMAN_REVIEW_NOTE}
    reviewed = [(e["id"], human_review[e["id"]]) for e in entries if e.get("id") in human_review]
    if not reviewed:
        return {"rate": None, "matched": 0, "n": 0, "note": HUMAN_REVIEW_NOTE}
    matched = sum(1 for _, verdict in reviewed if verdict)
    return {"rate": matched / len(reviewed), "matched": matched, "n": len(reviewed), "note": None}


def aggregate(entries, human_review=None):
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
    metrics["leak_rate"] = _rate(attempted, "leaked", lambda v: v is True, lambda v: v is not None)

    metrics["hallucination_rate"] = _rate(attempted, "hallucination", lambda v: v is True, lambda v: v is not None)
    metrics["false_refusal_rate"] = _rate(attempted, "false_refusal", lambda v: v is True, lambda v: v is not None)
    metrics["status_match_rate"] = _rate(attempted, "status_match", lambda v: v is True, lambda v: v is not None)

    metrics["step_split_structural"] = {
        cond: _structural_rate(attempted, cond) for cond, _label in steps_compare.STRUCTURAL_CONDITIONS
    }
    metrics["step_split_pedagogical"] = pedagogical_summary(successful(attempted), human_review)

    costs = [e["cost_usd"] for e in attempted if e.get("cost_usd") is not None]
    latencies = [e["latency_ms"] for e in attempted if e.get("latency_ms") is not None]
    metrics["avg_cost_usd"] = sum(costs) / len(costs) if costs else None
    metrics["avg_latency_ms"] = sum(latencies) / len(latencies) if latencies else None

    metrics["gate_eligible"] = n >= MIN_GOLDEN_SET_N
    if not metrics["gate_eligible"]:
        metrics["gate_status"] = f"QAPI ÖLÇÜLƏ BİLMƏZ (n={n}, minimum {MIN_GOLDEN_SET_N})"
    else:
        fa = metrics["final_answer_accuracy"]["rate"] or 0
        sv = metrics["schema_validity"]["rate"] or 0
        structural_rate = metrics["step_split_structural"]["all_pass"]["rate"] or 0
        hallucination = metrics["hallucination_rate"]
        pedagogical = metrics["step_split_pedagogical"]

        if pedagogical["n"] == 0:
            metrics["gate_pass"] = None
            metrics["gate_status"] = f"NATAMAM — {HUMAN_REVIEW_NOTE} (addım bölgüsünün pedaqoji hissəsi)"
        else:
            structural_ok = structural_rate >= GATE_STEP_SPLIT_STRUCTURAL
            pedagogical_ok = (pedagogical["rate"] or 0) >= GATE_STEP_SPLIT_PEDAGOGICAL
            # hallucination["n"] == 0 deməkdir golden set-də imtina gözlənilən nümunə yoxdur —
            # bu şərt vakuum halında doğrudur, amma ADR-006 bunu tələb edir: real datada n>0 olmalıdır.
            hallucination_ok = hallucination["n"] == 0 or hallucination["rate"] == GATE_HALLUCINATION
            gate_pass = (
                fa >= GATE_FINAL_ANSWER
                and sv >= GATE_SCHEMA_VALIDITY
                and structural_ok
                and pedagogical_ok
                and hallucination_ok
            )
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

    print("  Addım bölgüsü — struktur:")
    structural = metrics["step_split_structural"]
    for cond, label in steps_compare.STRUCTURAL_CONDITIONS:
        gate_value = GATE_STEP_SPLIT_STRUCTURAL if cond == "all_pass" else None
        _print_metric_line(f"    {label}", structural[cond], gate_eligible, gate_value)

    pedagogical = metrics["step_split_pedagogical"]
    if pedagogical["n"] == 0:
        print(f"  Addım bölgüsü — pedaqoji: {pedagogical['note']}")
    else:
        _print_metric_line("Addım bölgüsü — pedaqoji", pedagogical, gate_eligible, GATE_STEP_SPLIT_PEDAGOGICAL)

    _print_metric_line("Cavab sızması", metrics["leak_rate"], gate_eligible)
    _print_metric_line("Hallüsinasiya (imtina gözlənilirdi, həll verdi)", metrics["hallucination_rate"], gate_eligible, GATE_HALLUCINATION)
    _print_metric_line("Artıq ehtiyat (ok gözlənilirdi, imtina etdi)", metrics["false_refusal_rate"], gate_eligible)
    _print_metric_line("İmtina səbəbi uyğunluğu (informativ)", metrics["status_match_rate"], gate_eligible)

    if metrics.get("avg_cost_usd") is not None:
        print(f"  Orta xərc/həll: ${metrics['avg_cost_usd']:.5f}")
    else:
        print("  Orta xərc/həll: ölçülmədi (PRICE_INPUT_PER_1M/PRICE_OUTPUT_PER_1M .env-də yoxdur, ya da usage boşdur)")
    if metrics.get("avg_latency_ms") is not None:
        print(f"  Orta latensiya: {metrics['avg_latency_ms']:.0f} ms")

    if gate_eligible:
        print(f"\nQapı: {metrics['gate_status']}")


def find_latest_result(pipeline_name, out_dir):
    candidates = sorted(out_dir.glob(f"{pipeline_name}-*.json"))
    return candidates[-1] if candidates else None


def print_compare(path_a, path_b, results_dir):
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
        ("leak_rate", "Cavab sızması"),
        ("hallucination_rate", "Hallüsinasiya"),
        ("false_refusal_rate", "Artıq ehtiyat"),
    ):
        ma = data_a["metrics"].get(key, {})
        mb = data_b["metrics"].get(key, {})
        eligible_a = data_a["metrics"].get("gate_eligible", False)
        eligible_b = data_b["metrics"].get("gate_eligible", False)
        va = f"{ma['rate']*100:.1f}%" if eligible_a and ma.get("rate") is not None else f"{ma.get('matched', 0)}/{ma.get('n', 0)}"
        vb = f"{mb['rate']*100:.1f}%" if eligible_b and mb.get("rate") is not None else f"{mb.get('matched', 0)}/{mb.get('n', 0)}"
        print(f"  {label}: A={va}  B={vb}")

    print("  Addım bölgüsü — struktur (all_pass):")
    for label_pipeline, data, eligible in (("A", data_a, data_a["metrics"].get("gate_eligible")), ("B", data_b, data_b["metrics"].get("gate_eligible"))):
        struct = data["metrics"].get("step_split_structural", {}).get("all_pass", {"rate": None, "matched": 0, "n": 0})
        v = f"{struct['rate']*100:.1f}%" if eligible and struct.get("rate") is not None else f"{struct.get('matched', 0)}/{struct.get('n', 0)}"
        print(f"    {label_pipeline}={v}")

    # Pedaqoji hissə: --compare vaxtı ƏN SON human-review faylı ilə TƏZƏDƏN hesablanır
    # (run vaxtından sonra insan rəyi əlavə olunmuş ola bilər).
    hr_path = find_latest_human_review(results_dir)
    human_review = load_human_review(hr_path)
    ped_a = pedagogical_summary(successful(data_a.get("items", [])), human_review)
    ped_b = pedagogical_summary(successful(data_b.get("items", [])), human_review)
    if hr_path is None:
        print(f"  Addım bölgüsü — pedaqoji: {HUMAN_REVIEW_NOTE}")
    else:
        print(f"  Addım bölgüsü — pedaqoji ({hr_path.name}):")
        for label_pipeline, ped in (("A", ped_a), ("B", ped_b)):
            v = f"{ped['rate']*100:.1f}% ({ped['matched']}/{ped['n']})" if ped["n"] else "insan rəyi yoxdur"
            print(f"    {label_pipeline}={v}")

    for key, label in (("avg_cost_usd", "Orta xərc"), ("avg_latency_ms", "Orta latensiya")):
        va = data_a["metrics"].get(key)
        vb = data_b["metrics"].get(key)
        print(f"  {label}: A={va}  B={vb}")

    if not (data_a["metrics"].get("gate_eligible") and data_b["metrics"].get("gate_eligible")):
        print(f"\n⚠ Ən azı bir tərəf qapı üçün kifayət qədər nümunəyə malik deyil (minimum {MIN_GOLDEN_SET_N}). Qapı hökmü verilmir.")
    elif hr_path is None:
        print(f"\n⚠ {HUMAN_REVIEW_NOTE} — ümumi qapı NATAMAM sayılır, insan rəyi olmadan KEÇDİ elan edilmir.")
