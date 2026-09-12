"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

type ReportItem = {
  id: string;
  deviceId: string | null;
  attemptId: string | null;
  route: string;
  description: string;
  createdAt: string;
  hasCapture: boolean;
  inviteCode: string | null;
};

type ForensicDetail = {
  reportId: string | null;
  attemptId: string | null;
  description: string;
  createdAt: string;
  signedImageUrl: string | null;
  ocrFinal: string | null;
  stem: string | null;
  steps: {
    steps?: Array<{ title?: string; explanation?: string; hint?: string }>;
    final_answer?: { latex?: string };
  } | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [forensicDetail, setForensicDetail] = useState<ForensicDetail | null>(null);
  const [forensicLoading, setForensicLoading] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      const json = await res.json();
      if (json.ok) {
        setReports(json.data.reports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openForensics = async (reportId: string) => {
    try {
      setSelectedReportId(reportId);
      setForensicLoading(true);
      const res = await fetch(`/api/admin/reports?report_id=${encodeURIComponent(reportId)}`);
      const json = await res.json();
      if (json.ok) {
        setForensicDetail(json.data);
      }
    } catch (err) {
      console.error("Forensika məlumatı yüklənə bilmədi:", err);
    } finally {
      setForensicLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Başlıq */}
      <div className="bg-[var(--sur)] p-6 rounded-2xl border border-[var(--bor)] flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <span>🚨 Şikayətlər & Forensika Müfəttişi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accsoft)] text-[var(--acc)] font-mono">
              public.bug_reports
            </span>
          </h2>
          <p className="text-sm text-[var(--t2)] mt-1">
            Şagird və testerlərin &quot;İzahda xəta var?&quot; şikayətlərini kəsilmiş şəkil və həll addımları ilə araşdırın.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchReports();
          }}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] hover:border-[var(--acc)] text-xs font-medium transition-all"
        >
          {loading ? "Yenilənir..." : "🔄 Yenilə"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Tərəf: Şikayətlər Siyahısı (5 sütun) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider px-1">
            Daxil Olmuş Şikayətlər ({reports.length})
          </span>

          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--t3)] bg-[var(--sur)] rounded-2xl border border-[var(--bor)]">
              Yüklənir...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--t2)] bg-[var(--sur)] rounded-2xl border border-[var(--bor)]">
              Heç bir şikayət qeydə alınmayıb.
            </div>
          ) : (
            reports.map((r) => (
              <button
                key={r.id}
                onClick={() => openForensics(r.id)}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                  selectedReportId === r.id
                    ? "bg-[var(--accsoft)] border-[var(--acc)]"
                    : "bg-[var(--sur)] border-[var(--bor)] hover:border-[var(--acc)]/50"
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[var(--t3)]">{r.route}</span>
                  <span className="text-[var(--t3)] font-mono">{r.createdAt.slice(0, 16).replace("T", " ")}</span>
                </div>
                <p className="text-xs font-medium text-[var(--t1)] line-clamp-2 leading-relaxed">{r.description}</p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {r.inviteCode && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accsoft)] text-[var(--acc)] font-mono font-semibold border border-[var(--acc)]/20">
                      🎫 {r.inviteCode}
                    </span>
                  )}
                  {r.hasCapture && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                      Şəkil Mövcuddur
                    </span>
                  )}
                  {r.deviceId && (
                    <span className="text-[10px] text-[var(--t3)] font-mono">Cihaz: {r.deviceId}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Sağ Tərəf: Forensika Müfəttişi (7 sütun) */}
        <div className="lg:col-span-7 bg-[var(--sur)] border border-[var(--bor)] rounded-2xl p-6 flex flex-col gap-5 min-h-[500px]">
          <div className="border-b border-[var(--bor)] pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>🔬 Forensik Tədqiqat Ekranı</span>
            </h3>
            {selectedReportId && (
              <span className="text-xs font-mono text-[var(--t3)]">ID: {selectedReportId.slice(0, 8)}</span>
            )}
          </div>

          {!selectedReportId ? (
            <div className="flex-1 flex items-center justify-center text-center p-12 text-sm text-[var(--t3)]">
              Araşdırmaq üçün sol tərəfdəki şikayətlərdən birini seçin.
            </div>
          ) : forensicLoading ? (
            <div className="flex-1 flex items-center justify-center p-12 text-sm text-[var(--t3)]">
              Forensik məlumatlar (şəkil və həll addımları) yüklənir...
            </div>
          ) : forensicDetail ? (
            <div className="flex flex-col gap-6">
              {/* Şikayət Mətni + Dəvət Kodu */}
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--bor)]">
                <span className="text-xs text-[var(--t3)] block font-semibold uppercase tracking-wider mb-1">
                  Şagirdin / Testerin Rəyi
                </span>
                <p className="text-sm font-medium text-rose-300 leading-relaxed">{forensicDetail.description}</p>
                {selectedReportId && reports.find((r) => r.id === selectedReportId)?.inviteCode && (
                  <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--bor)" }}>
                    <span className="text-[10px] text-[var(--t3)] uppercase tracking-wider font-semibold">Dəvət Kodu:</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accsoft)] text-[var(--acc)] font-mono font-semibold border border-[var(--acc)]/20">
                      🎫 {reports.find((r) => r.id === selectedReportId)?.inviteCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Kəsilmiş Şəkil (Signed URL ilə) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">
                  Kəsilmiş Şagird Şəkli (Private Storage)
                </span>
                {forensicDetail.signedImageUrl ? (
                  <div className="p-3 bg-[var(--bg)] border border-[var(--bor)] rounded-xl flex items-center justify-center overflow-hidden max-h-72">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={forensicDetail.signedImageUrl}
                      alt="Kəsilmiş DİM məsələsi"
                      className="max-h-64 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[var(--t3)] bg-[var(--bg)] rounded-xl border border-dashed border-[var(--bor)]">
                    Bu şikayət üçün yaddaşda şəkil saxlanılmayıb və ya müddəti bitib.
                  </div>
                )}
              </div>

              {/* Transkripsiya və Məsələ Mətni */}
              {forensicDetail.stem && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">
                    Transkripsiya Edilmiş DİM Mətni (LaTeX)
                  </span>
                  <div className="p-3 bg-[var(--bg)] border border-[var(--bor)] rounded-xl text-xs font-mono text-[var(--t1)] whitespace-pre-wrap">
                    {forensicDetail.stem}
                  </div>
                </div>
              )}

              {/* Həll Addımları */}
              {forensicDetail.steps?.steps && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">
                    Qat 5 Həll Addımları
                  </span>
                  <div className="flex flex-col gap-2">
                    {forensicDetail.steps.steps.map((step, idx) => (
                      <div key={idx} className="p-3 bg-[var(--bg)] border border-[var(--bor)] rounded-xl text-xs">
                        <span className="font-bold text-[var(--acc)] block">
                          Addım {idx + 1}: {step.title || "Hesablama"}
                        </span>
                        <p className="text-[var(--t2)] mt-1">{step.explanation}</p>
                        {step.hint && (
                          <div className="mt-2 text-[11px] text-amber-300 font-mono bg-amber-400/10 p-2 rounded">
                            💡 İpucu: {step.hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
