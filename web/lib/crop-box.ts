import type { CropRectPct } from "./image";

// Şagird kamerası / səhifə şəkli — tənliyi kadra salmaq üçün dar çərçivə (CropView-in
// tarixi defoltu). Soak korpus kəsiyi artıq bir sualdır: çərçivə tam kadra oturur
// (docs/PHASE-2.md S2). Şagird qalereyası bu funksiyaya `soak: false` verir.

export const STUDENT_CROP_BOX: CropRectPct = { x: 0.1, y: 0.28, w: 0.8, h: 0.44 };
export const FULL_FRAME_CROP_BOX: CropRectPct = { x: 0, y: 0, w: 1, h: 1 };

export function initialCropBox(opts: { soak: boolean }): CropRectPct {
  return opts.soak ? FULL_FRAME_CROP_BOX : STUDENT_CROP_BOX;
}
