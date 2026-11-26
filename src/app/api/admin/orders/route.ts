import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { Prisma } from "@prisma/client";
import { asArray } from "@/components/admin/json";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  id: z.string().min(1),
  status: z
    .enum(["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"])
    .optional(),
  riderId: z.string().min(1).optional(),
  paymentStatus: z.enum(["UNPAID", "PAID"]).optional(),
});

export async function GET(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim();

    const where: Prisma.OrderWhereInput = {};
    if (status && status !== "ALL") where.status = status;
    if (type && type !== "ALL") where.type = type;
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    const orders = await db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    console.error("[admin/orders GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to load orders" }, { status: 500 });
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
    const { id, status, riderId, paymentStatus } = p.data;

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    const data: Prisma.OrderUpdateInput = {};
    let assignedRiderId: string | undefined;
    if (paymentStatus) data.paymentStatus = paymentStatus;

    /* Rider assignment */
    if (riderId && riderId !== existing.riderId) {
      const rider = await db.rider.findUnique({ where: { id: riderId } });
      if (!rider) return NextResponse.json({ ok: false, error: "Rider not found" }, { status: 422 });
      data.riderId = rider.id;
      data.riderName = rider.name;
      assignedRiderId = rider.id;
      await db.rider.update({ where: { id: rider.id }, data: { status: "BUSY" } }).catch(() => {});
    }

    /* Status transition: append to statusLog */
    if (status && status !== existing.status) {
      const log = asArray<{ status?: string; at?: string; by?: string }>(existing.statusLog);
      log.push({ status, at: new Date().toISOString(), by: user.email });
      data.status = status;
      data.statusLog = log as never;
    }

    const updated = await db.order.update({ where: { id }, data });

    /* Delivery completed -> free the rider */
    const effectiveRiderId = assignedRiderId ?? existing.riderId;
    if (status === "COMPLETED" && updated.type === "DELIVERY" && effectiveRiderId) {
      await db.rider
        .update({ where: { id: effectiveRiderId }, data: { status: "AVAILABLE" } })
        .catch(() => {});
    }

    await logActivity(user.email, status ? `status:${status}` : "updated", "Order", id, {
      code: updated.code,
      paymentStatus: updated.paymentStatus,
      riderName: updated.riderName ?? undefined,
    });
    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    console.error("[admin/orders PATCH]", err);
    return NextResponse.json({ ok: false, error: "Failed to update order" }, { status: 500 });
  }
}
