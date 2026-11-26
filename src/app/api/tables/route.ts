import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Public: active dining tables (used by the staff board + QR generation). */
export async function GET() {
  const tables = await db.diningTable.findMany({
    where: { active: true },
    orderBy: { label: "asc" },
    select: { id: true, label: true, seats: true, zone: true, qrToken: true },
  });
  return NextResponse.json({ tables });
}
