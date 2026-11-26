import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const zones = await db.deliveryZone.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, fee: true, minOrder: true, etaMin: true, etaMax: true },
  });
  return NextResponse.json({ zones });
}
