// Server-side PostHog client for Next.js API routes.
// Used for tracking LLM/AI generation events ($ai_generation) and
// server-side analytics that cannot be captured client-side.
//
// DOES NOT replace client-side posthog-js — both are needed:
//   - posthog-js (client): pageviews, UI interactions, session replay
//   - posthog-node (server): LLM calls, API events, server-side identify

import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;

  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

/**
 * Track an LLM / AI generation event in PostHog ($ai_generation).
 * Maps to the PostHog AI Analytics standard documented at
 * https://posthog.com/docs/ai-engineering/observability
 *
 * Call this after every callVisionLLM() return.
 */
export function trackAIGeneration(opts: {
  distinctId: string;
  model: string;
  provider?: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  /** The cascade layer (Qat) that triggered this LLM call. */
  layer?: string;
  /** Whether context cache was used. */
  cacheHit?: boolean;
  /** Whether a model fallback occurred. */
  fallbackUsed?: boolean;
  fallbackFrom?: string | null;
  traceId?: string;
}) {
  const client = getPostHogServer();
  if (!client) return;

  client.capture({
    distinctId: opts.distinctId,
    event: "$ai_generation",
    properties: {
      $ai_model: opts.model,
      $ai_provider: opts.provider || "google",
      $ai_latency: opts.latencyMs / 1000, // seconds
      $ai_input_tokens: opts.inputTokens,
      $ai_output_tokens: opts.outputTokens,
      $ai_total_cost_usd: opts.costUsd,
      // Custom properties for our cascade
      $ai_layer: opts.layer,
      $ai_cache_hit: opts.cacheHit,
      $ai_fallback_used: opts.fallbackUsed,
      $ai_fallback_from: opts.fallbackFrom,
      $ai_trace_id: opts.traceId,
    },
  });
}
