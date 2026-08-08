"use client";

import { getDeviceId } from "@/lib/telemetry";

// SYSTEM-REVIEW-2026-08-07 §A1: `attempts.completed` indi klientdən yazılır. Telemetriya
// kimi fire-and-forget — heç vaxt UI-ı bloklamır, xəta heç yerə çıxmır (queue/retry yoxdur,
// itsə itsin, bu, ölçmə siqnalıdır, məhsul davranışı deyil).
export function reportAttemptProgress(params: {
  attemptId: string;
  completed: boolean;
  abandonedAtStep: number | null;
  durationSec: number | null;
}): void {
  const { attemptId, completed, abandonedAtStep, durationSec } = params;
  fetch("/api/attempts/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attempt_id: attemptId,
      device_id: getDeviceId(),
      completed,
      abandoned_at_step: abandonedAtStep,
      duration_sec: durationSec,
    }),
    keepalive: true,
  }).catch(() => {
    // Şəbəkə xətası — ölçmə siqnalı itir, UI-a heç nə bildirilmir.
  });
}
