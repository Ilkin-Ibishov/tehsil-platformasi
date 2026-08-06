import { NextRequest, NextResponse } from "next/server";

// POST /api/solve — S2 stub. Real Gemini inteqrasiyası S3-dədir (docs/PHASE-1.md).
// Bu route yalnız "kəsilmiş şəkil serverə çatır" qəbul şərtini təmin edir: şəkli qəbul edir,
// ölçüsünü loqlayır, sxemə bənzər (ADR-006) imtina cavabı qaytarır.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get("image");

    if (!(image instanceof Blob) || image.size === 0) {
      return NextResponse.json({ error: "image sahəsi yoxdur" }, { status: 400 });
    }

    console.log(`[/api/solve] stub: ${image.size} bayt şəkil qəbul edildi (S3 gözlənilir)`);

    return NextResponse.json(
      {
        schema_version: 1,
        status: "unreadable",
        reason: "S3-də hələ Gemini inteqrasiyası yoxdur — bu, S2 stub cavabıdır.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/solve] stub xətası:", err);
    return NextResponse.json({ error: "server xətası" }, { status: 500 });
  }
}
