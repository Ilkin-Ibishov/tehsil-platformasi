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

export default withNextIntl(nextConfig);
