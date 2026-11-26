import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const [categories, featured] = await Promise.all([
    db.menuCategory.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: {
        items: {
          where: { available: true },
          orderBy: { order: "asc" },
          select: {
            id: true, slug: true, name: true, nameAm: true, description: true, descriptionAm: true,
            price: true, image: true, tags: true, spicyLevel: true, isVegan: true, isFasting: true,
            isChefPick: true, isFeatured: true, categoryId: true, available: true,
          },
        },
      },
    }),
    db.menuItem.findMany({
      where: { isFeatured: true, available: true },
      orderBy: { order: "asc" },
      take: 10,
      select: {
        id: true, slug: true, name: true, nameAm: true, description: true, descriptionAm: true,
        price: true, image: true, tags: true, spicyLevel: true, isVegan: true, isFasting: true,
        isChefPick: true, isFeatured: true, categoryId: true, available: true,
      },
    }),
  ]);

  return NextResponse.json({ categories, featured });
}
