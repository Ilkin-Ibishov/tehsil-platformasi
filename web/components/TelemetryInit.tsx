"use client";

import { useEffect } from "react";
import { initTelemetry, trackEvent } from "@/lib/telemetry";

/** Root layout-a bir dəfə qoyulur: flush dövrünü başladır. Heç nə render etmir. */
export function TelemetryInit() {
  useEffect(() => {
    initTelemetry();
    if (process.env.NODE_ENV !== "production") {
      // Yalnız dev: S1a qəbul şərtlərini (offline növbə, idempotentlik) konsoldan sınamaq üçün.
      (window as unknown as { __telemetry: unknown }).__telemetry = { trackEvent };
    }
  }, []);
  return null;
}
