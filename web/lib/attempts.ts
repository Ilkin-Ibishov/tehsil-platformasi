"use client";

import { getDeviceId } from "@/lib/telemetry";

// SYSTEM-REVIEW-2026-08-07 §A1: `attempts.completed` indi klientdən yazılır. Telemetriya
// kimi fire-and-forget — heç vaxt UI-ı bloklamır, xəta heç yerə çıxmır (queue/retry yoxdur,
// itsə itsin, bu, ölçmə siqnalıdır, məhsul davranışı deyil).
// S4 (86eymwgk7) — `revealedAnswer` AÇIQ ötürülür (server `durationSec !== null`-dan
// TƏXMİN ETMİR): unmount-cleanup çağırışı (SolveView-in "səhifə tərk edildi" qolu) reveal()
// heç vaxt çağırılmadan da `durationSec: null` göndərə bilər, amma gələcəkdə bu sahə başqa
// məqsədlə dolarsa (məs. qismən müddət ölçməsi) implisit qayda səssiz sınardı. `reveal()`-in
// ÖZÜ (final_answer HƏQİQƏTƏN göstərildi) YEGANƏ `revealedAnswer: true` mənbəyidir.
export function reportAttemptProgress(params: {
  attemptId: string;
  completed: boolean;
  abandonedAtStep: number | null;
  durationSec: number | null;
  revealedAnswer: boolean;
}): void {
  const { attemptId, completed, abandonedAtStep, durationSec, revealedAnswer } = params;
  fetch("/api/attempts/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attempt_id: attemptId,
      device_id: getDeviceId(),
      completed,
      abandoned_at_step: abandonedAtStep,
      duration_sec: durationSec,
      revealed_answer: revealedAnswer,
    }),
    keepalive: true,
  }).catch(() => {
    // Şəbəkə xətası — ölçmə siqnalı itir, UI-a heç nə bildirilmir.
  });
}
