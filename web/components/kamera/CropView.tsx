"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/telemetry";
import { cropAndResize, type CropRectPct } from "@/lib/image";

const DEFAULT_BOX: CropRectPct = { x: 0.1, y: 0.28, w: 0.8, h: 0.44 };
const MIN_SIZE = 0.12;
const MAX_PX = 1600;

type Handle = "move" | "nw" | "ne" | "sw" | "se";

export function CropView({
  canvas,
  onConfirmed,
  onCancel,
}: {
  canvas: HTMLCanvasElement;
  onConfirmed: (result: { blob: Blob; width: number; height: number; rawBlob: Blob | null }) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("crop");
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<CropRectPct>(DEFAULT_BOX);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const adjustCount = useRef(0);
  const drag = useRef<{ handle: Handle; startX: number; startY: number; startBox: CropRectPct } | null>(null);

  useEffect(() => {
    canvas.toBlob((blob) => {
      if (blob) setImgUrl(URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
    trackEvent("crop.screen_opened", { default_box_ratio: DEFAULT_BOX.w / DEFAULT_BOX.h });
    return () => {
      setImgUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [canvas]);

  function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v));
  }

  // Pointer Events YOX — Mouse+Touch ayrı-ayrı (HANDOFF: window-a bağlanan pointermove/pointerup
  // da telefonda çərçivəni düzəltmədi). Səbəb ehtimalı: brauzer toxunuşu səhifə sürüşdürməsi kimi
  // "ələ alanda" aktiv Pointer Event ardıcıllığına `pointercancel` göndərir (touch-action:none
  // olsa belə, bəzi mobil brauzerlərdə/in-app webview-lərdə Pointer Events dəstəyi qeyri-tam və ya
  // gecikmiş qərar verir) — sürüşdürmə İLK toxunuşdan sonra kəsilir. `react-easy-crop` və bənzər
  // açıq mənbəli kəsmə kitabxanaları məhz bu səbəbdən Pointer Events-ə güvənmir, ayrıca
  // `touchstart`/`touchmove`/`touchend` (və desktop üçün `mousedown`/`mousemove`/`mouseup`)
  // işlədir — daha köhnə, daha universal dəstəklənən API. Bunu təkrarlayırıq.
  function pointFromEvent(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ("touches" in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if ("changedTouches" in e && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }

  // ƏSAS SƏBƏB TAPILDI (canlı DOM sınağı ilə, koda baxmaqla YOX): 4 künc handle-i "move"
  // qutusunun İÇİNDƏ yerləşir. `stopPropagation` olmadan handle-in öz down-hadisəsi valideynə
  // bubble edir, qutunun "move" down-handler-i də işə düşür və `drag.current.handle`-i "se"/"nw"/...
  // -dən "move"-a ÜZƏRİNƏ YAZIR — nəticədə HƏR SÜRÜŞDÜRMƏ (harada başlasa da) yalnız x/y
  // dəyişdirir, w/h HEÇ VAXT dəyişmir. Bax HANDOFF: bu, blok 31/32-nin düzəltmədiyi əsl səbəbdir —
  // Pointer/Touch API YOX idi, sadə event bubbling idi.
  function onDragStart(handle: Handle, e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    const p = pointFromEvent(e.nativeEvent);
    drag.current = { handle, startX: p.x, startY: p.y, startBox: box };
  }

  useEffect(() => {
    function handleMove(e: MouseEvent | TouchEvent) {
      if (!drag.current || !imgWrapRef.current) return;
      e.preventDefault();
      const p = pointFromEvent(e);
      const rect = imgWrapRef.current.getBoundingClientRect();
      const dxPct = (p.x - drag.current.startX) / rect.width;
      const dyPct = (p.y - drag.current.startY) / rect.height;
      const s = drag.current.startBox;

      let next: CropRectPct = s;
      if (drag.current.handle === "move") {
        next = {
          ...s,
          x: clamp(s.x + dxPct, 0, 1 - s.w),
          y: clamp(s.y + dyPct, 0, 1 - s.h),
        };
      } else {
        let { x, y, w, h } = s;
        if (drag.current.handle === "se") {
          w = clamp(s.w + dxPct, MIN_SIZE, 1 - s.x);
          h = clamp(s.h + dyPct, MIN_SIZE, 1 - s.y);
        } else if (drag.current.handle === "nw") {
          const newX = clamp(s.x + dxPct, 0, s.x + s.w - MIN_SIZE);
          const newY = clamp(s.y + dyPct, 0, s.y + s.h - MIN_SIZE);
          w = s.x + s.w - newX;
          h = s.y + s.h - newY;
          x = newX;
          y = newY;
        } else if (drag.current.handle === "ne") {
          const newY = clamp(s.y + dyPct, 0, s.y + s.h - MIN_SIZE);
          w = clamp(s.w + dxPct, MIN_SIZE, 1 - s.x);
          h = s.y + s.h - newY;
          y = newY;
        } else if (drag.current.handle === "sw") {
          const newX = clamp(s.x + dxPct, 0, s.x + s.w - MIN_SIZE);
          w = s.x + s.w - newX;
          h = clamp(s.h + dyPct, MIN_SIZE, 1 - s.y);
          x = newX;
        }
        next = { x, y, w, h };
      }
      setBox(next);
    }

    function handleUp() {
      if (drag.current) {
        adjustCount.current += 1;
        trackEvent("crop.adjusted", { adjust_count: adjustCount.current });
        drag.current = null;
      }
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    window.addEventListener("touchcancel", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
      window.removeEventListener("touchcancel", handleUp);
    };
  }, []);

  async function confirm() {
    setBusy(true);
    try {
      const result = await cropAndResize(canvas, canvas.width, canvas.height, box, MAX_PX);
      trackEvent("crop.confirmed", {
        crop_ratio: Number((box.w / box.h).toFixed(3)),
        px_w: result.width,
        px_h: result.height,
      });
      // S1 (86eymwght) — orijinal kəsilməmiş kadr, ADR-024: kəsmə bug-larını YALNIZ orijinal
      // sübut edə bilər. Tam çərçivə (crop rekt {0,0,1,1}), eyni maxPx qaydası — çəkiliş
      // özündən böyük saxlamağa ehtiyac yoxdur, server storage limiti 2MB-dir.
      const raw = await cropAndResize(canvas, canvas.width, canvas.height, { x: 0, y: 0, w: 1, h: 1 }, MAX_PX).catch(
        (err) => {
          console.error("[CropView] orijinal kadr encode xətası (best-effort, davam edilir):", err);
          return null;
        }
      );
      onConfirmed({ ...result, rawBlob: raw?.blob ?? null });
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    trackEvent("crop.cancelled", {});
    onCancel();
  }

  // Toxunuş hədəfi 44×44 (Apple/Google minimumu) — görünən yaşıl nöqtə kiçikdir (22px),
  // amma barmaqla dəqiq həmin 22px-ə düşmək tələb olunmur, bütöv 44px sahə tutulur.
  const handleStyle: React.CSSProperties = {
    position: "absolute",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    touchAction: "none",
  };
  const handleDotStyle: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "var(--acc)",
    border: "3px solid var(--bg)",
    pointerEvents: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", padding: "12px 20px 0" }}>
        <button type="button" onClick={cancel} aria-label={t("retake")} style={{ width: 44, height: 44, marginLeft: -12, border: "none", background: "transparent", color: "var(--t2)", fontSize: 18, cursor: "pointer" }}>
          ✕
        </button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--t3)", textAlign: "center" }}>{t("label")}</span>
        <span />
      </div>

      <div style={{ flex: 1, padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          ref={imgWrapRef}
          style={{ position: "relative", width: "100%", borderRadius: "var(--rad)", overflow: "hidden", background: "var(--sur)", touchAction: "none" }}
        >
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt="" style={{ width: "100%", display: "block", userSelect: "none" }} draggable={false} />
          )}

          {/* Qutunun öz box-shadow-u (aşağıda) kənarları qaraldır — ayrıca overlay lazım deyil. */}
          <div
            onMouseDown={(e) => onDragStart("move", e)}
            onTouchStart={(e) => onDragStart("move", e)}
            style={{
              position: "absolute",
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.w * 100}%`,
              height: `${box.h * 100}%`,
              border: "2px solid var(--acc)",
              borderRadius: "var(--radsm)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              cursor: "move",
              touchAction: "none",
            }}
          >
            <div onMouseDown={(e) => onDragStart("nw", e)} onTouchStart={(e) => onDragStart("nw", e)} style={{ ...handleStyle, left: -22, top: -22, cursor: "nwse-resize" }}>
              <span style={handleDotStyle} />
            </div>
            <div onMouseDown={(e) => onDragStart("ne", e)} onTouchStart={(e) => onDragStart("ne", e)} style={{ ...handleStyle, right: -22, top: -22, cursor: "nesw-resize" }}>
              <span style={handleDotStyle} />
            </div>
            <div onMouseDown={(e) => onDragStart("sw", e)} onTouchStart={(e) => onDragStart("sw", e)} style={{ ...handleStyle, left: -22, bottom: -22, cursor: "nesw-resize" }}>
              <span style={handleDotStyle} />
            </div>
            <div onMouseDown={(e) => onDragStart("se", e)} onTouchStart={(e) => onDragStart("se", e)} style={{ ...handleStyle, right: -22, bottom: -22, cursor: "nwse-resize" }}>
              <span style={handleDotStyle} />
            </div>
          </div>
        </div>

        <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>{t("hint")}</span>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", display: "flex", justifyContent: "space-between", gap: 16, padding: "18px 20px 26px" }}>
        <button type="button" onClick={cancel} style={{ minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>
          {t("retake")}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={busy || !imgUrl}
          style={{ minHeight: "var(--tap)", padding: "0 28px", border: "none", borderRadius: "var(--rad)", background: "var(--acc)", color: "var(--accink)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
        >
          {t("confirm")}
        </button>
      </div>
    </div>
  );
}
