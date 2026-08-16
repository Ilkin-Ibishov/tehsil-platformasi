// Client helper for `/api/solve/finish` NDJSON (COST-LATENCY-SAFE-SEQUENCE addım 5).
// Kept out of page.tsx so parallel edits are less likely to wipe the stream parser.
//
// Server may send `{type:"open"}` + a padded `{type:"pad"}` line first so WebKit/proxies
// flush early (see finish route). Those lines are ignored here. `check.accept` is stripped
// on every step (ADR-017). `finish_wait_ms` still measures until the `final` event.

export type FinishPreviewStep = {
  index?: number;
  title?: string;
  explanation?: string;
};

export async function readFinishNdjson(
  res: Response,
  onStep: (step: FinishPreviewStep) => void
): Promise<Record<string, unknown>> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("ndjson") || !res.body) {
    return res.json() as Promise<Record<string, unknown>>;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalBody: Record<string, unknown> | null = null;

  const ingestLine = (trimmed: string) => {
    if (!trimmed) return;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      return;
    }
    const type = event.type;
    // open/pad = flush priming only; never surface to UI.
    if (type === "open" || type === "pad") return;
    if (type === "step" && event.step && typeof event.step === "object") {
      const step = event.step as Record<string, unknown>;
      const check = step.check;
      if (check && typeof check === "object" && check !== null && "accept" in check) {
        delete (check as Record<string, unknown>).accept;
      }
      onStep(step as FinishPreviewStep);
      return;
    }
    if (type === "final") {
      const { type: _t, ...rest } = event;
      finalBody = rest;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) ingestLine(line.trim());
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    ingestLine(buffer.trim());
  }

  return finalBody ?? { status: "unreadable", reason: "Boş cavab" };
}
