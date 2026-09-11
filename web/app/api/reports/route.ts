import { NextRequest, NextResponse } from "next";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { route, description, device_id, attempt_id, metadata } = body;

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const query = `
      INSERT INTO public.bug_reports (device_id, attempt_id, route, description, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    const values = [
      device_id || null,
      attempt_id || null,
      route || null,
      description,
      metadata ? JSON.stringify(metadata) : null
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Failed to save report:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
