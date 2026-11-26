import { db } from "@/lib/db";
import { couponValidateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const parsed = couponValidateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 422 });

  const { code, subtotal } = parsed.data;
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt < new Date()) || (coupon.maxUses && coupon.usedCount >= coupon.maxUses)) {
    return NextResponse.json({ ok: false, error: "This code is not valid" }, { status: 404 });
  }
  if (subtotal < coupon.minOrder) {
    return NextResponse.json({ ok: false, error: `Minimum order for this code is ETB ${coupon.minOrder}` }, { status: 422 });
  }
  const discount = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal);
  return NextResponse.json({ ok: true, code: coupon.code, discount, type: coupon.type });
}
