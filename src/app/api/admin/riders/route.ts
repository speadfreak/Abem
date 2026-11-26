import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const riders = await db.rider.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ ok: true, riders });
  } catch (err) {
    console.error("[admin/riders GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to load riders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body: unknown = await req.json();
    const p = z
      .object({
        id: z.string().min(1),
        status: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
        active: z.boolean().optional(),
      })
      .safeParse(body);
    if (!p.success)
      return NextResponse.json({ ok: false, error: p.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });

    const rider = await db.rider.update({ where: { id: p.data.id }, data: { status: p.data.status, active: p.data.active } });
    await logActivity(user.email, "updated", "Rider", p.data.id, { name: rider.name, status: rider.status });
    return NextResponse.json({ ok: true, rider });
  } catch (err) {
    console.error("[admin/riders PATCH]", err);
    return NextResponse.json({ ok: false, error: "Failed to update rider" }, { status: 500 });
  }
}
