"use client";

import { useEffect, useRef, useState } from "react";
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

  // Drag state — başlanğıc mövqe: sağ alt künc (offset px)
  const [pos, setPos] = useState<{ right: number; bottom: number }>({ right: 20, bottom: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const posRef = useRef(pos);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, startRight: 20, startBottom: 20, moved: false });

  const pathname = usePathname();

  // İlk yükləmə + yadda saxlanmış mövqenin bərpası + reaktiv hadisə dinləyicisi
  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      setTimeout(() => {
        setIsActive(hasActiveInvite());
      }, 0);
    };

    check();

    // Əvvəlki sürüklənmiş mövqeni bərpa et
    try {
      const saved = localStorage.getItem("th_tester_panel_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.right === "number" && typeof parsed.bottom === "number") {
          const maxRight = Math.max(8, window.innerWidth - 140);
          const maxBottom = Math.max(8, window.innerHeight - 50);
          setTimeout(() => {
            setPos({
              right: Math.max(8, Math.min(maxRight, parsed.right)),
              bottom: Math.max(8, Math.min(maxBottom, parsed.bottom)),
            });
          }, 0);
        }
      }
    } catch {
      // ignore
    }

    window.addEventListener("th_invite_updated", check);
    window.addEventListener("storage", check);

    return () => {
      window.removeEventListener("th_invite_updated", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  // Global pointermove + pointerup — düymə xaricindən çıxdıqda da işləsin
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      d.moved = true;

      const maxRight = Math.max(8, window.innerWidth - 140);
      const maxBottom = Math.max(8, window.innerHeight - 50);
      const newRight = Math.max(8, Math.min(maxRight, d.startRight - dx));
      const newBottom = Math.max(8, Math.min(maxBottom, d.startBottom - dy));
      setPos({ right: newRight, bottom: newBottom });
    };

    const onUp = () => {
      if (dragRef.current.active && dragRef.current.moved) {
        try {
          localStorage.setItem("th_tester_panel_pos", JSON.stringify(posRef.current));
        } catch {
          // ignore
        }
      }
      dragRef.current.active = false;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startRight: pos.right,
      startBottom: pos.bottom,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(true);
  };

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
      {/* Sürüklənə bilən (draggable) üzən düymə */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleButtonClick}
        className="fixed z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg text-xs font-semibold select-none transition-shadow active:scale-95"
        style={{
          right: `${pos.right}px`,
          bottom: `${pos.bottom}px`,
          background: "var(--sur)",
          border: "1.5px solid var(--bor)",
          color: "var(--t2)",
          backdropFilter: "blur(8px)",
          touchAction: "none",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        title="Problem, xəta və ya təklif bildir (Uİ-da istənilən yerə sürükləyə bilərsiniz)"
        aria-label="Problem bildir"
      >
        <span className="pointer-events-none text-sm">🐞</span>
        <span className="pointer-events-none">Problem bildir</span>
        <span className="pointer-events-none opacity-40 text-[10px] ml-0.5 select-none">⠿</span>
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

