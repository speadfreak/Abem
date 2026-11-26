import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import { slugify } from "@/lib/format";
import { Prisma } from "@prisma/client";
import { toStringArray } from "@/components/admin/json";

export const dynamic = "force-dynamic";

const optionalText = (max: number) =>
  z.union([z.string().max(max), z.literal(""), z.null()]).optional();

const teamSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  nameAm: optionalText(120),
  role: z.string().min(2).max(80),
  bio: optionalText(800),
  photo: optionalText(300),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

const testimonialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  role: optionalText(120),
  quote: z.string().min(5).max(600),
  rating: z.coerce.number().int().min(1).max(5),
  photo: optionalText(300),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(4).max(200),
  answer: z.string().min(4).max(1500),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

const eventSchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(120).optional(),
  title: z.string().min(2).max(120),
  titleAm: optionalText(120),
  description: z.string().min(4).max(1200),
  capacity: z.string().max(60),
  priceFrom: z.union([z.coerce.number().min(0).max(1000000), z.null()]).optional(),
  image: optionalText(300),
  features: z.array(z.string().max(120)).max(20).optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

const storySchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(140).optional(),
  title: z.string().min(2).max(140),
  titleAm: optionalText(140),
  excerpt: z.string().min(10).max(400),
  content: z.string().min(10).max(20000),
  cover: optionalText(300),
  category: z.string().max(40).optional(),
  tags: z.array(z.string().max(40)).max(12).optional(),
  author: z.string().max(80).optional(),
  readMinutes: z.coerce.number().int().min(1).max(90).optional(),
  published: z.boolean().optional(),
});

const openingSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(140),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "SEASONAL"]).optional(),
  location: z.string().max(120).optional(),
  description: z.string().min(4).max(2000),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

const gallerySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(120),
  titleAm: optionalText(120),
  category: z.string().max(40).optional(),
  type: z.enum(["IMAGE", "VIDEO"]).optional(),
  url: z.string().min(1).max(400),
  thumb: optionalText(400),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

const textOrNull = (v: string | null | undefined): string | null | undefined =>
  v === undefined ? undefined : v === "" || v === null ? null : v;

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const [team, testimonials, faqs, eventPackages, stories, openings, gallery] = await Promise.all([
      db.teamMember.findMany({ orderBy: { order: "asc" } }),
      db.testimonial.findMany({ orderBy: { order: "asc" } }),
      db.faq.findMany({ orderBy: { order: "asc" } }),
      db.eventPackage.findMany({ orderBy: { order: "asc" } }),
      db.story.findMany({ orderBy: { createdAt: "desc" } }),
      db.careerOpening.findMany({ orderBy: { order: "asc" } }),
      db.galleryItem.findMany({ orderBy: { order: "asc" } }),
    ]);
    return NextResponse.json({ ok: true, team, testimonials, faqs, eventPackages, stories, openings, gallery });
  } catch (err) {
    console.error("[admin/content GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to load content" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await requireAdmin(["OWNER", "MANAGER"]);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body: unknown = await req.json();
    const parsed = z
      .object({
        kind: z.enum(["team", "testimonial", "faq", "event", "story", "opening", "gallery"]),
        data: z.unknown(),
      })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });

    const { kind, data } = parsed.data;
    let savedId = "";
    let entity: string = kind;

    if (kind === "team") {
      const p = teamSchema.safeParse(data);
      if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
      const d = p.data;
      const payload = {
        name: d.name,
        nameAm: textOrNull(d.nameAm),
        role: d.role,
        bio: textOrNull(d.bio),
        photo: textOrNull(d.photo),
        order: d.order ?? 0,
        active: d.active ?? true,
      };
      const row = d.id
        ? await db.teamMember.update({ where: { id: d.id }, data: payload })
        : await db.teamMember.create({ data: payload });
      savedId = row.id;
    } else if (kind === "testimonial") {
      const p = testimonialSchema.safeParse(data);
      if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
      const d = p.data;
      const payload = {
        name: d.name,
        role: textOrNull(d.role),
        quote: d.quote,
        rating: d.rating,
        photo: textOrNull(d.photo),
        order: d.order ?? 0,
        active: d.active ?? true,
      };
      const row = d.id
        ? await db.testimonial.update({ where: { id: d.id }, data: payload })
        : await db.testimonial.create({ data: payload });
      savedId = row.id;
    } else if (kind === "faq") {
      const p = faqSchema.safeParse(data);
      if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
      const d = p.data;
      const payload = { question: d.question, answer: d.answer, order: d.order ?? 0, active: d.active ?? true };
      const row = d.id
        ? await db.faq.update({ where: { id: d.id }, data: payload })
        : await db.faq.create({ data: payload });
      savedId = row.id;
    } else if (kind === "event") {
      const p = eventSchema.safeParse(data);
      if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
      const d = p.data;
      const slug = d.slug?.trim() || slugify(d.title);
      const payload = {
        title: d.title,
        titleAm: textOrNull(d.titleAm),
        description: d.description,
        capacity: d.capacity,
        priceFrom: d.priceFrom ?? null,
        image: textOrNull(d.image),
        features: toStringArray(d.features) as never,
        order: d.order ?? 0,
        active: d.active ?? true,
      };
      const existing = d.id
        ? await db.eventPackage.findUnique({ where: { id: d.id } })
        : await db.eventPackage.findUnique({ where: { slug } });
      if (existing) {
        const sameSlug = await db.eventPackage.findUnique({ where: { slug } });
        const useSlug = sameSlug && sameSlug.id !== existing.id ? `${slug}-${Date.now().toString(36)}` : slug;
        const row = await db.eventPackage.update({
          where: { id: existing.id },
          data: { ...payload, slug: useSlug },
        });
        savedId = row.id;
      } else {
        const row = await db.eventPackage.create({ data: { ...payload, slug } });
        savedId = row.id;
      }
      entity = "EventPackage";
    } else if (kind === "story") {
      const p = storySchema.safeParse(data);
      if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
      const d = p.data;
      const slug = d.slug?.trim() || slugify(d.title);
      const existing = d.id
        ? await db.story.findUnique({ where: { id: d.id } })
        : await db.story.findUnique({ where: { slug } });
      const published = d.published ?? existing?.published ?? false;
      const payload = {
        title: d.title,
        titleAm: textOrNull(d.titleAm),
        excerpt: d.excerpt,
        content: d.content,
        cover: textOrNull(d.cover),
        category: d.category?.trim() || existing?.category || "culture",
        tags: toStringArray(d.tags) as never,
        author: d.author?.trim() || existing?.author || "Abem Editorial",
        readMinutes: d.readMinutes ?? existing?.readMinutes ?? 4,
        published,
        publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
      };
      let row;
      if (existing) {
        const sameSlug = await db.story.findUnique({ where: { slug } });
        const useSlug = sameSlug && sameSlug.id !== existing.id ? `${slug}-${Date.now().toString(36)}` : slug;
        row = await db.story.update({ where: { id: existing.id }, data: { ...payload, slug: useSlug } });
      } else {
        row = await db.story.create({ data: { ...payload, slug } });
      }
      savedId = row.id;
      entity = "Story";
    } else if (kind === "opening") {
      const p = openingSchema.safeParse(data);
      if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
      const d = p.data;
      const payload = {
        title: d.title,
        type: d.type ?? "FULL_TIME",
        location: d.location ?? "Addis Ababa",
        description: d.description,
        order: d.order ?? 0,
        active: d.active ?? true,
      };
      const row = d.id
        ? await db.careerOpening.update({ where: { id: d.id }, data: payload })
        : await db.careerOpening.create({ data: payload });
      savedId = row.id;
      entity = "CareerOpening";
    } else {
      const p = gallerySchema.safeParse(data);
      if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
      const d = p.data;
      const payload = {
        title: d.title,
        titleAm: textOrNull(d.titleAm),
        category: d.category ?? "general",
        type: d.type ?? "IMAGE",
        url: d.url,
        thumb: textOrNull(d.thumb),
        order: d.order ?? 0,
        active: d.active ?? true,
      };
      const row = d.id
        ? await db.galleryItem.update({ where: { id: d.id }, data: payload })
        : await db.galleryItem.create({ data: payload });
      savedId = row.id;
      entity = "GalleryItem";
    }

    await logActivity(user.email, "saved", entity, savedId);
    return NextResponse.json({ ok: true, id: savedId });
  } catch (err) {
    console.error("[admin/content POST]", err);
    return NextResponse.json({ ok: false, error: "Failed to save content" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await requireAdmin(["OWNER", "MANAGER"]);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind");
    const id = searchParams.get("id");
    if (!id || !kind) return NextResponse.json({ ok: false, error: "kind and id are required" }, { status: 400 });

    const map: Record<string, () => Promise<unknown>> = {
      team: () => db.teamMember.delete({ where: { id } }),
      testimonial: () => db.testimonial.delete({ where: { id } }),
      faq: () => db.faq.delete({ where: { id } }),
      event: () => db.eventPackage.delete({ where: { id } }),
      story: () => db.story.delete({ where: { id } }),
      opening: () => db.careerOpening.delete({ where: { id } }),
      gallery: () => db.galleryItem.delete({ where: { id } }),
    };
    const del = map[kind];
    if (!del) return NextResponse.json({ ok: false, error: "Unknown kind" }, { status: 400 });

    await del();
    await logActivity(user.email, "deleted", kind, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/content DELETE]", err);
    return NextResponse.json({ ok: false, error: "Failed to delete" }, { status: 500 });
  }
}
