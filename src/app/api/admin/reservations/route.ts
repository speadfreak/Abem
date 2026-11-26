import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "DECLINED", "SEATED", "CANCELLED"]).optional(),
  adminNote: z.union([z.string().max(1000), z.literal(""), z.null()]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  party: z.coerce.number().int().min(1).max(40).optional(),
  area: z.enum(["indoor", "garden", "vip"]).optional(),
});

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    const where: Prisma.ReservationWhereInput = {};
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);
      where.date = { gte: start, lte: end };
    }
    if (status && status !== "ALL") where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    const reservations = await db.reservation.findMany({
      where,
      orderBy: { date: "desc" },
      take: 200,
    });
    return NextResponse.json({ ok: true, reservations });
  } catch (err) {
    console.error("[admin/reservations GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to load reservations" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body: unknown = await req.json();
    const p = patchSchema.safeParse(body);
    if (!p.success)
      return NextResponse.json({ ok: false, error: p.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
    const { id, date, adminNote, ...rest } = p.data;

    const data: Prisma.ReservationUpdateInput = { ...rest };
    if (date) data.date = new Date(`${date}T12:00:00`);
    if (adminNote !== undefined) data.adminNote = adminNote === "" ? null : adminNote;

    const existing = await db.reservation.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ ok: false, error: "Reservation not found" }, { status: 404 });

    const updated = await db.reservation.update({ where: { id }, data });
    await logActivity(user.email, "updated", "Reservation", id, {
      status: updated.status,
      code: updated.code,
    });
    return NextResponse.json({ ok: true, reservation: updated });
  } catch (err) {
    console.error("[admin/reservations PATCH]", err);
    return NextResponse.json({ ok: false, error: "Failed to update reservation" }, { status: 500 });
  }
}
