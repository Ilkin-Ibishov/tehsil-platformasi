"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { TimeRange, EnvironmentKind } from "@/lib/admin/types";

export default function AdminHeaderNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRange = (searchParams.get("range") || "7d") as TimeRange;
  const currentKind = (searchParams.get("kind") || "all") as EnvironmentKind;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="h-16 border-b border-[var(--bor)] bg-[var(--sur)] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 backdrop-blur-md bg-opacity-95">
      {/* Sol tərəf: Səhifə xülasəsi */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight">Sistem İdarəetmə & Analitika</h1>
        <span className="text-xs px-2.5 py-0.5 rounded-md bg-[var(--accsoft)] text-[var(--acc)] font-mono border border-[var(--acc)]/20">
          Canlı Telemetriya
        </span>
      </div>

      {/* Sağ tərəf: Mühit və Vaxt Filtrləri */}
      <div className="flex items-center gap-4">
        {/* Mühit Seçici (Soak vs Real Şagirdlər) */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--bg)] border border-[var(--bor)] text-xs">
          <button
            onClick={() => updateParam("kind", "all")}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
              currentKind === "all"
                ? "bg-[var(--acc)] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            Bütün Məlumatlar
          </button>
          <button
            onClick={() => updateParam("kind", "student")}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
              currentKind === "student"
                ? "bg-[var(--acc)] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            Real Şagirdlər
          </button>
          <button
            onClick={() => updateParam("kind", "soak")}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
              currentKind === "soak"
                ? "bg-[var(--acc)] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            Soak Testləri
          </button>
        </div>

        {/* Vaxt Dövrü Seçici */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--bg)] border border-[var(--bor)] text-xs">
          <button
            onClick={() => updateParam("range", "24h")}
            className={`px-2.5 py-1.5 rounded-lg transition-all font-medium ${
              currentRange === "24h"
                ? "bg-[var(--acc)] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            24 Saat
          </button>
          <button
            onClick={() => updateParam("range", "7d")}
            className={`px-2.5 py-1.5 rounded-lg transition-all font-medium ${
              currentRange === "7d"
                ? "bg-[var(--acc)] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            7 Gün
          </button>
          <button
            onClick={() => updateParam("range", "30d")}
            className={`px-2.5 py-1.5 rounded-lg transition-all font-medium ${
              currentRange === "30d"
                ? "bg-[var(--acc)] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            30 Gün
          </button>
          <button
            onClick={() => updateParam("range", "all")}
            className={`px-2.5 py-1.5 rounded-lg transition-all font-medium ${
              currentRange === "all"
                ? "bg-[var(--acc)] text-white shadow-sm"
                : "text-[var(--t2)] hover:text-[var(--t1)]"
            }`}
          >
            Hamısı
          </button>
        </div>
      </div>
    </header>
  );
}
