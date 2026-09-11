import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  release: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
  environment: process.env.NODE_ENV,

  debug: false,
});
