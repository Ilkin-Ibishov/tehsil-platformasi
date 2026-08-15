"""Token × tarif = xərc. `web/lib/cost.ts` ilə eyni qayda (ADR-028)."""


def _num(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if value != value:
        return None
    return value


def _billable_output(usage, prompt, completion):
    total = usage.get("total_tokens")
    if total is None:
        total = usage.get("totalTokens")
    total = _num(total)

    details = usage.get("completion_tokens_details") or usage.get("completionTokensDetails") or {}
    reasoning = None
    if isinstance(details, dict):
        reasoning = _num(details.get("reasoning_tokens"))
        if reasoning is None:
            reasoning = _num(details.get("reasoningTokens"))
    if reasoning is None:
        reasoning = _num(usage.get("thoughts_token_count"))
    reasoning = 0 if reasoning is None else reasoning

    if total is not None and total >= prompt:
        return max(0, total - prompt)
    if reasoning > 0 and completion >= reasoning:
        return completion
    return completion + reasoning


def compute_cost_usd(usage, price_input_per_1m, price_output_per_1m):
    if not usage or not isinstance(usage, dict):
        return None

    billed = _num(usage.get("cost_usd"))
    if billed is None:
        billed = _num(usage.get("cost"))
    if billed is not None and billed >= 0:
        return float(billed)

    prompt = _num(usage.get("prompt_tokens"))
    if prompt is None:
        prompt = _num(usage.get("promptTokens"))
    completion = _num(usage.get("completion_tokens"))
    if completion is None:
        completion = _num(usage.get("completionTokens"))

    if prompt is None and completion is None and _num(usage.get("total_tokens")) is None and _num(usage.get("totalTokens")) is None:
        return None

    prompt = 0 if prompt is None else prompt
    completion = 0 if completion is None else completion
    output = _billable_output(usage, prompt, completion)
    return (prompt / 1_000_000) * price_input_per_1m + (output / 1_000_000) * price_output_per_1m
