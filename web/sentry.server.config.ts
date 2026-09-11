import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring — server-side traces for API routes
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
  environment: process.env.NODE_ENV,

  debug: false,

  // Tag LLM-related errors with cascade context
  beforeSend(event) {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
    return event;
  },
});
