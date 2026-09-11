import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  throw new Error("Sentry Example API Route Error - Verification Test");
  return NextResponse.json({ message: "Sentry test" });
}
