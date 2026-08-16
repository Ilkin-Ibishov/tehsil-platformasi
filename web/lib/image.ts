// Kəsmə + kiçiltmə boru xətti. ADR-001-dəki 9/10 dəqiqlik əl ilə kəsilmiş TAM ÖLÇÜLÜ
// şəkillərlə ölçülüb (bax docs/PHASE-1.md → S2). İki qayda buradan gəlir:
//   1. Kəsmə faiz-əsaslıdır (0..1, şəklin təbii ölçüsünə nisbətən) — CSS piksel/mənbə
//      piksel qarışıqlığı struktur olaraq mümkün deyil, miqyaslama unudula bilməz.
//   2. Çıxış ≤maxPx — kəs + kiçilt bir addımda (tamölçülü aralıq canvas YOX). Əvvəl
//      tam kəs→sonra kiçilt telefonlarda 4000×3000 üçün ~4s divar yaradırdı; bir
//      drawImage / createImageBitmap eyni həllediciliyə ~1s ətrafı düşür.

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
  const sw = Math.max(1, Math.round(cropPct.w * naturalWidth));
  const sh = Math.max(1, Math.round(cropPct.h * naturalHeight));

  const longestSide = Math.max(sw, sh);
  const scale = longestSide > maxPx ? maxPx / longestSide : 1;
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = outW;
  finalCanvas.height = outH;
  const ctx = finalCanvas.getContext("2d");
  if (!ctx) throw new Error("2d context alınmadı");

  // createImageBitmap crop+resize bir addımda (tez-tez GPU); uğursuz olsa drawImage.
  let drew = false;
  if (typeof createImageBitmap === "function") {
    try {
      const opts: ImageBitmapOptions = { resizeQuality: "high" };
      if (scale < 1) {
        opts.resizeWidth = outW;
        opts.resizeHeight = outH;
      }
      const bitmap = await createImageBitmap(
        source as ImageBitmapSource,
        sx,
        sy,
        sw,
        sh,
        opts
      );
      ctx.drawImage(bitmap, 0, 0, outW, outH);
      bitmap.close();
      drew = true;
    } catch {
      // Safari / köhnə mühit — aşağıdakı drawImage fallback.
    }
  }
  if (!drew) {
    // Brauzer defoltu "low"-dur — 3000px→1600px bir addımda çap mətnində alias/moiré
    // riski (HANDOFF 24). High smoothing + birbaşa mənbədən çıxış ölçüsünə çəkmə.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
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

  const blob = await new Promise<Blob | null>((resolve) =>
    finalCanvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("JPEG encode alınmadı");

  return { blob, width: outW, height: outH };
}
