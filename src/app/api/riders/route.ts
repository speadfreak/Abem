import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Public: active riders (used by the rider board picker). */
export async function GET() {
  const riders = await db.rider.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, status: true },
  });
  return NextResponse.json({ riders });
}
