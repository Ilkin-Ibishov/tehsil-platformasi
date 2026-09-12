"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import type { TaxonomyTriageResponse } from "@/lib/admin/types";

export default function TaxonomyTriagePage() {
  const [data, setData] = useState<TaxonomyTriageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingCode, setActingCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchTaxonomy = async () => {
    try {
      const res = await fetch("/api/admin/taxonomy");
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Taksonomiya yüklənə bilmədi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomy();
  }, []);

  const handleAction = async (
    action: "adopt" | "merge" | "deactivate",
    code: string,
    titleAz?: string,
    target?: string
  ) => {
    try {
      setActingCode(code);
      setStatusMessage(null);
      const res = await fetch("/api/admin/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code, titleAz, target }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatusMessage(json.message);
        // Siyahıdan çıxar və ya yenilə
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            total: prev.total - 1,
            items: prev.items.filter((i) => i.code !== code),
            suggestedAdoptions: prev.suggestedAdoptions.filter((a) => a.code !== code),
            suggestedMerges: prev.suggestedMerges.filter((m) => m.source !== code),
          };
        });
      } else {
        setStatusMessage(`Xəta: ${json.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Şəbəkə xətası baş verdi.");
    } finally {
      setActingCode(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Başlıq */}
      <div className="bg-[var(--sur)] p-6 rounded-2xl border border-[var(--bor)] flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <span>🏷️ Taksonomiya Triyaj İdarəetməsi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accsoft)] text-[var(--acc)] font-mono">
              public.v_taxonomy_review
            </span>
          </h2>
          <p className="text-sm text-[var(--t2)] mt-1">
            Vision LLM tərəfindən şagird axınında qeydə alınan yeni mövzuların və səhv kodlarının təsdiqi və ya birləşdirilməsi.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchTaxonomy();
          }}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] hover:border-[var(--acc)] text-xs font-medium transition-all"
        >
          {loading ? "Yenilənir..." : "🔄 Yenilə"}
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          {statusMessage}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--t3)]">Məlumatlar yüklənir...</div>
      ) : !data || data.items.length === 0 ? (
        <div className="p-12 text-center bg-[var(--sur)] rounded-2xl border border-[var(--bor)] text-sm text-[var(--t2)]">
          🎉 Təsdiq gözləyən heç bir yeni taksonomiya kodu yoxdur. Bütün mövzular rəsmi DİM reyestrindədir.
        </div>
      ) : (
        <>
          {/* 1. Təklif Olunan Qəbul Planı (Adoptions) */}
          {data.suggestedAdoptions.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">✨ Qəbul Üçün Təklif Edilən Mövzular ({data.suggestedAdoptions.length})</h3>
                  <p className="text-xs text-[var(--t2)]">
                    DİM kurikulumu üzrə Azərbaycan dilində adı təyin edilmiş yeni dərslik mövzuları.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {data.suggestedAdoptions.map((item) => (
                  <div
                    key={item.code}
                    className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--bor)] flex flex-col justify-between gap-3"
                  >
                    <div>
                      <span className="text-[11px] font-mono text-[var(--t3)] block">{item.code}</span>
                      <span className="text-sm font-semibold text-[var(--t1)] block mt-0.5">{item.titleAz}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--bor)]/50">
                      <button
                        onClick={() => handleAction("adopt", item.code, item.titleAz)}
                        disabled={actingCode === item.code}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                      >
                        {actingCode === item.code ? "İcra olunur..." : "✓ Təsdiqlə"}
                      </button>
                      <button
                        onClick={() => handleAction("deactivate", item.code)}
                        disabled={actingCode === item.code}
                        className="py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors"
                      >
                        Rədd et
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Təklif Olunan Birləşdirmələr (Synonym Merges) */}
          {data.suggestedMerges.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold">🔗 Sinonim Birləşdirmələri (Merges / Aliases)</h3>
                <p className="text-xs text-[var(--t2)]">
                  Mövcud standart mövzularla təkrarlanan və vahidləşdirilməsi tövsiyə olunan kodlar.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {data.suggestedMerges.map((merge) => (
                  <div
                    key={merge.source}
                    className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--bor)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-rose-400">{merge.source}</span>
                      <span className="text-xs text-[var(--t3)]">➔</span>
                      <span className="font-mono text-xs font-semibold text-emerald-400">{merge.target}</span>
                      <span className="text-xs text-[var(--t2)] ml-2">({merge.reason})</span>
                    </div>
                    <button
                      onClick={() => handleAction("merge", merge.source, undefined, merge.target)}
                      disabled={actingCode === merge.source}
                      className="px-4 py-1.5 rounded-lg bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-white text-xs font-medium transition-colors shrink-0"
                    >
                      Birləşdir və Yönləndir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Bütün Gözləyən Siyahı Cədvəli */}
          <div className="p-6 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col gap-4">
            <h3 className="text-base font-bold">Bütün Təsdiq Gözləyən Kodlar ({data.items.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--bor)] text-[var(--t3)] font-mono uppercase">
                    <th className="py-2.5 px-3">Kod</th>
                    <th className="py-2.5 px-3">Növ</th>
                    <th className="py-2.5 px-3">Təklif Olunan Ad</th>
                    <th className="py-2.5 px-3 text-right">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bor)]/50">
                  {data.items.map((item) => (
                    <tr key={item.code} className="hover:bg-[var(--bg)]/50">
                      <td className="py-3 px-3 font-mono font-medium text-[var(--t1)]">{item.code}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--bg)] border border-[var(--bor)] text-[11px] font-mono">
                          {item.nov}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--t2)]">{item.suggestedTitle || item.titleAz}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction("adopt", item.code, item.suggestedTitle)}
                            disabled={actingCode === item.code}
                            className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium"
                          >
                            Qəbul et
                          </button>
                          <button
                            onClick={() => handleAction("deactivate", item.code)}
                            disabled={actingCode === item.code}
                            className="px-3 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px]"
                          >
                            Deaktiv et
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
