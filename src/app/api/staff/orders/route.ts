import { db } from "@/lib/db";
import { logActivity } from "@/lib/log";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VALID = new Set(["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"]);

/* Ops: advance an order's status (staff / kitchen / rider boards).
   Body: { code: string, status: string, by?: string } */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const d = (body ?? {}) as { code?: unknown; status?: unknown; by?: unknown };
  if (typeof d.code !== "string" || !d.code) {
    return NextResponse.json({ ok: false, error: "code required" }, { status: 422 });
  }
  if (typeof d.status !== "string" || !VALID.has(d.status)) {
    return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 422 });
  }

  const order = await db.order.findUnique({ where: { code: d.code.toUpperCase() } });
  if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  if (order.status === d.status) return NextResponse.json({ ok: true, status: d.status, already: true });
  if (order.status === "COMPLETED" || order.status === "CANCELLED") {
    return NextResponse.json({ ok: false, error: `Order already ${order.status.toLowerCase()}` }, { status: 409 });
  }

  const by = typeof d.by === "string" && d.by ? d.by : "staff";
  const log = [
    ...((order.statusLog as { status: string; at: string; by?: string }[]) ?? []),
    { status: d.status, at: new Date().toISOString(), by },
  ];
  await db.order.update({
    where: { id: order.id },
    data: { status: d.status, statusLog: log as never },
  });

  // Rider freed / assigned bookkeeping on completion or cancellation.
  if ((d.status === "COMPLETED" || d.status === "CANCELLED") && order.riderId) {
    await db.rider.update({ where: { id: order.riderId }, data: { status: "AVAILABLE" } }).catch(() => {});
  }

  logActivity(by, "status:" + d.status, "order", order.id, { code: order.code });

  return NextResponse.json({ ok: true, status: d.status });
}
