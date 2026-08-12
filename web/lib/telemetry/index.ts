"use client";

import { uuidv4 } from "./uuid";
import { enqueue, peekBatch, queueLength, removeBatch } from "./queue";
import type { TelemetryEvent } from "./types";

// docs/TELEMETRY.md → "Göndərmə qaydaları"
const FLUSH_MAX_EVENTS = 10;
const FLUSH_INTERVAL_MS = 10_000;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

const DEVICE_ID_KEY = "th_device_id";
const SESSION_ID_KEY = "th_session_id";

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage bloklanıbsa (məs. gizli rejim) — sessiya üçün müvəqqəti id.
    return uuidv4();
  }
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return uuidv4();
  }
}

let currentAttemptId: string | undefined;

/** Bir "həll axını" (kamera → həll → bitir) başlayanda çağırılır — sonrakı hadisələr ona bağlanır. */
export function setAttemptId(attemptId: string | undefined) {
  currentAttemptId = attemptId;
}

let flushing = false;

async function flush(): Promise<void> {
  if (flushing) return; // eyni anda iki flush bir-birini üstələməsin
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  flushing = true;
  try {
    const batch = await peekBatch(FLUSH_MAX_EVENTS);
    if (batch.length === 0) return;

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });

    if (res.ok) {
      await removeBatch(batch.map((e) => e.event_id));
    }
    // res.ok deyilsə heç nə silinmir — növbəti flush cəhdində yenidən göndəriləcək (idempotent).
  } catch {
    // Şəbəkə xətası — növbə saxlanılır, UI-a heç nə bildirilmir (TELEMETRY.md → "heç vaxt bloklama").
  } finally {
    flushing = false;
  }
}

/** Hadisəni növbəyə əlavə edir. Sinxron qaytarır — çağıran heç vaxt gözləməli deyil. */
export function trackEvent(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return; // server-side render zamanı no-op

  const event: TelemetryEvent = {
    event_id: uuidv4(),
    device_id: getDeviceId(),
    session_id: getSessionId(),
    attempt_id: currentAttemptId,
    name,
    ts_client: new Date().toISOString(),
    props,
    app_version: APP_VERSION,
    schema_version: 1,
  };

  enqueue(event)
    .then(() => queueLength())
    .then((n) => {
      if (n >= FLUSH_MAX_EVENTS) void flush();
    })
    .catch(() => {
      // IndexedDB yazıla bilmədi — telemetriya itir, amma UI-a heç vaxt xəta çıxmır.
    });
}

let started = false;

/** Root layout-da bir dəfə çağırılır: periodik flush + offline-dan qayıdanda flush qurur. */
export function initTelemetry(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  setInterval(() => void flush(), FLUSH_INTERVAL_MS);
  window.addEventListener("online", () => void flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });

  // ClickUp: klient xətalarının görünürlüyü, üçüncü tərəf aləti (Sentry və s.) OLMADAN —
  // artıq mövcud `events` boru xətti ilə. Mesaj/stack KƏSİLİR (500/2000 simvol) ki, növbəyə
  // gözlənilməz həcmdə data düşməsin; PII/cavab məzmunu bura HEÇ VAXT gəlmir (JS runtime
  // xətaları, şəkil/həll datası deyil).
  window.addEventListener("error", (event) => {
    trackEvent("client.error", {
      message: String(event.message ?? "").slice(0, 500),
      filename: event.filename || null,
      lineno: event.lineno || null,
      colno: event.colno || null,
      stack: event.error instanceof Error && event.error.stack ? event.error.stack.slice(0, 2000) : null,
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    trackEvent("client.unhandled_rejection", {
      message: (reason instanceof Error ? reason.message : String(reason ?? "")).slice(0, 500),
      stack: reason instanceof Error && reason.stack ? reason.stack.slice(0, 2000) : null,
    });
  });

  void flush(); // əvvəlki sessiyadan qalan növbə varsa dərhal cəhd et
}
