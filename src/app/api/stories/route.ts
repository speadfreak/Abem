import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (slug) {
    const story = await db.story.findFirst({ where: { slug, published: true } });
    if (!story) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ story });
  }
  const stories = await db.story.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, cover: true, category: true, tags: true, readMinutes: true, publishedAt: true },
  });
  return NextResponse.json({ stories });
}
