"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import Link from "next/link";

export default function SentryExamplePage() {
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  const triggerClientError = () => {
    throw new Error("Sentry Example Frontend Error (Sentry.captureException)");
  };

  const triggerDirectSentryCapture = () => {
    const eventId = Sentry.captureException(
      new Error("Sentry Manual Capture Test from /sentry-example-page")
    );
    alert(`Sentry xətası göndərildi! Event ID: ${eventId}`);
  };

  const triggerApiError = async () => {
    setApiStatus("API sorğusu göndərilir...");
    try {
      const res = await fetch("/api/sentry-example-api");
      if (!res.ok) {
        setApiStatus(`Server xətası alındı (${res.status}). Sentry-də yoxlayın.`);
      }
    } catch {
      setApiStatus("Şəbəkə xətası baş verdi.");
    }
  };

  const triggerPostHogEvent = () => {
    try {
      const ph = (window as unknown as { posthog?: { capture: (name: string, props?: Record<string, unknown>) => void } }).posthog;
      if (ph && typeof ph.capture === "function") {
        ph.capture("manual_posthog_test_click", {
          source: "/sentry-example-page",
          timestamp: new Date().toISOString(),
        });
        alert("PostHog test hadisəsi göndərildi! (manual_posthog_test_click)");
      } else {
        alert("PostHog açarı tapılmadı və ya klient hələ yüklənməyib.");
      }
    } catch (e) {
      alert(`PostHog xətası: ${(e as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)] text-[var(--text-primary)]">
      <div className="max-w-md w-full p-8 rounded-2xl border border-[var(--border)] shadow-xl bg-[var(--surface)] text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Sentry Test Səhifəsi</h1>
          <p className="text-sm opacity-80">
            Sentry inteqrasiyasını yoxlamaq üçün aşağıdakı düymələrdən birini klikləyin.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={triggerDirectSentryCapture}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors cursor-pointer"
          >
            1. Sentry.captureException Göndər
          </button>

          <button
            type="button"
            onClick={triggerClientError}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors cursor-pointer"
          >
            2. Frontend Xətası At (throw Error)
          </button>

          <button
            type="button"
            onClick={triggerApiError}
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors cursor-pointer"
          >
            3. Server API Xətası Çağır (/api/sentry-example-api)
          </button>

          <button
            type="button"
            onClick={triggerPostHogEvent}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors cursor-pointer"
          >
            4. PostHog Test Hadisəsi Göndər (posthog.capture)
          </button>
        </div>

        {apiStatus && (
          <p className="text-xs font-mono p-2 rounded bg-black/20 text-[var(--text-primary)]">
            {apiStatus}
          </p>
        )}

        <div className="pt-4 border-t border-[var(--border)]">
          <Link
            href="/"
            className="text-sm text-blue-500 hover:underline"
          >
            ← Əsas Səhifəyə Qayıt
          </Link>
        </div>
      </div>
    </div>
  );
}
