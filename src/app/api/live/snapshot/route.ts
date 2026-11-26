import { buildLiveSnapshot } from "@/lib/live";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* One-shot snapshot (fallback for boards when SSE is unavailable). */
export async function GET() {
  const snap = await buildLiveSnapshot();
  return NextResponse.json(snap);
}
