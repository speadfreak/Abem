import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await db.galleryItem.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, title: true, titleAm: true, category: true, type: true, url: true, thumb: true },
  });
  return NextResponse.json({ items });
}
