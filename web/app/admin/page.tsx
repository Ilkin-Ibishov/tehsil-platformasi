import Link from "next/link";
import { getAdminAnalyticsData } from "@/lib/admin/analytics";
import { verifyAdminAuth } from "@/lib/admin/auth";
import type { TimeRange, EnvironmentKind } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    range?: string;
    kind?: string;
    admin_key?: string;
  }>;
};

export default async function AdminDashboardPage(props: PageProps) {
  const isAuthorized = await verifyAdminAuth();
  if (!isAuthorized) {
    return null;
  }

  const searchParams = await props.searchParams;
  const range = (searchParams.range || "7d") as TimeRange;
  const kind = (searchParams.kind || "all") as EnvironmentKind;

  const data = await getAdminAnalyticsData({ range, kind });
  const { overview, pedagogical, unitEconomics, funnel, aiHealth } = data;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 0. Sintetik Data / Nümunə Rejimi Xəbərdarlığı */}
      {data.isSampleData && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚠️</span>
            <div>
              <span className="font-bold">NÜMUNƏ / SİNTETİK DATA (DİM Kalibrasiyası):</span>{" "}
              <span>Bu filtr üzrə bazada canlı həll tapılmadı. Göstərilən rəqəmlər yalnız DİM proqramı referans modelidir. Bake və S6 qərarları üçün bu faizlərə əsaslanmayın!</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 font-mono text-[11px] shrink-0 font-semibold">
            SAMPLE MODE
          </span>
        </div>
      )}

      {/* 1. Başlıq və Vəziyyət Xülasəsi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--sur)] p-6 rounded-2xl border border-[var(--bor)] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Əməliyyat və Qərar İdarəetmə Tablosu</h2>
            {overview.costTargetAlert ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Maya Dəyəri Xəbərdarlığı: &gt; $0.010
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                İqtisadi Hədəf Qorunur: ≤ $0.010
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--t2)] mt-1">
            Mühit: <span className="text-[var(--t1)] font-medium font-mono">{kind.toUpperCase()}</span> · Dövr:{" "}
            <span className="text-[var(--t1)] font-medium font-mono">{range.toUpperCase()}</span> · Cəmi həll:{" "}
            <span className="text-[var(--t1)] font-medium font-mono">{overview.totalSolves}</span>
          </p>
        </div>

        {/* Cəld Əməliyyat Düymələri */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/triage"
            className="px-4 py-2 rounded-xl bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <span>🏷️ Taksonomiya Triage</span>
            {overview.pendingTaxonomyCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-[var(--acc)] text-[10px] font-bold">
                {overview.pendingTaxonomyCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/config"
            className="px-4 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] hover:border-[var(--acc)] text-xs font-medium transition-all"
          >
            ⚙️ Model Seçimi
          </Link>
        </div>
      </div>

      {/* 2. Əsas 6 KPI Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Maya Dəyəri ($/solve) */}
        <div className="p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
          <span className="text-xs text-[var(--t3)] font-mono uppercase tracking-wider">Həll Başına Maya Dəyəri</span>
          <div className="my-2">
            <div
              className={`text-2xl font-bold font-mono ${
                overview.costTargetAlert ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              ${overview.avgCostUsd.toFixed(4)}
            </div>
            <div className="text-[11px] text-[var(--t2)] mt-0.5">
              Hədəf: <span className="font-mono text-[var(--t1)]">≤ $0.010</span>
            </div>
          </div>
          <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2">
            Toplam: ${overview.totalCostUsd.toFixed(2)}
          </div>
        </div>

        {/* KPI 2: Həqiqi Öyrənmə (Transfer %) */}
        <div className="p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
          <span className="text-xs text-[var(--t3)] font-mono uppercase tracking-wider">Həqiqi Öyrənmə (Transfer)</span>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[var(--acc)]">
              {overview.transferSuccessRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-[var(--t2)] mt-0.5">Yoxlama sualını sərbəst həll</div>
          </div>
          <div className="text-[11px] text-emerald-400 border-t border-[var(--bor)]/50 pt-2">
            Pedaqoji Uğur Siqnalı
          </div>
        </div>

        {/* KPI 3: Təslim Olma (Reveal %) */}
        <div className="p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
          <span className="text-xs text-[var(--t3)] font-mono uppercase tracking-wider">Təslim / Cavab Açma</span>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-amber-400">
              {overview.revealedAnswerRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-[var(--t2)] mt-0.5">«Cavabı göstər» basanlar</div>
          </div>
          <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2">
            Hədəf: &lt; 25%
          </div>
        </div>

        {/* KPI 4: Kamera Keş Səmərəsi (S6 Bake) vs Sual Bankı */}
        <div className="p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--t3)] font-mono uppercase tracking-wider">Kamera Keşi (S6 Bake)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              match_path
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-sky-400">
              {overview.cameraCacheHitRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-[var(--t2)] mt-0.5">
              Yalnız kamera (non-LLM) · Bank: {overview.bankMatchRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2 flex items-center justify-between">
            <span>Ümumi Keş:</span>
            <span className="font-mono text-[var(--t1)]">{overview.cacheHitRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* KPI 5: Latensiya (P90) */}
        <div className="p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
          <span className="text-xs text-[var(--t3)] font-mono uppercase tracking-wider">Gecikmə (P90 Latency)</span>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[var(--t1)]">
              {(overview.p90LatencyMs / 1000).toFixed(1)} san
            </div>
            <div className="text-[11px] text-[var(--t2)] mt-0.5">
              Orta: {(overview.avgLatencyMs / 1000).toFixed(1)} san
            </div>
          </div>
          <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2">
            Qat 1 OCR + Qat 5 Həll
          </div>
        </div>

        {/* KPI 6: SymPy Təsdiqi */}
        <div className="p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
          <span className="text-xs text-[var(--t3)] font-mono uppercase tracking-wider">SymPy Riyazi Yoxlama</span>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-violet-400">
              {overview.sympyVerifiedRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-[var(--t2)] mt-0.5">verified = true payı</div>
          </div>
          <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2">
            0% halüsinasiya filtri
          </div>
        </div>
      </div>

      {/* 3. SÜTUN 1 (Pedaqoji Nəbz) & SÜTUN 2 (Vahid İqtisadiyyatı) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SÜTUN 1: Pedaqoji Nəbz & Səhv Xəritəsi */}
        <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>🎯 Sütun 1: Pedaqoji Nəbz & Səhv Xəritəsi</span>
              </h3>
              <p className="text-xs text-[var(--t2)] mt-0.5">
                Qızıl Qayda: Məhsulun bütün dəyəri <code>error_code</code> taksonomiyasına bağlıdır.
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--acc)] px-2.5 py-1 rounded-lg bg-[var(--accsoft)]">
              11 Dəyişməz Enum
            </span>
          </div>

          {/* Səhv Kodları Dağılımı */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">
              Top Şagird Səhvləri (Misconception Taxonomy)
            </span>
            <div className="flex flex-col gap-2.5">
              {pedagogical.errorDistribution.map((err) => (
                <div key={err.code} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-[var(--t1)]">{err.code}</span>
                      <span className="text-[var(--t2)]">({err.titleAz})</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[var(--t3)]">{err.count} cəhd</span>
                      <span className="font-semibold text-[var(--acc)]">{err.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--acc)] rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(5, err.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sokratik İpucu İntizamı & Qaynar Mövzular */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--bor)]/60">
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--bor)]">
              <span className="text-xs text-[var(--t3)] block">Sokratik İpucu İntizamı</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {pedagogical.hintsImpact.successAfterHintRate}%
              </div>
              <span className="text-[11px] text-[var(--t2)]">İpucudan sonra düzgün cavab</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--bor)]">
              <span className="text-xs text-[var(--t3)] block">Ən Çox İlişilən Mövzu</span>
              <div className="text-sm font-bold text-[var(--t1)] mt-1 truncate">
                {pedagogical.topicFailureHotspots[0]?.topicTitle || "Kvadrat tənliklər"}
              </div>
              <span className="text-[11px] text-rose-400 font-mono">
                Əsas səhv: {pedagogical.topicFailureHotspots[0]?.topErrorCode || "SIGN_ERROR"}
              </span>
            </div>
          </div>
        </div>

        {/* SÜTUN 2: Vahid İqtisadiyyatı & Kaskad Keş */}
        <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>💰 Sütun 2: Vahid İqtisadiyyatı & Kaskad Keş</span>
              </h3>
              <p className="text-xs text-[var(--t2)] mt-0.5">
                Kaskad qatları (Qat 0-3 vs Qat 5) və həll başına xərc bölgüsü.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              Maya Hədəfi: $0.010
            </span>
          </div>

          {/* Kaskad Qatları (Match Path) Paylanması */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">
              Kaskad Keş Paylanması (match_path)
            </span>
            <div className="flex flex-col gap-2.5">
              {unitEconomics.matchPaths.map((mp) => (
                <div key={mp.path} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--t1)]">{mp.label}</span>
                      <span className="text-[11px] text-[var(--t3)] font-mono">
                        ({mp.costUsd > 0 ? `$${mp.costUsd.toFixed(3)}` : "0 xərc"})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[var(--t3)]">{mp.count} həll</span>
                      <span
                        className={`font-semibold ${
                          mp.path === "llm" ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {mp.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        mp.path === "llm" ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, mp.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kontekst Keşləmə & Token Qənaəti */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--bor)]/60">
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--bor)]">
              <span className="text-xs text-[var(--t3)] block">Kontekst Keşləmə Qənaəti</span>
              <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                {unitEconomics.tokenEfficiency.cacheSavingsPct}%
              </div>
              <span className="text-[11px] text-[var(--t2)] font-mono">
                {unitEconomics.tokenEfficiency.cachedTokens.toLocaleString()} keşlənmiş token
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--bor)]">
              <span className="text-xs text-[var(--t3)] block">Gözləmədə Tərketmə (S7)</span>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                {unitEconomics.latencyHistogram.waitingAbandonedCount}
              </div>
              <span className="text-[11px] text-[var(--t2)]">&gt;15 san gözləyib çıxanlar</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SÜTUN 3 (Səyahət Qıfı) & SÜTUN 4 (AI Keyfiyyəti & Forensika) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SÜTUN 3: Səyahət Qıfı (Student Journey Funnel) */}
        <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>🔄 Sütun 3: Səyahət Qıfı & Sürtünmə Nöqtələri</span>
              </h3>
              <p className="text-xs text-[var(--t2)] mt-0.5">
                Kamera açılışından transfer məsələsinin tamamlanmasına qədər şagird konversiyası.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {funnel.steps.map((step, idx) => (
              <div key={step.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--bg)] border border-[var(--bor)] flex items-center justify-center font-mono text-[10px] text-[var(--t3)]">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[var(--t1)]">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[var(--t3)]">{step.count}</span>
                    <span className="font-semibold text-emerald-400">{step.conversionFromStart.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                    style={{ width: `${step.conversionFromStart}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Kəsmə və OCR Sürtünmələri */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[var(--bor)]/60 text-center">
            <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bor)]">
              <span className="text-[11px] text-[var(--t3)] block">Çoxsaylı Namizəd</span>
              <span className="font-mono font-bold text-sm text-[var(--t1)] mt-1 block">
                {funnel.frictionSignals.multiCandidatesShownRate}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bor)]">
              <span className="text-[11px] text-[var(--t3)] block">OCR Düzəlişi</span>
              <span className="font-mono font-bold text-sm text-[var(--t1)] mt-1 block">
                {funnel.frictionSignals.transcriptCorrectedRate}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bor)]">
              <span className="text-[11px] text-[var(--t3)] block">Kamera İmtinası</span>
              <span className="font-mono font-bold text-sm text-rose-400 mt-1 block">
                {funnel.frictionSignals.cameraRefusalCount}
              </span>
            </div>
          </div>
        </div>

        {/* SÜTUN 4: AI Keyfiyyəti, SymPy & Şikayətlər */}
        <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>🔬 Sütun 4: AI Doğrulama & Forensika</span>
              </h3>
              <p className="text-xs text-[var(--t2)] mt-0.5">
                SymPy üçlü yoxlama statusu və şagird/tester şikayət axını.
              </p>
            </div>
            <Link
              href="/admin/sikayetler"
              className="text-xs text-[var(--acc)] hover:underline font-medium flex items-center gap-1"
            >
              Bütün Şikayətlər →
            </Link>
          </div>

          {/* SymPy Təsdiq Bölgüsü */}
          <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--bor)] flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--t2)]">SymPy Üçlü Yoxlama Nəticəsi</span>
              <span className="font-mono text-emerald-400 font-bold">
                {aiHealth.sympyVerification.verifiedPercentage.toFixed(1)}% verified
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-[var(--sur)] overflow-hidden flex">
              <div
                title="Təsdiqləndi (true)"
                className="bg-emerald-500 h-full"
                style={{
                  width: `${
                    (aiHealth.sympyVerification.verifiedTrueCount /
                      (aiHealth.sympyVerification.verifiedTrueCount +
                        aiHealth.sympyVerification.methodNoneCount +
                        aiHealth.sympyVerification.verifiedFalseCount || 1)) *
                    100
                  }%`,
                }}
              />
              <div
                title="Tənlik deyil / Mətn (none)"
                className="bg-amber-400 h-full"
                style={{
                  width: `${
                    (aiHealth.sympyVerification.methodNoneCount /
                      (aiHealth.sympyVerification.verifiedTrueCount +
                        aiHealth.sympyVerification.methodNoneCount +
                        aiHealth.sympyVerification.verifiedFalseCount || 1)) *
                    100
                  }%`,
                }}
              />
              <div
                title="Səhv tapıldı (false)"
                className="bg-rose-500 h-full"
                style={{
                  width: `${
                    (aiHealth.sympyVerification.verifiedFalseCount /
                      (aiHealth.sympyVerification.verifiedTrueCount +
                        aiHealth.sympyVerification.methodNoneCount +
                        aiHealth.sympyVerification.verifiedFalseCount || 1)) *
                    100
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--t3)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Təsdiq: {aiHealth.sympyVerification.verifiedTrueCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Yoxlanılmadı (none): {aiHealth.sympyVerification.methodNoneCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Səhv (false): {aiHealth.sympyVerification.verifiedFalseCount}
              </span>
            </div>
          </div>

          {/* Son Şikayətlər */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">
              Son Şagird & Tester Rəyləri
            </span>
            {aiHealth.recentBugReports.length === 0 ? (
              <div className="text-xs text-[var(--t3)] p-4 text-center border border-dashed border-[var(--bor)] rounded-xl">
                Aktiv şikayət qeydə alınmayıb.
              </div>
            ) : (
              aiHealth.recentBugReports.slice(0, 3).map((report) => (
                <div
                  key={report.id}
                  className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--bor)] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--t1)] font-medium leading-relaxed">{report.description}</span>
                    <span className="text-[11px] text-[var(--t3)] font-mono">
                      {report.route} · {report.createdAt}
                    </span>
                  </div>
                  {report.hasCapture && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--accsoft)] text-[var(--acc)] shrink-0">
                      Şəkil Var
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
