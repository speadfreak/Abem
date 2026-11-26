import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Rider proof-of-delivery: verify OTP, complete the order. */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let body: { otp?: string; riderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const order = await db.order.findUnique({ where: { code: code.toUpperCase() } });
  if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  if (order.type !== "DELIVERY" || !order.otp) return NextResponse.json({ ok: false, error: "No OTP required for this order" }, { status: 422 });
  if (order.status === "COMPLETED") return NextResponse.json({ ok: true, already: true });
  if ((body.otp ?? "").trim() !== order.otp) {
    return NextResponse.json({ ok: false, error: "Incorrect proof code" }, { status: 422 });
  }

  const log = [...((order.statusLog as { status: string; at: string; by?: string }[]) ?? []), { status: "COMPLETED", at: new Date().toISOString(), by: body.riderId ? "rider" : "rider" }];
  await db.order.update({
    where: { id: order.id },
    data: { status: "COMPLETED", paymentStatus: "PAID", statusLog: log as never },
  });
  if (order.riderId) await db.rider.update({ where: { id: order.riderId }, data: { status: "AVAILABLE" } }).catch(() => {});

  return NextResponse.json({ ok: true });
}
