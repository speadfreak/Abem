import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { orderSchema } from "@/lib/validation";
import { guardForm } from "@/lib/rate-limit";
import { orderCode, otp4 } from "@/lib/format";
import { notify, orderMsg } from "@/lib/notifications";
import { logActivity } from "@/lib/log";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Create an order. Prices are ALWAYS recomputed server-side from the DB. */
export async function POST(req: Request) {
  const g = guardForm(req, "order", 10);
  if (!g.ok) return g.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order" }, { status: 422 });
  }
  const d = parsed.data;
  const s = await getSettings();

  if (d.type === "DELIVERY" && !s.features.delivery) {
    return NextResponse.json({ ok: false, error: "Delivery is currently paused" }, { status: 422 });
  }

  /* Resolve items server-side */
  const ids = d.items.map((i) => i.id);
  const menuItems = await db.menuItem.findMany({ where: { id: { in: ids }, available: true }, include: { category: true } });
  const itemMap = new Map(menuItems.map((m) => [m.id, m]));

  const resolved: {
    id: string; name: string; nameAm?: string; price: number; qty: number; notes?: string;
    image?: string; tags?: string[]; station: string;
  }[] = [];
  for (const line of d.items) {
    const m = itemMap.get(line.id);
    if (!m) return NextResponse.json({ ok: false, error: `Dish unavailable: ${line.id}` }, { status: 422 });
    resolved.push({
      id: m.id,
      name: m.name,
      nameAm: m.nameAm ?? undefined,
      price: m.price,
      qty: line.qty,
      notes: line.notes || undefined,
      image: m.image ?? undefined,
      tags: (m.tags as string[]) ?? [],
      station: m.category?.station ?? "main",
    });
  }

  const subtotal = resolved.reduce((sum, r) => sum + r.price * r.qty, 0);

  /* Table context */
  let tableLabel: string | undefined;
  if (d.tableToken) {
    const table = await db.diningTable.findUnique({ where: { qrToken: d.tableToken } });
    if (!table) return NextResponse.json({ ok: false, error: "Unknown table" }, { status: 422 });
    tableLabel = table.label;
  }

  /* Delivery zone */
  let zoneName: string | undefined;
  let deliveryFee = 0;
  if (d.type === "DELIVERY") {
    const zone = d.zoneId ? await db.deliveryZone.findFirst({ where: { id: d.zoneId, active: true } }) : null;
    if (!zone) return NextResponse.json({ ok: false, error: "Please choose a delivery zone" }, { status: 422 });
    if (subtotal < zone.minOrder) {
      return NextResponse.json({ ok: false, error: `Minimum order for ${zone.name} is ETB ${zone.minOrder}` }, { status: 422 });
    }
    zoneName = zone.name;
    deliveryFee = zone.fee;
  }

  /* Coupon */
  let discount = 0;
  let couponCode: string | undefined;
  if (d.couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: d.couponCode.toUpperCase() } });
    if (coupon && coupon.active && subtotal >= coupon.minOrder) {
      discount = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal);
      couponCode = coupon.code;
      await db.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  const total = subtotal - discount + deliveryFee;

  /* Loyalty */
  let pointsEarned = 0;
  let loyaltyPhone: string | null = null;
  if (s.features.rewards && d.loyaltyPhone) {
    loyaltyPhone = d.loyaltyPhone;
    const s2 = await getSettings();
    pointsEarned = Math.floor((total / 100) * s2.loyalty.pointsPer100);
  }

  /* Station routing: majority station wins */
  const stationCount = new Map<string, number>();
  for (const r of resolved) stationCount.set(r.station, (stationCount.get(r.station) ?? 0) + r.qty);
  const station = [...stationCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "main";

  /* Rider dispatch (simple nearest-free heuristic: first AVAILABLE rider) */
  let riderId: string | undefined;
  let riderName: string | undefined;
  if (d.type === "DELIVERY") {
    const rider = await db.rider.findFirst({ where: { status: "AVAILABLE", active: true } });
    if (rider) {
      riderId = rider.id;
      riderName = rider.name;
    }
  }

  const code = orderCode();
  const otp = d.type === "DELIVERY" ? otp4() : null;
  const now = new Date();
  const statusLog = [{ status: "NEW", at: now.toISOString(), by: "customer" }];

  const order = await db.order.create({
    data: {
      code,
      type: d.type,
      tableToken: d.tableToken || null,
      tableLabel: tableLabel ?? null,
      customerName: d.customerName,
      phone: d.phone,
      address: d.type === "DELIVERY" ? d.address || null : null,
      landmark: d.type === "DELIVERY" ? d.landmark || null : null,
      zoneId: d.type === "DELIVERY" ? d.zoneId || null : null,
      zoneName: zoneName ?? null,
      deliveryFee,
      subtotal,
      discount,
      total,
      couponCode: couponCode ?? null,
      paymentMethod: d.paymentMethod,
      paymentStatus: "UNPAID",
      status: "NEW",
      station,
      scheduledFor: d.scheduledFor ? new Date(d.scheduledFor) : null,
      notes: d.notes || null,
      otp,
      riderId: riderId ?? null,
      riderName: riderName ?? null,
      pointsEarned,
      loyaltyPhone,
      items: resolved as never,
      statusLog: statusLog as never,
    },
  });

  /* Accrue loyalty points */
  if (loyaltyPhone && pointsEarned > 0) {
    const s3 = await getSettings();
    const member = await db.loyaltyMember.findUnique({ where: { phone: loyaltyPhone } });
    if (member) {
      const newLifetime = member.lifetime + pointsEarned;
      let tier = member.tier;
      for (const t of s3.loyalty.tiers) if (newLifetime >= t.min) tier = t.name;
      await db.loyaltyMember.update({
        where: { id: member.id },
        data: { points: { increment: pointsEarned }, lifetime: { increment: pointsEarned }, tier },
      });
    } else {
      await db.loyaltyMember.create({
        data: { phone: loyaltyPhone, name: d.customerName, points: pointsEarned, lifetime: pointsEarned, referralCode: `ABM-${code.slice(4)}` },
      });
    }
  }

  /* Notifications */
  notify({
    channel: "SMS",
    to: d.phone,
    message: orderMsg(d.customerName, code, total) + (otp ? ` Delivery proof code: ${otp}. Show it only to your rider.` : ""),
    meta: { kind: "order", code },
  });
  if (d.type === "DELIVERY" && riderId) {
    await db.rider.update({ where: { id: riderId }, data: { status: "BUSY" } }).catch(() => {});
  }
  logActivity("public", "created", "order", order.id, { code, total, type: d.type });

  return NextResponse.json({
    ok: true,
    code,
    id: order.id,
    total,
    subtotal,
    deliveryFee,
    discount,
    otp,
    pointsEarned,
    riderName: riderName ?? null,
    eta: d.type === "DELIVERY" ? "35-60 min" : d.type === "TAKEAWAY" ? "15-25 min" : "direct to kitchen",
  });
}
