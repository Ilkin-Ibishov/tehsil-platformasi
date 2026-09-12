"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { TimeRange, EnvironmentKind } from "@/lib/admin/types";

export default function AdminHeaderNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isDashboard = pathname === "/admin";
  const currentRange = (searchParams.get("range") || "7d") as TimeRange;
  const currentKind = (searchParams.get("kind") || "all") as EnvironmentKind;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);

    // Əgər istifadəçi soak seçirsə və range hələ 7d-dirsə, avtomatik all-a keçir (16-17 avqust testlərini göstərmək üçün)
    if (key === "kind" && value === "soak" && (!searchParams.get("range") || searchParams.get("range") === "7d")) {
      params.set("range", "all");
    }

    router.push(`/admin?${params.toString()}`);
  };

  const getSubpageTitle = () => {
    if (pathname.includes("/admin/triage")) {
      return {
        title: "Taksonomiya Triage",
        badge: "v_taxonomy_review",
        desc: "DİM proqramı və LLM taksonomiya uzlaşdırması",
      };
    }
    if (pathname.includes("/admin/config")) {
      return {
        title: "Sistem & Model Konfiqurasiyası",
        badge: "app_config",
        desc: "Aktiv LLM modeli və kaskad parametrləri",
      };
    }
    if (pathname.includes("/admin/sikayetler")) {
      return {
        title: "Şikayətlər & Forensika",
        badge: "bug_reports",
        desc: "Şagird şikayətləri və xəta araşdırması",
      };
    }
    return {
      title: "Sistem İdarəetmə",
      badge: "Admin",
      desc: "İdarəetmə paneli",
    };
  };

  const subpage = getSubpageTitle();

  return (
    <header className="min-h-16 border-b border-[var(--bor)] bg-[var(--sur)] px-4 sm:px-6 py-2.5 sm:py-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 sticky top-0 z-20 backdrop-blur-md bg-opacity-95">
      {/* Sol tərəf: Səhifə xülasəsi / Breadcrumbs */}
      <div className="flex items-center gap-3">
        {!isDashboard && (
          <Link
            href="/admin"
            className="text-xs font-semibold text-[var(--acc)] hover:underline flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg bg-[var(--accsoft)]"
            title="İcmal Dashboard-a qayıt"
          >
            <span>←</span>
            <span>Dashboard</span>
          </Link>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">
              {isDashboard ? "Sistem İdarəetmə & Analitika" : subpage.title}
            </h1>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-[var(--accsoft)] text-[var(--acc)] font-mono border border-[var(--acc)]/20 font-semibold">
              {isDashboard ? "Canlı Telemetriya" : subpage.badge}
            </span>
          </div>
          {!isDashboard && (
            <p className="text-[11px] text-[var(--t3)] hidden sm:block mt-0.5">
              {subpage.desc}
            </p>
          )}
        </div>
      </div>

      {/* Sağ tərəf: Yalnız Dashboard-da olan Mühit və Vaxt Filtrləri */}
      {isDashboard ? (
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {/* Mühit Seçici (Soak vs Real Şagirdlər) */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-[var(--bg)] border border-[var(--bor)] text-xs shrink-0">
            <button
              type="button"
              onClick={() => updateParam("kind", "all")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                currentKind === "all"
                  ? "bg-[var(--acc)] text-white shadow-sm font-semibold"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              Bütün Məlumatlar
            </button>
            <button
              type="button"
              onClick={() => updateParam("kind", "student")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                currentKind === "student"
                  ? "bg-[var(--acc)] text-white shadow-sm font-semibold"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              Real Şagirdlər
            </button>
            <button
              type="button"
              onClick={() => updateParam("kind", "soak")}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                currentKind === "soak"
                  ? "bg-[var(--acc)] text-white shadow-sm font-semibold"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              Soak Testləri
            </button>
          </div>

          {/* Vaxt Dövrü Seçici */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-[var(--bg)] border border-[var(--bor)] text-xs shrink-0">
            <button
              type="button"
              onClick={() => updateParam("range", "24h")}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                currentRange === "24h"
                  ? "bg-[var(--acc)] text-white shadow-sm font-semibold"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              24 Saat
            </button>
            <button
              type="button"
              onClick={() => updateParam("range", "7d")}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                currentRange === "7d"
                  ? "bg-[var(--acc)] text-white shadow-sm font-semibold"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              7 Gün
            </button>
            <button
              type="button"
              onClick={() => updateParam("range", "30d")}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                currentRange === "30d"
                  ? "bg-[var(--acc)] text-white shadow-sm font-semibold"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              30 Gün
            </button>
            <button
              type="button"
              onClick={() => updateParam("range", "all")}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                currentRange === "all"
                  ? "bg-[var(--acc)] text-white shadow-sm font-semibold"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              Hamısı
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-xs text-[var(--t2)] hover:text-[var(--t1)] px-3 py-1.5 rounded-lg border border-[var(--bor)] bg-[var(--bg)] transition-colors"
          >
            ← İcmal Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}
