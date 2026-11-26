import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings, updateSettingsSection, type SiteSettings } from "@/lib/settings";
import { logActivity } from "@/lib/log";

export const dynamic = "force-dynamic";

const SETTING_SECTIONS = [
  "site",
  "hero",
  "contact",
  "hours",
  "holidays",
  "socials",
  "features",
  "loyalty",
  "theme",
  "banner",
  "seo",
  "stats",
  "kitchen",
  "stations",
] as const;

const branchSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  address: z.string().min(4).max(200),
  addressAm: z.union([z.string().max(200), z.literal(""), z.null()]).optional(),
  phone: z.string().min(5).max(24),
  mapEmbedUrl: z.union([z.string().max(2000), z.literal("")]).optional(),
  directionsUrl: z.union([z.string().max(600), z.literal("")]).optional(),
  isPrimary: z.boolean().optional(),
  active: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2).max(24),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().min(0).max(100000),
  minOrder: z.coerce.number().min(0).max(100000).optional(),
  maxUses: z.union([z.coerce.number().int().min(1).max(100000), z.null()]).optional(),
  active: z.boolean().optional(),
  expiresAt: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(""), z.null()]).optional(),
});

const zoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  fee: z.coerce.number().min(0).max(10000),
  minOrder: z.coerce.number().min(0).max(100000).optional(),
  etaMin: z.coerce.number().int().min(5).max(240).optional(),
  etaMax: z.coerce.number().int().min(5).max(240).optional(),
  active: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});

/** GET is available to every admin role (tables page reads the table list). */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const [settings, branches, coupons, zones, tables] = await Promise.all([
      getSettings(),
      db.branch.findMany({ orderBy: { order: "asc" } }),
      db.coupon.findMany({ orderBy: { code: "asc" } }),
      db.deliveryZone.findMany({ orderBy: { order: "asc" } }),
      db.diningTable.findMany({ orderBy: [{ zone: "asc" }, { label: "asc" }] }),
    ]);
    return NextResponse.json({ ok: true, settings, branches, coupons, zones, tables });
  } catch (err) {
    console.error("[admin/settings GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to load settings" }, { status: 500 });
  }
}

/** Writes are OWNER/MANAGER only (defense in depth on top of middleware). */
export async function PUT(req: Request) {
  const user = await requireAdmin(["OWNER", "MANAGER"]);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body: unknown = await req.json();

    /* A) Settings section write */
    const sectionParse = z
      .object({ section: z.enum(SETTING_SECTIONS), value: z.unknown() })
      .safeParse(body);
    if (sectionParse.success) {
      await updateSettingsSection(
        sectionParse.data.section as keyof SiteSettings,
        sectionParse.data.value
      );
      await logActivity(user.email, "settings", sectionParse.data.section);
      return NextResponse.json(await loadAll());
    }

    /* B) Operational entity writes */
    const opParse = z
      .object({
        kind: z.enum(["branch", "branch-delete", "coupon", "coupon-delete", "zone", "zone-delete"]),
        data: z.unknown().optional(),
        id: z.string().optional(),
      })
      .safeParse(body);
    if (!opParse.success) return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    const { kind } = opParse.data;

    if (kind === "branch" || kind === "coupon" || kind === "zone") {
      const data = opParse.data.data;

      if (kind === "branch") {
        const p = branchSchema.safeParse(data);
        if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
        const d = p.data;
        const payload = {
          name: d.name,
          address: d.address,
          addressAm: d.addressAm === undefined ? undefined : d.addressAm === "" ? null : d.addressAm,
          phone: d.phone,
          mapEmbedUrl: d.mapEmbedUrl ?? "",
          directionsUrl: d.directionsUrl ?? "",
          isPrimary: d.isPrimary ?? false,
          active: d.active ?? true,
          order: d.order ?? 0,
        };
        const row = d.id
          ? await db.branch.update({ where: { id: d.id }, data: payload })
          : await db.branch.create({ data: payload });
        if (d.isPrimary) {
          await db.branch.updateMany({ where: { id: { not: row.id } }, data: { isPrimary: false } });
        }
        await logActivity(user.email, "saved", "Branch", row.id, { name: d.name });
      } else if (kind === "coupon") {
        const p = couponSchema.safeParse(data);
        if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
        const d = p.data;
        const code = d.code.toUpperCase().replace(/\s+/g, "");
        const payload = {
          code,
          type: d.type,
          value: d.value,
          minOrder: d.minOrder ?? 0,
          maxUses: d.maxUses ?? null,
          active: d.active ?? true,
          expiresAt: d.expiresAt ? new Date(`${d.expiresAt}T23:59:59`) : null,
        };
        const row = d.id
          ? await db.coupon.update({ where: { id: d.id }, data: payload })
          : await db.coupon.create({ data: payload });
        await logActivity(user.email, "saved", "Coupon", row.id, { code: row.code });
      } else {
        const p = zoneSchema.safeParse(data);
        if (!p.success) return NextResponse.json({ ok: false, error: p.error.issues[0]?.message }, { status: 422 });
        const d = p.data;
        const payload = {
          name: d.name,
          fee: d.fee,
          minOrder: d.minOrder ?? 0,
          etaMin: d.etaMin ?? 30,
          etaMax: d.etaMax ?? 60,
          active: d.active ?? true,
          order: d.order ?? 0,
        };
        const row = d.id
          ? await db.deliveryZone.update({ where: { id: d.id }, data: payload })
          : await db.deliveryZone.create({ data: payload });
        await logActivity(user.email, "saved", "DeliveryZone", row.id, { name: d.name });
      }
      return NextResponse.json(await loadAll());
    }

    /* Deletions */
    const id = opParse.data.id;
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    if (kind === "branch-delete") await db.branch.delete({ where: { id } });
    else if (kind === "coupon-delete") await db.coupon.delete({ where: { id } });
    else await db.deliveryZone.delete({ where: { id } });
    await logActivity(user.email, "deleted", kind.replace("-delete", ""), id);

    return NextResponse.json(await loadAll());
  } catch (err) {
    console.error("[admin/settings PUT]", err);
    return NextResponse.json({ ok: false, error: "Failed to save settings" }, { status: 500 });
  }
}

async function loadAll() {
  const [settings, branches, coupons, zones, tables] = await Promise.all([
    getSettings(),
    db.branch.findMany({ orderBy: { order: "asc" } }),
    db.coupon.findMany({ orderBy: { code: "asc" } }),
    db.deliveryZone.findMany({ orderBy: { order: "asc" } }),
    db.diningTable.findMany({ orderBy: [{ zone: "asc" }, { label: "asc" }] }),
  ]);
  return { ok: true as const, settings, branches, coupons, zones, tables };
}
