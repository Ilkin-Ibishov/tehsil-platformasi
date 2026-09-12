"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLoginGate() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get("admin_key") || urlParams.get("secret");
    if (key && key.trim()) {
      setSecret(key.trim());
      executeLogin(key.trim(), true);
    }
  }, []);

  const executeLogin = async (candidateSecret: string, isAutoFromUrl = false) => {
    const clean = candidateSecret.trim();
    if (!clean) {
      setError("Zəhmət olmasa admin açarını daxil edin.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", secret: clean }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        // Uğurlu daxilolma -> admin_key parametrini URL-dən təmizləyərək səhifəni tam yenilə
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("admin_key");
          url.searchParams.delete("secret");
          window.location.href = url.toString();
        }
      } else {
        setError(data.error || "Giriş açarı yanlışdır. İcazə verilmədi.");
      }
    } catch {
      setError("Şəbəkə xətası baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(secret);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[var(--bg)] text-[var(--t1)] font-sans selection:bg-[var(--acc)] selection:text-white">
      <div className="w-full max-w-md bg-[var(--sur)] border border-[var(--bor)] rounded-3xl p-8 shadow-xl flex flex-col gap-6">
        {/* Logo & Başlıq */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--acc)] flex items-center justify-center text-white font-bold text-lg shadow-lg">
            TP
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Admin İdarəetmə Portalı</h1>
            <p className="text-xs text-[var(--t3)] mt-1">
              DİM Analitika, Pedaqoji Nəbz və Əməliyyat Mərkəzi
            </p>
          </div>
        </div>

        {/* Təhlükəsizlik Bildirişi */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2.5">
          <span className="text-base">🔒</span>
          <span>Bu bölmə yalnız sistem administratorları və səlahiyyətli mühəndislər üçündür.</span>
        </div>

        {/* Giriş Forması */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="adminSecret" className="text-xs font-medium text-[var(--t2)]">
              Admin Giriş Açarı
            </label>
            <input
              id="adminSecret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin açarını daxil edin..."
              autoFocus
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--bor)] focus:border-[var(--acc)] focus:outline-none text-sm text-[var(--t1)] placeholder:text-[var(--t3)] transition-colors font-mono"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2 animate-shake">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !secret.trim()}
            className="w-full py-3 px-4 rounded-xl bg-[var(--acc)] hover:bg-[var(--acc)]/90 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Yoxlanılır...</span>
              </>
            ) : (
              <span>Daxil ol →</span>
            )}
          </button>
        </form>

        {/* Geri Dönüş Keçidi */}
        <div className="border-t border-[var(--bor)] pt-4 text-center">
          <Link
            href="/"
            className="text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors inline-flex items-center gap-1"
          >
            <span>← Şagird Tətbiqinə Qayıt</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
