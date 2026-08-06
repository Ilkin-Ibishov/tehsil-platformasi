import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // lib/design-tokens.ts docs/DESIGN-TOKENS.json-u (repo kökündə, web/-dən kənarda) idxal edir —
  // ADR-002: dizayn tokenlərinin TƏK MƏNBƏYİ. Root-u genişləndirmək bu idxala icazə verir,
  // faylı web/ içinə köçürmək/kopyalamaq əvəzinə (o zaman iki nüsxə olardı).
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Repo kökündə artıq öz CLAUDE.md-imiz var (Cowork sahibliyindədir, fayl sahibliyi cədvəli).
  // Next.js-in avtomatik web/CLAUDE.md + web/AGENTS.md generasiyası onunla toqquşur.
  agentRules: false,
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
