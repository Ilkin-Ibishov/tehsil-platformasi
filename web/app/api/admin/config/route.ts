import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin/auth";
import { pool } from "@/lib/db";
import { listKnownModelIds } from "@/lib/models";
import type { AppConfigItem } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

const CONFIG_METADATA: Record<string, { description: string; possibleValues?: string[] }> = {
  active_model: {
    description: "Əsas Vision LLM və Qat 5 Həll Modelinin seçimi (redeploy-suz).",
    possibleValues: listKnownModelIds(),
  },
  active_transcribe_model: {
    description: "Qat 1 OCR transkripsiya modeli. Boş olduqda active_model-ə düşür.",
    possibleValues: ["", ...listKnownModelIds()],
  },
  cascade_enabled: {
    description: "Server kaskad axını (Qat 1-5). 1 = Aktiv, 0 = Sönük (monolit axın).",
    possibleValues: ["1", "0"],
  },
  cascade_ui_enabled: {
    description: "Klient tərəfdə transkripsiya təsdiq ekranı. 1 = Aktiv, 0 = Sönük.",
    possibleValues: ["1", "0"],
  },
  prompt_strict_subject: {
    description: "Dəstəklənməyən fənlər üçün sərt imtina rejimi (INV-11). 1 = Aktiv, 0 = Sönük.",
    possibleValues: ["1", "0"],
  },
};

export async function GET(req: NextRequest) {
  const isAuthorized = await verifyAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "İcazəsiz giriş (Unauthorized)" }, { status: 401 });
  }

  try {
    let configs: AppConfigItem[] = [];

    try {
      const res = await pool.query<{ key: string; value: string; updated_at: string }>(
        `select key, value, updated_at from public.app_config order by key asc`
      );

      configs = res.rows.map((r) => {
        const meta = CONFIG_METADATA[r.key] || { description: "Runtime konfiqurasiya parametri." };
        return {
          key: r.key,
          value: r.value,
          updatedAt: r.updated_at,
          description: meta.description,
          possibleValues: meta.possibleValues,
        };
      });
    } catch {
      // app_config oxunmadısa default dəyərlər
    }

    // Əgər cədvəl boşdursa və ya bəzi açarlar çatışmırsa
    const existingKeys = new Set(configs.map((c) => c.key));
    for (const [key, meta] of Object.entries(CONFIG_METADATA)) {
      if (!existingKeys.has(key)) {
        configs.push({
          key,
          value: key === "active_model" ? "gemini-3.7-flash" : key === "cascade_enabled" ? "1" : "0",
          updatedAt: new Date().toISOString(),
          description: meta.description,
          possibleValues: meta.possibleValues,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        configs,
        availableModels: listKnownModelIds(),
      },
    });
  } catch (err) {
    console.error("[api/admin/config] Xəta:", err);
    return NextResponse.json({ ok: false, error: "Konfiqurasiya məlumatları oxuna bilmədi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuthorized = await verifyAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "İcazəsiz giriş (Unauthorized)" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { key: string; value: string };
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ ok: false, error: "Açar tələb olunur" }, { status: 400 });
    }

    await pool.query(
      `insert into public.app_config (key, value, updated_at)
       values ($1, $2, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [key, String(value ?? "")]
    );

    return NextResponse.json({ ok: true, message: `${key} parametri uğurla yeniləndi.` });
  } catch (err) {
    console.error("[api/admin/config] Yeniləmə xətası:", err);
    return NextResponse.json({ ok: false, error: "Konfiqurasiya yenilənə bilmədi" }, { status: 500 });
  }
}
