import Link from "next/link";
import { getAdminAnalyticsData } from "@/lib/admin/analytics";
import { verifyAdminAuth } from "@/lib/admin/auth";
import type { TimeRange, EnvironmentKind, AdminTab } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    range?: string;
    kind?: string;
    tab?: string;
    admin_key?: string;
  }>;
};

function formatDuration(msOrSec: number, isSeconds = false): string {
  const totalSec = Math.round(isSeconds ? msOrSec : msOrSec / 1000);
  if (totalSec < 60) {
    return `${totalSec} san`;
  }
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return secs > 0 ? `${mins} dəq ${secs} san` : `${mins} dəq`;
}

function formatEventTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString("az-AZ", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default async function AdminDashboardPage(props: PageProps) {
  const isAuthorized = await verifyAdminAuth();
  if (!isAuthorized) {
    return null;
  }

  const searchParams = await props.searchParams;
  const kind = (searchParams.kind || "all") as EnvironmentKind;
  const range = (searchParams.range || (kind === "soak" ? "all" : "7d")) as TimeRange;
  const tab = (searchParams.tab || "students") as AdminTab;

  const data = await getAdminAnalyticsData({ range, kind });
  const { students, overview, pedagogical, unitEconomics, funnel, aiHealth } = data;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 0. Sintetik Data / Nümunə Rejimi Xəbərdarlığı */}
      {data.isSampleData && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <span className="font-bold">NÜMUNƏ / SİNTETİK DATA (DİM Kalibrasiyası):</span>{" "}
              <span>Bu filtr ({kind}, {range}) üzrə bazada canlı həll tapılmadı. Göstərilən rəqəmlər yalnız DİM proqramı referans modelidir.</span>
            </div>
          </div>
          {kind === "soak" && range !== "all" ? (
            <Link
              href="/admin?kind=soak&range=all"
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-mono text-xs font-semibold shrink-0 border border-amber-500/30 text-center"
            >
              Bütün Tarixi Soak Həllərinə Bax (range=all) →
            </Link>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 font-mono text-[11px] shrink-0 font-semibold">
              SAMPLE MODE
            </span>
          )}
        </div>
      )}

      {/* 1. Başlıq və Vəziyyət Xülasəsi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--sur)] p-5 sm:p-6 rounded-2xl border border-[var(--bor)] shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {tab === "students" && "🎓 Şagirdlər & Canlı Fəaliyyət Jurnalı"}
              {tab === "pedagogy" && "📊 Pedaqoji Nəbz & Səhv Qıfı"}
              {tab === "economics" && "💰 Vahid İqtisadiyyatı & Keş Səmərəsi"}
            </h2>
            {overview.costTargetAlert ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Maya Dəyəri: &gt; $0.010
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                İqtisadi Hədəf: ≤ $0.010
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--t2)] mt-1">
            Mühit: <span className="text-[var(--t1)] font-medium font-mono">{kind.toUpperCase()}</span> · Dövr:{" "}
            <span className="text-[var(--t1)] font-medium font-mono">{range.toUpperCase()}</span> · Aktiv şagird/cihaz:{" "}
            <span className="text-[var(--t1)] font-medium font-mono">{students?.participants?.length || 0}</span>
          </p>
        </div>

        {/* Cəld Əməliyyat Keçidləri */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/triage"
            className="px-3.5 py-2 rounded-xl bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>🏷️ Triage</span>
            {overview.pendingTaxonomyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-[var(--acc)] text-[10px] font-bold">
                {overview.pendingTaxonomyCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/config"
            className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] hover:border-[var(--acc)] text-xs font-medium transition-all"
          >
            ⚙️ Model
          </Link>
          <Link
            href="/admin/sikayetler"
            className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] hover:border-[var(--acc)] text-xs font-medium transition-all"
          >
            🚩 Şikayətlər
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ŞAGİRDLƏR VƏ CANLI TELEMETRİYA FƏALİYYƏTİ (İSTİFADƏÇİNİN ƏSAS GÖRÜNÜŞÜ) */}
      {/* ========================================================================= */}
      {tab === "students" && (
        <div className="flex flex-col gap-6">
          {/* Sadə 4 İnsani Kart */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
              <span className="text-xs text-[var(--t3)] uppercase font-semibold">Aktiv Şagirdlər</span>
              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--acc)]">
                  {students.participants.length}
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-0.5">Qohum və dəvətli sınaqçılar</div>
              </div>
              <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2">
                Son dövrdə aktiv olanlar
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
              <span className="text-xs text-[var(--t3)] uppercase font-semibold">Məsələ / Cəhd Sayı</span>
              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-sky-400">
                  {students.totalSolves}
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-0.5">İşlənən toplam suallar</div>
              </div>
              <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2">
                Bank + Kamera həlləri
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
              <span className="text-xs text-[var(--t3)] uppercase font-semibold">Açılan İpucular</span>
              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
                  {students.hintsOpenedCount}
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-0.5">Sokratik kömək istəkləri</div>
              </div>
              <div className="text-[11px] text-amber-400/80 border-t border-[var(--bor)]/50 pt-2">
                Cavab açılmadan düşünmə
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
              <span className="text-xs text-[var(--t3)] uppercase font-semibold">Düzgün Həll Dərəcəsi</span>
              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                  {students.overallSuccessRate}%
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-0.5">Uğurlu cavab nisbəti</div>
              </div>
              <div className="text-[11px] text-emerald-400/80 border-t border-[var(--bor)]/50 pt-2">
                Pedaqoji nəticə
              </div>
            </div>
          </div>

          {/* ƏSAS HİSSƏ: 1. Şagird Sınaqçıların Kartoçkaları / 2. Canlı PostHog Hadisə Feed-i */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sol tərəf (1/3): Qeydiyyatlı / Aktiv Şagirdlərin Siyahısı */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>👥 Şagird Sınaqçılar</span>
                  </h3>
                  <p className="text-[11px] text-[var(--t3)] mt-0.5">Cihaz və dəvət profilləri</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[var(--accsoft)] text-[var(--acc)] font-semibold">
                  {students.participants.length} nəfər
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {students.participants.length === 0 ? (
                  <div className="text-xs text-[var(--t3)] p-6 text-center border border-dashed border-[var(--bor)] rounded-xl">
                    Seçilmiş filtrdə şagird fəaliyyəti qeydə alınmayıb.
                  </div>
                ) : (
                  students.participants.map((student) => (
                    <div
                      key={student.id}
                      className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--bor)] hover:border-[var(--acc)] transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--accsoft)] text-[var(--acc)] flex items-center justify-center font-bold text-xs border border-[var(--acc)]/20">
                            {(student.displayName || student.studentRef || "ŞG").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-[var(--t1)] flex items-center gap-1.5">
                              <span>{student.displayName || student.studentRef}</span>
                              {student.isTesterInvite && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                                  Dəvətli
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--t3)] font-mono">
                              {student.grade}-ci sinif · Ton: {student.tone}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {student.successRate}%
                          </span>
                          <span className="block text-[10px] text-[var(--t3)]">uğur</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-[var(--sur)] p-2 rounded-lg border border-[var(--bor)]/50">
                        <div>
                          <span className="text-[var(--t3)] block">Həll</span>
                          <span className="font-mono font-bold text-[var(--t1)]">{student.totalSolves}</span>
                        </div>
                        <div>
                          <span className="text-[var(--t3)] block">İpucu</span>
                          <span className="font-mono font-bold text-amber-400">{student.hintsOpened}</span>
                        </div>
                        <div>
                          <span className="text-[var(--t3)] block">Son aktiv</span>
                          <span className="font-mono text-[var(--t2)] truncate block" title={student.lastActive || student.lastActiveAt}>
                            {formatEventTime(student.lastActive || student.lastActiveAt || "").split(" ")[1] || "—"}
                          </span>
                        </div>
                      </div>

                      {student.lastTopic && (
                        <div className="text-[10px] text-[var(--t2)] flex items-center gap-1 truncate">
                          <span className="text-[var(--t3)] shrink-0">Son mövzu:</span>
                          <span className="font-mono truncate text-[var(--acc)]">{student.lastTopic}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sağ tərəf (2/3): Real PostHog Telemetriya Hadisə Jurnalı */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>⚡ Canlı Telemetriya Fəaliyyət Jurnalı</span>
                  </h3>
                  <p className="text-[11px] text-[var(--t3)] mt-0.5">
                    Şagirdlərin app daxilində atdığı hər bir addım (Onboarding, Sual Bankı, İpucu, Cavablar)
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real Time
                </span>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[680px] overflow-y-auto pr-1">
                {students.recentFeed.length === 0 ? (
                  <div className="text-xs text-[var(--t3)] p-8 text-center border border-dashed border-[var(--bor)] rounded-xl">
                    Hələ heç bir fəaliyyət hadisəsi tapılmadı.
                  </div>
                ) : (
                  students.recentFeed.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--bor)] hover:border-[var(--acc)]/60 transition-all flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0 p-1 rounded-lg bg-[var(--sur)] border border-[var(--bor)]">
                          {ev.icon}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--t1)]">{ev.studentName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--sur)] border border-[var(--bor)] font-mono text-[var(--t3)]">
                              {ev.grade}-ci sinif
                            </span>
                          </div>
                          <span className="text-[var(--t1)] text-xs font-medium leading-relaxed">
                            {ev.actionText}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--t3)]">
                            Hadisə: {ev.eventName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono text-[var(--t3)] block">
                          {formatEventTime(ev.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PEDAQOJİ NƏBZ & SƏHV QIFI (SECOND TAB) */}
      {/* ========================================================================= */}
      {tab === "pedagogy" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SÜTUN 1: Pedaqoji Nəbz & Səhv Xəritəsi */}
          <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>🎯 Pedaqoji Nəbz & Səhv Xəritəsi</span>
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

          {/* SÜTUN 3: Səyahət Qıfı (Student Journey Funnel) */}
          <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>🔄 Səyahət Qıfı & Sürtünmə Nöqtələri</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VAHİD İQTİSADİYYATI & KEŞ & LATENSİYA (THIRD TAB) */}
      {/* ========================================================================= */}
      {tab === "economics" && (
        <div className="flex flex-col gap-6">
          {/* Əsas 6 Makro KPI Kartı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                  Yalnız kamera · Bank: {overview.bankMatchRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2 flex items-center justify-between">
                <span>Ümumi Keş:</span>
                <span className="font-mono text-[var(--t1)]">{overview.cacheHitRate.toFixed(1)}%</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--t3)] font-mono uppercase tracking-wider">Həll Müddəti (P90)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Dwell Time
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold font-mono text-[var(--t1)]">
                  {formatDuration(overview.p90LatencyMs)}
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-0.5">
                  Orta: {formatDuration(overview.avgLatencyMs)}
                </div>
              </div>
              <div className="text-[11px] text-[var(--t3)] border-t border-[var(--bor)]/50 pt-2">
                Məsələ üzərində çalışma vaxtı
              </div>
            </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SÜTUN 2: Vahid İqtisadiyyatı & Kaskad Keş */}
            <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>💰 Vahid İqtisadiyyatı & Kaskad Keş</span>
                  </h3>
                  <p className="text-xs text-[var(--t2)] mt-0.5">
                    Kaskad qatları (Qat 0-3 vs Qat 5) və həll başına xərc bölgüsü.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  Maya Hədəfi: $0.010
                </span>
              </div>

              {/* Kaskad Qatları Paylanması */}
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
                    {unitEconomics.tokenEfficiency.cachedTokens.toLocaleString()} token
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

            {/* SÜTUN 4: AI Keyfiyyəti, SymPy & Şikayətlər */}
            <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[var(--bor)] pb-3">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>🔬 AI Doğrulama & SymPy Statusu</span>
                  </h3>
                  <p className="text-xs text-[var(--t2)] mt-0.5">
                    SymPy üçlü yoxlama statusu və model istifadəsi.
                  </p>
                </div>
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
                    Yoxlanılmadı: {aiHealth.sympyVerification.methodNoneCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Səhv: {aiHealth.sympyVerification.verifiedFalseCount}
                  </span>
                </div>
              </div>

              {/* Aktiv Modellər */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">
                  Model İstifadəsi & Maya Bölgüsü
                </span>
                <div className="flex flex-col gap-2">
                  {aiHealth.modelsUsed.map((m) => (
                    <div
                      key={m.modelId}
                      className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--bor)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--t1)]">{m.modelId}</span>
                        <span className="text-[10px] text-[var(--t3)] font-mono">{m.callCount} çağırış</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-[var(--t2)]">${m.totalCostUsd.toFixed(3)}</span>
                        <span className="text-sky-400">~{(m.avgLatencyMs / 1000).toFixed(1)} san</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
