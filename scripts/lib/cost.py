"""Token x qiymət = xərc. Qiymətlər .env-dən gəlir, hardcode edilmir."""


def compute_cost_usd(usage, price_input_per_1m, price_output_per_1m):
    if not usage:
        return None
    prompt_tokens = usage.get("prompt_tokens", 0) or 0
    completion_tokens = usage.get("completion_tokens", 0) or 0
    return (prompt_tokens / 1_000_000) * price_input_per_1m + (
        completion_tokens / 1_000_000
    ) * price_output_per_1m
