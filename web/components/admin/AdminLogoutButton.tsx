"use client";

import { useState } from "react";

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      // Hard navigation to reset admin layout state and force gate mount
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/admin";
    } catch (err) {
      console.error("Çıxış xətası:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full text-center text-xs py-2 px-3 rounded-lg border border-[var(--bor)] hover:border-rose-500/40 text-[var(--t3)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
      title="Admin sessiyasını sonlandır"
    >
      <span>🚪</span>
      <span>{loading ? "Çıxılır..." : "Sessiyadan Çıx"}</span>
    </button>
  );
}
