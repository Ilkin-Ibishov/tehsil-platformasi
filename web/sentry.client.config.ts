import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring — production-da 20% sample, dev-də 100%
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Release tracking — Vercel deployment SHA ilə əlaqələndirmə
  release: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
  environment: process.env.NODE_ENV,

  // Debug mode only in development
  debug: false,

  // Capture unhandled promise rejections
  integrations: [
    Sentry.browserTracingIntegration(),
  ],

  // Filter out noisy or irrelevant errors
  beforeSend(event) {
    // Skip if no DSN configured (dev mode without Sentry)
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
    return event;
  },

  // Auto-tag with device_id for correlation with our telemetry
  initialScope: (scope) => {
    if (typeof window !== "undefined") {
      try {
        const deviceId = localStorage.getItem("th_device_id");
        if (deviceId) {
          scope.setUser({ id: deviceId });
          scope.setTag("device_id", deviceId);
        }
        const profile = localStorage.getItem("th_profile");
        if (profile) {
          try {
            const p = JSON.parse(profile);
            if (p.grade) scope.setTag("grade", String(p.grade));
            if (p.role) scope.setTag("role", p.role);
          } catch { /* ignore parse errors */ }
        }
      } catch { /* localStorage unavailable */ }
    }
    return scope;
  },
});
