// Kəsmə + kiçiltmə boru xətti. ADR-001-dəki 9/10 dəqiqlik əl ilə kəsilmiş TAM ÖLÇÜLÜ
// şəkillərlə ölçülüb (bax docs/PHASE-1.md → S2). İki qayda buradan gəlir:
//   1. Kəsmə faiz-əsaslıdır (0..1, şəklin təbii ölçüsünə nisbətən) — CSS piksel/mənbə
//      piksel qarışıqlığı struktur olaraq mümkün deyil, miqyaslama unudula bilməz.
//   2. Əvvəl kəs (tam həllediciliklə), SONRA ≤maxPx-ə kiçilt. Sıra dəyişməz.

export type CropRectPct = { x: number; y: number; w: number; h: number }; // 0..1, şəklin təbii ölçüsünə nisbətən

export async function cropAndResize(
  source: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number,
  cropPct: CropRectPct,
  maxPx: number,
  quality = 0.85,
  // Defolt `false` — QƏSDƏN. ADR-001-in 9/10 dəqiqliyi RƏNGLİ pipeline ilə ölçülüb;
  // qri-şkala xərc/latensiya üçün faydalı ola bilər (daha kiçik JPEG), amma DİM
  // şəkillərində qırmızı mürəkkəblə düzəliş/vurğulanmış mətn kimi siqnalları itirə bilər.
  // `evals/golden-set.jsonl` üzərində A/B (bax `scripts/eval.py`) TƏSDİQLƏNMƏDƏN default
  // AÇILMASIN.
  grayscale = false
): Promise<{ blob: Blob; width: number; height: number }> {
  const sx = Math.round(cropPct.x * naturalWidth);
  const sy = Math.round(cropPct.y * naturalHeight);
  const sw = Math.round(cropPct.w * naturalWidth);
  const sh = Math.round(cropPct.h * naturalHeight);

  // 1) KƏS — tam mənbə həllediciliyi ilə, kiçiltmə YOX.
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = sw;
  cropCanvas.height = sh;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("2d context alınmadı");
  cropCtx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);

  // 2) SONRA kiçilt — yalnız uzun tərəf maxPx-i keçirsə.
  const longestSide = Math.max(sw, sh);
  const scale = longestSide > maxPx ? maxPx / longestSide : 1;
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));

  let finalCanvas = cropCanvas;
  if (scale < 1) {
    const resized = document.createElement("canvas");
    resized.width = outW;
    resized.height = outH;
    const rctx = resized.getContext("2d");
    if (!rctx) throw new Error("2d context alınmadı");
    // Brauzer defoltu "low"-dur — 3000px→1600px kimi bir addımlıq kiçiltmədə çap mətnində
    // alias/moiré yaradır (HANDOFF 24). Bu, birbaşa OCR dəqiqliyinə təsir edir.
    rctx.imageSmoothingQuality = "high";
    rctx.drawImage(cropCanvas, 0, 0, outW, outH);
    finalCanvas = resized;
  }

  if (grayscale) {
    const gctx = finalCanvas.getContext("2d");
    if (!gctx) throw new Error("2d context alınmadı");
    const { width: w, height: h } = finalCanvas;
    const imgData = gctx.getImageData(0, 0, w, h);
    const px = imgData.data;
    for (let i = 0; i < px.length; i += 4) {
      // ITU-R BT.601 luma çəkiləri — sadə (r+g+b)/3-dən qəbul olunmuş standartdır.
      const luma = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = luma;
    }
    gctx.putImageData(imgData, 0, 0);
  }

  const blob = await new Promise<Blob | null>((resolve) => finalCanvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("JPEG encode alınmadı");

  return { blob, width: finalCanvas.width, height: finalCanvas.height };
}
