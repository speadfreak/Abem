import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { slugify } from "@/lib/format";
import { toStringArray } from "@/components/admin/json";

export const dynamic = "force-dynamic";

const optionalText = (max: number) =>
  z.union([z.string().max(max), z.literal(""), z.null()]).optional();

const categorySchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(80).optional(),
  name: z.string().min(2).max(80),
  nameAm: optionalText(120),
  description: optionalText(600),
  descriptionAm: optionalText(600),
  station: z.string().max(30).optional(),
  image: optionalText(300),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

const itemSchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(120).optional(),
  categoryId: z.string().min(1),
  name: z.string().min(2).max(120),
  nameAm: optionalText(120),
  description: optionalText(800),
  descriptionAm: optionalText(800),
  price: z.coerce.number().min(0).max(200000),
  image: optionalText(300),
  tags: z.array(z.string().max(40)).max(12).optional(),
  spicyLevel: z.coerce.number().int().min(0).max(3).optional(),
  isVegan: z.boolean().optional(),
  isFasting: z.boolean().optional(),
  isChefPick: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  available: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});

const textOrNull = (v: string | null | undefined): string | null | undefined =>
  v === undefined ? undefined : v === "" || v === null ? null : v;

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const categories = await db.menuCategory.findMany({
      orderBy: { order: "asc" },
      include: { items: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ ok: true, categories });
  } catch (err) {
    console.error("[admin/menu GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to load menu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await requireAdmin(["OWNER", "MANAGER"]);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body: unknown = await req.json();
    const parsed = z
      .object({ kind: z.enum(["category", "item"]), data: z.unknown() })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });

    if (parsed.data.kind === "category") {
      const c = categorySchema.safeParse(parsed.data.data);
      if (!c.success)
        return NextResponse.json({ ok: false, error: c.error.issues[0]?.message ?? "Invalid category" }, { status: 422 });
      const d = c.data;
      const slug = d.slug?.trim() || slugify(d.name);
      const payload = {
        name: d.name,
        nameAm: textOrNull(d.nameAm),
        description: textOrNull(d.description),
        descriptionAm: textOrNull(d.descriptionAm),
        station: d.station ?? "main",
        image: textOrNull(d.image),
        order: d.order ?? 0,
        active: d.active ?? true,
      };
      if (d.id) {
        const existing = await db.menuCategory.findUnique({ where: { id: d.id } });
        if (!existing) return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 });
        await db.menuCategory.update({ where: { id: d.id }, data: { ...payload, slug } });
        await logActivity(user.email, "updated", "MenuCategory", d.id, { name: d.name });
        return NextResponse.json({ ok: true, id: d.id });
      }
      const bySlug = await db.menuCategory.findUnique({ where: { slug } });
      if (bySlug) {
        await db.menuCategory.update({ where: { id: bySlug.id }, data: payload });
        await logActivity(user.email, "updated", "MenuCategory", bySlug.id, { name: d.name });
        return NextResponse.json({ ok: true, id: bySlug.id });
      }
      const created = await db.menuCategory.create({ data: { ...payload, slug } });
      await logActivity(user.email, "created", "MenuCategory", created.id, { name: d.name });
      return NextResponse.json({ ok: true, id: created.id });
    }

    /* kind === "item" */
    const i = itemSchema.safeParse(parsed.data.data);
    if (!i.success)
      return NextResponse.json({ ok: false, error: i.error.issues[0]?.message ?? "Invalid dish" }, { status: 422 });
    const d = i.data;

    const category = await db.menuCategory.findUnique({ where: { id: d.categoryId } });
    if (!category) return NextResponse.json({ ok: false, error: "Parent category not found" }, { status: 422 });

    let slug = d.slug?.trim() || slugify(d.name);
    const byId = d.id ? await db.menuItem.findUnique({ where: { id: d.id } }) : null;
    const bySlug = await db.menuItem.findUnique({ where: { slug } });
    if (byId && bySlug && bySlug.id !== byId.id) slug = `${slug}-${Date.now().toString(36)}`;

    const payload = {
      categoryId: d.categoryId,
      name: d.name,
      nameAm: textOrNull(d.nameAm),
      description: textOrNull(d.description),
      descriptionAm: textOrNull(d.descriptionAm),
      price: d.price,
      image: textOrNull(d.image),
      tags: toStringArray(d.tags) as never,
      spicyLevel: d.spicyLevel ?? 0,
      isVegan: d.isVegan ?? false,
      isFasting: d.isFasting ?? false,
      isChefPick: d.isChefPick ?? false,
      isFeatured: d.isFeatured ?? false,
      available: d.available ?? true,
      order: d.order ?? 0,
    };

    if (d.id && byId) {
      await db.menuItem.update({ where: { id: d.id }, data: { ...payload, slug } });
      await logActivity(user.email, "updated", "MenuItem", d.id, { name: d.name, price: d.price });
      return NextResponse.json({ ok: true, id: d.id });
    }
    if (!d.id && bySlug) {
      await db.menuItem.update({ where: { slug }, data: payload });
      await logActivity(user.email, "updated", "MenuItem", bySlug.id, { name: d.name, price: d.price });
      return NextResponse.json({ ok: true, id: bySlug.id });
    }
    const created = await db.menuItem.create({ data: { ...payload, slug } });
    await logActivity(user.email, "created", "MenuItem", created.id, { name: d.name, price: d.price });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("[admin/menu POST]", err);
    return NextResponse.json({ ok: false, error: "Failed to save menu" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await requireAdmin(["OWNER", "MANAGER"]);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind");
    const id = searchParams.get("id");
    if (!id || (kind !== "category" && kind !== "item")) {
      return NextResponse.json({ ok: false, error: "kind and id are required" }, { status: 400 });
    }

    if (kind === "category") {
      await db.menuCategory.update({ where: { id }, data: { active: false } });
      await logActivity(user.email, "archived", "MenuCategory", id);
    } else {
      await db.menuItem.deleteMany({ where: { id } }); // safe: orders snapshot items
      await logActivity(user.email, "deleted", "MenuItem", id);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/menu DELETE]", err);
    return NextResponse.json({ ok: false, error: "Failed to delete" }, { status: 500 });
  }
}
