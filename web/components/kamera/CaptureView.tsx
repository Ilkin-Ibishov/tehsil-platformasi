"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/telemetry";

type Stage = "requesting" | "live" | "permission-denied" | "not-supported" | "gallery-only";

export type Captured = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  torchUsed: boolean;
  source: "camera" | "gallery";
};

export function CaptureView({
  onCaptured,
  onCancel,
  galleryOnly = false,
  onResetInvite,
}: {
  onCaptured: (c: Captured) => void;
  onCancel: (stage: string) => void;
  galleryOnly?: boolean;
  onResetInvite?: () => void;
}) {
  const t = useTranslations("kamera");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // "qalereya" — `messages/az.json`-da tərcümə açarı MÖVCUD İDİ, amma heç yerə bağlanmamışdı
  // (ölü i18n açarı). Kamera (`getUserMedia`) uğursuz olan hər hal üçün real fallback —
  // istifadəçi mövcud şəkli seçə bilir, `capture=environment` mobil brauzerlərdə birbaşa
  // kameranı da açır (native "foto çək / qalereyadan seç" seçici). `stage`-dən ASILI DEYİL —
  // "not-supported"/"permission-denied" hallarında da işləyir, çünki fərqli API-dir.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Defolt "requesting" — dəstək yoxlaması (`navigator.mediaDevices`) YALNIZ effektdə (client-only)
  // aparılır. lazy useState initializer-də aparılsaydı, Next.js-in server-render keçidində
  // `navigator` olmadığı üçün "not-supported" server HTML-ə bişib qalır və hidratasiyadan sonra
  // BİR DƏHA yoxlanmır — real brauzerdə kamera olsa belə əbədi "dəstəklənmir" göstərilirdi
  // (bu, real Chromium-da tunel üzərindən sınayanda tapılan həqiqi bug idi).
  const [stage, setStage] = useState<Stage>(galleryOnly ? "gallery-only" : "requesting");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const torchUsedRef = useRef(false);

  // <video> yalnız stage==="live"-da render olunur (aşağıda), amma stream stage "live"-a
  // keçmədən ƏVVƏL hazır olur (aşağıdakı effektdə) — o anda video hələ mount olmayıb,
  // videoRef.current null-dur. Callback ref sıra asılılığını aradan qaldırır: video
  // mount olanda (element artıq varsa) VƏ ya stream artıq hazırdırsa (callback sonra
  // çağırılsa), srcObject hər iki tərəfdən təyin oluna bilər.
  const setVideoEl = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) el.srcObject = streamRef.current;
  }, []);

  useEffect(() => {
    if (galleryOnly) return;

    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices) {
        if (!cancelled) setStage("not-supported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.();
        // @ts-expect-error — torch MediaTrackCapabilities-in standart tipində yoxdur, amma dəstəkləyən brauzerlər qaytarır
        setTorchSupported(Boolean(caps?.torch));
        trackEvent("capture.permission_result", { granted: true });
        setStage("live");
      } catch (err) {
        if (cancelled) return;
        const name = (err as DOMException).name;
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          trackEvent("capture.permission_result", { granted: false });
          trackEvent("capture.permission_denied", {});
          setStage("permission-denied");
        } else {
          // NotFoundError (kamera yoxdur) və s. — dəstəklənməyən mühit kimi qəbul et, app çökmür.
          setStage("not-supported");
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, [galleryOnly]);

  function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    track
      .applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] })
      .then(() => {
        setTorchOn(next);
        if (next) torchUsedRef.current = true;
      })
      .catch(() => {
        /* dəstəklənmirsə səssizcə heç nə etmə */
      });
  }

  function shoot() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      // Səssiz uğursuzluq (HANDOFF 29-da tapıldı: video mount/srcObject sıra asılılığı,
      // callback ref ilə düzəldilib) — telemetriyasız görünməz idi. `TELEMETRY.md`.
      trackEvent("capture.shutter_noop", { reason: "video_not_ready" });
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    streamRef.current?.getTracks().forEach((tr) => tr.stop());

    canvas.toBlob(
      (blob) => {
        trackEvent("capture.photo_taken", {
          px_w: canvas.width,
          px_h: canvas.height,
          bytes: blob?.size ?? null,
          torch_used: torchUsedRef.current,
          source: "camera",
        });
      },
      "image/jpeg",
      0.9
    );

    onCaptured({
      canvas,
      width: canvas.width,
      height: canvas.height,
      torchUsed: torchUsedRef.current,
      source: "camera",
    });
  }

  function cancel() {
    trackEvent("capture.cancelled", { stage });
    onCancel(stage);
  }

  // Fayldan (qalereya/faylı seç) götürülən şəkli EYNİ `Captured` formasına salır ki, aşağıdakı
  // kəsmə/həll axını kameradan gələn kadrla FƏRQLƏNDİRMƏSİN — yeganə fərq mənbədir.
  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // eyni faylı təkrar seçəndə də `onChange` işə düşsün
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      trackEvent("capture.photo_taken", {
        px_w: canvas.width,
        px_h: canvas.height,
        bytes: file.size,
        torch_used: false,
        source: "gallery",
      });
      onCaptured({ canvas, width: canvas.width, height: canvas.height, torchUsed: false, source: "gallery" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      trackEvent("capture.shutter_noop", { reason: "gallery_decode_failed" });
    };
    img.src = url;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", padding: "12px 20px 0" }}>
        <button
          type="button"
          onClick={cancel}
          aria-label={t("close")}
          style={{ width: 44, height: 44, marginLeft: -12, border: "none", background: "transparent", color: "var(--t2)", fontSize: 18, cursor: "pointer" }}
        >
          ✕
        </button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", color: "var(--t3)", textAlign: "center" }}>
          {t("label")}
        </span>
        {onResetInvite ? (
          <button
            type="button"
            onClick={onResetInvite}
            title="Dəvət kodunu dəyiş"
            style={{ width: 44, height: 44, marginRight: -12, border: "none", background: "transparent", color: "var(--t2)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            🔑
          </button>
        ) : (
          <span />
        )}
      </div>

      <div style={{ flex: 1, padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ position: "relative", width: "100%", flex: 1, minHeight: 310, borderRadius: "var(--rad)", background: "var(--sur)", border: "1px solid var(--bor)", overflow: "hidden" }}>
          {stage === "live" && (
            <video ref={setVideoEl} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}

          {stage !== "gallery-only" && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <span style={{ position: "absolute", top: 16, left: 16, width: 30, height: 30, borderTop: "3px solid var(--acc)", borderLeft: "3px solid var(--acc)", borderTopLeftRadius: "var(--radsm)" }} />
              <span style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderTop: "3px solid var(--acc)", borderRight: "3px solid var(--acc)", borderTopRightRadius: "var(--radsm)" }} />
              <span style={{ position: "absolute", bottom: 16, left: 16, width: 30, height: 30, borderBottom: "3px solid var(--acc)", borderLeft: "3px solid var(--acc)", borderBottomLeftRadius: "var(--radsm)" }} />
              <span style={{ position: "absolute", bottom: 16, right: 16, width: 30, height: 30, borderBottom: "3px solid var(--acc)", borderRight: "3px solid var(--acc)", borderBottomRightRadius: "var(--radsm)" }} />
            </div>
          )}

          {stage === "gallery-only" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: 20 }}>
              <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: 20 }}>{t("galleryOnlyTitle")}</span>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>{t("galleryOnlyBody")}</span>
            </div>
          )}

          {stage === "permission-denied" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: 20 }}>
              <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: 20 }}>{t("permissionDeniedTitle")}</span>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>{t("permissionDeniedBody")}</span>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ alignSelf: "flex-start", minHeight: "var(--tap)", padding: "0 22px", border: "none", borderRadius: "var(--rad)", background: "var(--acc)", color: "var(--accink)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
              >
                {t("permissionDeniedRetry")}
              </button>
            </div>
          )}

          {stage === "not-supported" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: 20 }}>
              <span style={{ fontFamily: "var(--hfont)", fontWeight: "var(--hweight)" as unknown as number, fontSize: 20 }}>{t("notSupportedTitle")}</span>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}>{t("notSupportedBody")}</span>
            </div>
          )}
        </div>

        {stage === "live" && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--t3)" }}>→</span>
            <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--t2)", maxWidth: "34ch" }}>{t("hint")}</span>
          </div>
        )}
      </div>

      {/* UX düzəlişi (Ilkin, 2026-08-15): `capture="environment"` mobil brauzerdə seçim
          dialoqunu ATLAYIB birbaşa kameranı açırdı — "qalereya" düyməsi faktiki kameraya
          gedirdi. Bu atribut YALNIZ "birbaşa kamera" istəyəndə lazımdır; qalereyanın da
          seçim kimi görünməsi üçün silinməlidir — brauzer bundan sonra native "çək/qalereya"
          seçicisini göstərir. Grid uşağı DEYİL — Playwright `data-testid` ilə `setInputFiles`. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        data-testid="capture-gallery-input"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16, padding: "18px 20px 26px" }}>
        {galleryOnly ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ justifySelf: "start", minHeight: 44, padding: 0, border: "none", background: "transparent", color: "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}
          >
            {t("gallery")}
          </button>
        )}
        {galleryOnly ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              minHeight: "var(--tap)",
              padding: "0 28px",
              border: "none",
              borderRadius: "var(--rad)",
              background: "var(--acc)",
              color: "var(--accink)",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              justifySelf: "center",
            }}
          >
            {t("galleryPick")}
          </button>
        ) : (
          <button
            type="button"
            onClick={shoot}
            disabled={stage !== "live"}
            aria-label={t("shutterLabel")}
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: "3px solid var(--bor)",
              background: "transparent",
              cursor: stage === "live" ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              justifySelf: "center",
              opacity: stage === "live" ? 1 : 0.4,
            }}
          >
            <span style={{ width: 58, height: 58, borderRadius: "50%", background: "var(--acc)" }} />
          </button>
        )}
        {!galleryOnly && torchSupported ? (
          <button
            type="button"
            onClick={toggleTorch}
            style={{ justifySelf: "end", minHeight: 44, padding: 0, border: "none", background: "transparent", color: torchOn ? "var(--warn)" : "var(--t2)", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}
          >
            {torchOn ? t("torchOn") : t("torchOff")}
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
