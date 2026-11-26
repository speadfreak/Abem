import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Public order lookup for /track/[code].
   NOTE: this route was listed in the Abem Flow API contract but was missing
   from the repo; implemented here to match the documented contract exactly. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await db.order.findUnique({
    where: { code: decodeURIComponent(code).toUpperCase() },
  });
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  const items = ((order.items as { id: string; name: string; nameAm?: string; price: number; qty: number; image?: string }[]) ?? []).map(
    (i) => ({ id: i.id, name: i.name, nameAm: i.nameAm, price: i.price, qty: i.qty, image: i.image })
  );
  const statusLog = ((order.statusLog as { status: string; at: string }[]) ?? []).map((s) => ({
    status: s.status,
    at: s.at,
  }));

  return NextResponse.json({
    ok: true,
    order: {
      code: order.code,
      type: order.type,
      status: order.status,
      customerName: order.customerName,
      items,
      subtotal: order.subtotal,
      discount: order.discount,
      deliveryFee: order.deliveryFee,
      total: order.total,
      zoneName: order.zoneName ?? undefined,
      address: order.address ?? undefined,
      landmark: order.landmark ?? undefined,
      riderName: order.riderName ?? undefined,
      otp: order.type === "DELIVERY" ? order.otp ?? undefined : undefined,
      statusLog,
      createdAt: order.createdAt.toISOString(),
      pointsEarned: order.pointsEarned,
    },
  });
}
