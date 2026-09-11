import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // lib/design-tokens.ts docs/DESIGN-TOKENS.json-u (repo kökündə, web/-dən kənarda) idxal edir —
  // ADR-002: dizayn tokenlərinin TƏK MƏNBƏYİ. Root-u genişləndirmək bu idxala icazə verir,
  // faylı web/ içinə köçürmək/kopyalamaq əvəzinə (o zaman iki nüsxə olardı).
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  outputFileTracingRoot: path.join(__dirname, ".."),
  // lib/prompt.ts prompts/solve/core.md + prompts/solve/math.md-i (repo kökündə) runtime-da
  // fs ilə oxuyur (ADR-012: eval harness ilə TƏK MƏNBƏ; ADR-014/HANDOFF 40: fayl bölündü).
  // Statik idxal deyil (markdown, JSON kimi bundle olunmur), ona görə tracer-ə açıq şəkildə
  // deyilir ki, hər iki faylı funksiya bundle-ına daxil etsin.
  outputFileTracingIncludes: {
    "/api/solve": ["../prompts/solve/core.md", "../prompts/solve/math.md"],
  },
  // Repo kökündə artıq öz CLAUDE.md-imiz var (Cowork sahibliyindədir, fayl sahibliyi cədvəli).
  // Next.js-in avtomatik web/CLAUDE.md + web/AGENTS.md generasiyası onunla toqquşur.
  agentRules: false,
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withSentryConfig(
  withNextIntl(nextConfig),
  {
    // Sentry build-time options
    silent: true,
    org: process.env.SENTRY_ORG || "essential-inc-vq",
    project: process.env.SENTRY_PROJECT || "javascript-nextjs",

    // Source maps upload — requires SENTRY_AUTH_TOKEN
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Upload a larger set of source maps for readability
    widenClientFileUpload: true,

    // Tunnel Sentry events through our domain to bypass ad-blockers
    tunnelRoute: "/monitoring",

    // Automatically delete source maps after upload
    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },

    // Automatically associate commits and releases
    release: { name: process.env.NEXT_PUBLIC_APP_VERSION || "dev" },
  }
);
