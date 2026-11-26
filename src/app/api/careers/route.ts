import { db } from "@/lib/db";
import { careerSchema } from "@/lib/validation";
import { guardForm } from "@/lib/rate-limit";
import { logActivity } from "@/lib/log";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Careers: public job application intake. */
export async function POST(req: Request) {
  const g = guardForm(req, "careers", 5);
  if (!g.ok) return g.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const parsed = careerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid application" },
      { status: 422 }
    );
  }
  const d = parsed.data;

  // If an openingId is supplied, verify it points at a live opening.
  let openingTitle = d.opening || "";
  if (d.openingId) {
    const opening = await db.careerOpening.findUnique({ where: { id: d.openingId } });
    if (!opening || !opening.active) {
      return NextResponse.json({ ok: false, error: "That opening is no longer listed" }, { status: 422 });
    }
    openingTitle = opening.title;
  }

  const app = await db.jobApplication.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone,
      cover: d.cover || null,
      openingId: d.openingId || null,
      opening: openingTitle || null,
    },
  });

  logActivity("public", "applied", "jobApplication", app.id, { opening: openingTitle });

  return NextResponse.json({ ok: true });
}
