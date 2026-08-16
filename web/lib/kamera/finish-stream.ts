// Client helper for `/api/solve/finish` NDJSON (COST-LATENCY-SAFE-SEQUENCE addım 5).
// Kept out of page.tsx so parallel edits are less likely to wipe the stream parser.

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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (event.type === "step" && event.step && typeof event.step === "object") {
        const step = event.step as Record<string, unknown>;
        const check = step.check;
        if (check && typeof check === "object" && check !== null && "accept" in check) {
          delete (check as Record<string, unknown>).accept;
        }
        onStep(step as FinishPreviewStep);
        continue;
      }
      if (event.type === "final") {
        const { type: _t, ...rest } = event;
        finalBody = rest;
      }
    }
  }

  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer.trim()) as Record<string, unknown>;
      if (event.type === "final") {
        const { type: _t, ...rest } = event;
        finalBody = rest;
      } else if (!finalBody) {
        finalBody = event;
      }
    } catch {
      /* ignore */
    }
  }

  return finalBody ?? { status: "unreadable", reason: "Boş cavab" };
}
