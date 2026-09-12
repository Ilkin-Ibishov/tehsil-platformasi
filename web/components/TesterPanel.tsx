"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getDeviceId, getAttemptId } from "@/lib/telemetry";

const INVITE_CODE_KEY = "th_invite_code";
const TESTER_MODE_KEY = "TESTER_MODE";

function hasActiveInvite(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const inv = localStorage.getItem(INVITE_CODE_KEY);
    if (inv && inv.trim()) return true;
    const mode = localStorage.getItem(TESTER_MODE_KEY);
    if (mode === "true") return true;
    // URL parametrindən dəvət kodu: ?invite=... / ?code=...
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("invite") ?? params.get("code") ?? params.get("invite_code");
    if (urlCode && urlCode.trim()) return true;
    return false;
  } catch {
    return false;
  }
}

export function TesterPanel() {
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pathname = usePathname();

  // İlk yükləmə + reaktiv hadisə dinləyicisi
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cari vəziyyəti yoxla (setTimeout ilə SSR hydration uyuşmazlığını önlə)
    const check = () => {
      setTimeout(() => {
        setIsActive(hasActiveInvite());
      }, 0);
    };

    check();

    // Dəvət kodu URL-dən avtomatik yazılanda (InviteGate / url.ts dispatch edir)
    window.addEventListener("th_invite_updated", check);
    // localStorage başqa tabdan dəyişəndə
    window.addEventListener("storage", check);

    return () => {
      window.removeEventListener("th_invite_updated", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  if (!isActive) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const inviteCode = (() => {
        try { return localStorage.getItem(INVITE_CODE_KEY) || ""; } catch { return ""; }
      })();

      const storageDump: Record<string, string> = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) storageDump[k] = localStorage.getItem(k) ?? "";
        }
      } catch { /* ignore */ }

      const payload = {
        route: pathname,
        description,
        device_id: getDeviceId(),
        attempt_id: getAttemptId() || null,
        metadata: {
          invite_code: inviteCode,
          userAgent: window.navigator.userAgent,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          storage: storageDump,
        },
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFeedback("✅ Raporunuz uğurla göndərildi. Təşəkkürlər!");
        setDescription("");
        setTimeout(() => {
          setFeedback(null);
          setIsOpen(false);
        }, 2500);
      } else {
        setFeedback("❌ Göndərmə uğursuz oldu. Yenidən cəhd edin.");
      }
    } catch (err) {
      console.error(err);
      setFeedback("❌ Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating düymə — sağ alt künc */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg text-xs font-semibold transition-all active:scale-95"
        style={{
          background: "var(--sur)",
          border: "1.5px solid var(--bor)",
          color: "var(--t2)",
          backdropFilter: "blur(8px)",
        }}
        title="Problem, xəta və ya təklif bildir"
        aria-label="Problem bildir"
      >
        <span>🐞</span>
        <span>Problem bildir</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl flex flex-col overflow-hidden"
            style={{ background: "var(--sur)", border: "1px solid var(--bor)" }}
          >
            {/* Başlıq */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--bor)" }}
            >
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--t1)" }}>
                  Problem &amp; Təklif Bildirişi
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>
                  Cari səhifə, cihaz məlumatları avtomatik əlavə olunur
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors hover:opacity-70"
                style={{ color: "var(--t3)" }}
                aria-label="Bağla"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--t2)" }}>
                Aşkar etdiyiniz xətanı, sualdakı problemi və ya təklifinizi yazın. Hansı
                sual və ya addımda baş verdi?
              </p>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-28 p-3 rounded-xl resize-none text-sm outline-none transition-colors"
                style={{
                  background: "var(--bg)",
                  border: "1.5px solid var(--bor)",
                  color: "var(--t1)",
                  fontFamily: "inherit",
                }}
                placeholder="Məsələn: 2-ci addımda cavab yanlış göstərildi, çünki..."
                required
              />

              {feedback && (
                <div
                  className="px-3 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: feedback.startsWith("✅")
                      ? "color-mix(in srgb, var(--acc) 12%, transparent)"
                      : "color-mix(in srgb, #ef4444 12%, transparent)",
                    color: feedback.startsWith("✅") ? "var(--acc)" : "#ef4444",
                    border: `1px solid ${feedback.startsWith("✅") ? "color-mix(in srgb, var(--acc) 30%, transparent)" : "#ef444430"}`,
                  }}
                >
                  {feedback}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm transition-colors"
                  style={{
                    border: "1px solid var(--bor)",
                    color: "var(--t2)",
                    background: "transparent",
                  }}
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: "var(--acc)",
                    color: "#fff",
                  }}
                >
                  {isSubmitting ? "Göndərilir..." : "Göndər"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

