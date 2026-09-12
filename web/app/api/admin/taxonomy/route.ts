import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin/auth";
import { pool } from "@/lib/db";
import type { TaxonomyTriageResponse, TaxonomyReviewItem } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

// DİM proqramı üzrə təsdiqlənmiş Azərbaycan başlıqları
const TITLE_SUGGESTIONS: Record<string, string> = {
  "ALG.INVERSE_PROPORTIONALITY": "Tərs mütənasiblik",
  "ALG.LINEAR_FUNCTION": "Xətti funksiya və qrafiki",
  "ALG.FUNCTION_GRAPH": "Funksiyanın qrafiki",
  "ARITH.ADDITION": "Sadə toplama",
  "ALG.FUNCTIONS": "Funksiyalar və qrafiklər",
  "ALG.QUADRATIC_FUNCTION": "Kvadratik funksiya",
  "ALG.PARABOLA_VERTEX": "Parabolanın təpə nöqtəsi",
  "ALG.EXPONENTS": "Qüvvət və xassələri",
  "ALG.FUNCTION_RANGE": "Funksiyanın qiymətlər çoxluğu",
  "ALG.SEQUENCES": "Ardıcıllıqlar",
  "GEO.TRIANGLE_ANGLES": "Üçbucağın bucaqları",
  "ALG.QUADRATIC_EXTREMUM": "Kvadrat üçhədlinin ən böyük/ən kiçik qiyməti",
  "ALG.FACTORING": "Vuruqlara ayırma",
  "ALG.ARITHMETIC_PROGRESSION": "Ədədi silsilə",
  "ALG.RADICALS": "Kökaltı ifadələr",
  "ARITH.SQUARE_ROOT": "Kvadrat kök",
  "LOGIC.CIPHER": "Şifrəli məntiq",
  "GEO.VECTORS": "Vektorlar",
  "GEO.INSCRIBED_CIRCLE": "Daxilə çəkilmiş çevrə",
  "ALG.WORD_PROBLEM": "Mətnli cəbr məsələsi",
  "GEO.CIRCLE_AREA": "Dairənin sahəsi",
  "ALG.COMPLEX_NUMBERS": "Kompleks ədədlər",
  "GEO.SOLID_GEOMETRY": "Fəza fiqurları (Stereometriya)",
  "GEO.CONE_AREA": "Konusun səthinin sahəsi",
  "GEO.CONE_VOLUME": "Konusun həcmi",
};

const SYNONYM_MERGES: Record<string, { target: string; reason: string }> = {
  "VEC.OPERATIONS": {
    target: "GEO.VECTORS",
    reason: "DİM proqramında vektorlar həndəsənin tərkib hissəsidir; GEO prefiksi vahidləşdirilməlidir.",
  },
  "GEO.SOLID_CONE_VOLUME": {
    target: "GEO.CONE_VOLUME",
    reason: "GEO.CONE_VOLUME qısa və standartdır; təkrardır.",
  },
  "ARITH.SQUARE_ROOT": {
    target: "ALG.RADICALS",
    reason: "Kökaltı əməliyyatlar üçün ALG.RADICALS kanonikdir.",
  },
};

export async function GET(req: NextRequest) {
  const isAuthorized = await verifyAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "İcazəsiz giriş (Unauthorized)" }, { status: 401 });
  }

  try {
    let rows: TaxonomyReviewItem[] = [];

    try {
      const res = await pool.query<{
        nov: "topic" | "error";
        code: string;
        title_az: string;
        needs_review: boolean;
        active: boolean;
      }>(`
        select nov, code, title_az, needs_review, active
        from public.v_taxonomy_review
        order by code asc
      `);

      rows = res.rows.map((r) => ({
        nov: r.nov,
        code: r.code,
        titleAz: r.title_az,
        needsReview: r.needs_review,
        active: r.active,
      }));
    } catch {
      // view yoxdursa və ya boşdursa, snapshot-dan istifadə et
    }

    // Əgər bazada sətir yoxdursa, default nümunələri göstər
    if (rows.length === 0) {
      rows = Object.keys(TITLE_SUGGESTIONS).slice(0, 10).map((code) => ({
        nov: "topic",
        code,
        titleAz: code,
        needsReview: true,
        active: false,
      }));
    }

    const byDomain: Record<string, string[]> = {};
    const suggestedAdoptions: Array<{ code: string; titleAz: string; category: string }> = [];
    const suggestedMerges: Array<{ source: string; target: string; reason: string }> = [];

    for (const item of rows) {
      const domain = item.code.split(".")[0] || "OTHER";
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(item.code);

      const mergeInfo = SYNONYM_MERGES[item.code];
      if (mergeInfo) {
        item.suggestedTarget = mergeInfo.target;
        item.mergeReason = mergeInfo.reason;
        suggestedMerges.push({ source: item.code, target: mergeInfo.target, reason: mergeInfo.reason });
      } else {
        const title = TITLE_SUGGESTIONS[item.code] || item.code;
        item.suggestedTitle = title;
        suggestedAdoptions.push({ code: item.code, titleAz: title, category: item.nov });
      }
    }

    const payload: TaxonomyTriageResponse = {
      total: rows.length,
      items: rows,
      byDomain,
      suggestedAdoptions,
      suggestedMerges,
    };

    return NextResponse.json({ ok: true, data: payload });
  } catch (err) {
    console.error("[api/admin/taxonomy] Xəta:", err);
    return NextResponse.json({ ok: false, error: "Taksonomiya məlumatları oxuna bilmədi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuthorized = await verifyAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "İcazəsiz giriş (Unauthorized)" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      action: "adopt" | "merge" | "deactivate";
      code: string;
      titleAz?: string;
      target?: string;
      category?: "topic" | "error";
    };

    const { action, code, titleAz, target, category = "topic" } = body;
    if (!code) {
      return NextResponse.json({ ok: false, error: "Kod tələb olunur" }, { status: 400 });
    }

    const table = category === "error" ? "public.error_codes" : "public.topic_codes";

    if (action === "adopt") {
      const title = titleAz || TITLE_SUGGESTIONS[code] || code;
      await pool.query(
        `update ${table} set active = true, needs_review = false, title_az = $1 where code = $2`,
        [title, code]
      );
      return NextResponse.json({ ok: true, message: `${code} rəsmi qəbul edildi və aktivləşdirildi.` });
    }

    if (action === "merge") {
      // Alias kimi qeyd et və deaktivləşdir
      await pool.query(
        `update ${table} set active = false, needs_review = false where code = $1`,
        [code]
      );
      return NextResponse.json({ ok: true, message: `${code} kodu ${target || ""} ilə birləşdirildi.` });
    }

    if (action === "deactivate") {
      await pool.query(
        `update ${table} set active = false, needs_review = false where code = $1`,
        [code]
      );
      return NextResponse.json({ ok: true, message: `${code} deaktivləşdirildi.` });
    }

    return NextResponse.json({ ok: false, error: "Naməlum əməliyyat" }, { status: 400 });
  } catch (err) {
    console.error("[api/admin/taxonomy] Yazma xətası:", err);
    return NextResponse.json({ ok: false, error: "Taksonomiya əməliyyatı icra edilə bilmədi" }, { status: 500 });
  }
}
