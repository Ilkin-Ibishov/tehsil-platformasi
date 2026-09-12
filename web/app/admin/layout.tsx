import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AdminHeaderNav from "./AdminHeaderNav";

export const metadata: Metadata = {
  title: "Admin İdarəetmə Paneli — Təhsil Platforması",
  description: "Pedaqoji nəbz, vahid iqtisadiyyatı, kaskad keş analitikası və taksonomiya idarəetmə mərkəzi",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell min-h-screen w-full flex bg-[var(--bg)] text-[var(--t1)] font-sans">
      {/* 1. Sol Naviqasiya Paneli (Sidebar) */}
      <aside className="w-64 border-r border-[var(--bor)] bg-[var(--sur)] flex flex-col shrink-0">
        {/* Logo & Başlıq */}
        <div className="p-5 border-b border-[var(--bor)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--acc)] flex items-center justify-center font-bold text-white shadow-md text-sm">
              TP
            </div>
            <div>
              <span className="font-bold text-base block tracking-tight leading-tight">Admin Portal</span>
              <span className="text-[11px] text-[var(--t3)] font-mono">v1.2 · DİM Analitika</span>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Sistem aktivdir" />
        </div>

        {/* Menyu Keçidləri */}
        <nav className="p-3 flex flex-col gap-1 flex-1">
          <div className="text-[11px] uppercase tracking-wider text-[var(--t3)] px-3 py-2 font-mono font-semibold">
            Analitika & Monitorinq
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[var(--bg)] text-sm font-medium transition-colors group"
          >
            <span className="text-base opacity-80 group-hover:opacity-100">📊</span>
            <span>İcmal Dashboard</span>
          </Link>

          <div className="text-[11px] uppercase tracking-wider text-[var(--t3)] px-3 py-2 mt-4 font-mono font-semibold">
            Əməliyyat Mərkəzi
          </div>
          <Link
            href="/admin/triage"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[var(--bg)] text-sm font-medium transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base opacity-80 group-hover:opacity-100">🏷️</span>
              <span>Taksonomiya Triage</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--accsoft)] text-[var(--acc)] font-mono font-semibold">
              Baxış
            </span>
          </Link>

          <Link
            href="/admin/config"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[var(--bg)] text-sm font-medium transition-colors group"
          >
            <span className="text-base opacity-80 group-hover:opacity-100">⚙️</span>
            <span>Konfiqurasiya</span>
          </Link>

          <Link
            href="/admin/sikayetler"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[var(--bg)] text-sm font-medium transition-colors group"
          >
            <span className="text-base opacity-80 group-hover:opacity-100">🚨</span>
            <span>Şikayətlər & Forensika</span>
          </Link>
        </nav>

        {/* Alt Bölmə: Şagird Tətbiqinə Keçid & Sistem Statusu */}
        <div className="p-4 border-t border-[var(--bor)] bg-[var(--bg)] flex flex-col gap-2">
          <div className="text-xs text-[var(--t3)] flex items-center justify-between">
            <span>Hədəf maya dəyəri:</span>
            <span className="font-mono text-emerald-400 font-medium">≤ $0.010</span>
          </div>
          <Link
            href="/"
            className="w-full text-center text-xs py-2 px-3 rounded-lg border border-[var(--bor)] hover:border-[var(--acc)] text-[var(--t2)] hover:text-[var(--t1)] transition-colors flex items-center justify-center gap-1.5"
          >
            <span>← Şagird Tətbiqinə Qayıt</span>
          </Link>
        </div>
      </aside>

      {/* 2. Əsas Məzmun Sahəsi */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Yuxarı Filtrlər və İdarəetmə Paneli */}
        <Suspense fallback={<div className="h-16 border-b border-[var(--bor)] bg-[var(--sur)]" />}>
          <AdminHeaderNav />
        </Suspense>

        {/* Səhifə Məzmunu */}
        <main className="p-6 flex-1 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
