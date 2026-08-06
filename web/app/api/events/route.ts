import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/events — telemetriya paketi. docs/PHASE-1.md müqaviləsi:
// event_id üzrə upsert (idempotent), cavab HƏMİŞƏ 200 — telemetriya xətası
// istifadəçiyə çatmamalıdır (docs/TELEMETRY.md → "Göndərmə qaydaları").

type IncomingEvent = {
  event_id: string;
  device_id: string;
  session_id?: string | null;
  attempt_id?: string | null;
  name: string;
  ts_client?: string | null;
  props?: Record<string, unknown>;
  app_version?: string | null;
  schema_version?: number;
};

function isValidEvent(e: unknown): e is IncomingEvent {
  if (!e || typeof e !== "object") return false;
  const ev = e as Record<string, unknown>;
  return typeof ev.event_id === "string" && typeof ev.device_id === "string" && typeof ev.name === "string";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: unknown[] = Array.isArray(body?.events) ? body.events : [];
    const valid = events.filter(isValidEvent);

    if (valid.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 }, { status: 200 });
    }

    const client = await pool.connect();
    try {
      await client.query("begin");
      for (const ev of valid) {
        await client.query(
          `insert into events
             (event_id, device_id, session_id, attempt_id, name, ts_client, props, app_version, schema_version)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           on conflict (event_id) do nothing`,
          [
            ev.event_id,
            ev.device_id,
            ev.session_id ?? null,
            ev.attempt_id ?? null,
            ev.name,
            ev.ts_client ?? null,
            ev.props ?? {},
            ev.app_version ?? null,
            ev.schema_version ?? 1,
          ]
        );
      }
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      // Server loguna yazılır, istifadəçiyə YOX — cavab yenə 200 olacaq (aşağıdakı catch-ə düşür).
      console.error("[/api/events] DB xətası:", err);
    } finally {
      client.release();
    }

    return NextResponse.json({ ok: true, inserted: valid.length }, { status: 200 });
  } catch (err) {
    console.error("[/api/events] gözlənilməz xəta:", err);
    // Yenə 200 — telemetriya heç vaxt UI-a xəta göstərməməlidir.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
