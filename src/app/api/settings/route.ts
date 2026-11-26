import { db } from "@/lib/db";
import { getSettings, publicSettings, computeOpenNow } from "@/lib/settings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  const branches = await db.branch.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, address: true, addressAm: true, phone: true, mapEmbedUrl: true, directionsUrl: true, isPrimary: true },
  });
  return NextResponse.json({ ...publicSettings(s), openNow: computeOpenNow(s).open, branches });
}
