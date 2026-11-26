import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const logs = await db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ ok: true, logs });
  } catch (err) {
    console.error("[admin/activity GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to load activity" }, { status: 500 });
  }
}
