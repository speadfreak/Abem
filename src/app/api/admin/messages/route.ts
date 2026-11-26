import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const [messages, subscribers, applications] = await Promise.all([
      db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } }),
      db.jobApplication.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    ]);
    return NextResponse.json({ ok: true, messages, subscribers, applications });
  } catch (err) {
    console.error("[admin/messages GET]", err);
    return NextResponse.json({ ok: false, error: "Failed to load messages" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body: unknown = await req.json();
    const p = z
      .object({ id: z.string().min(1), read: z.boolean() })
      .safeParse(body);
    if (!p.success) return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 422 });

    const message = await db.contactMessage.update({
      where: { id: p.data.id },
      data: { read: p.data.read },
    });
    await logActivity(user.email, p.data.read ? "read" : "unread", "ContactMessage", p.data.id, {
      subject: message.subject,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/messages PATCH]", err);
    return NextResponse.json({ ok: false, error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind");
    const id = searchParams.get("id");
    if (!id || (kind !== "message" && kind !== "subscriber")) {
      return NextResponse.json({ ok: false, error: "kind (message|subscriber) and id are required" }, { status: 400 });
    }
    if (kind === "message") {
      await db.contactMessage.delete({ where: { id } });
    } else {
      await db.newsletterSubscriber.delete({ where: { id } });
    }
    await logActivity(user.email, "deleted", kind === "message" ? "ContactMessage" : "NewsletterSubscriber", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/messages DELETE]", err);
    return NextResponse.json({ ok: false, error: "Failed to delete" }, { status: 500 });
  }
}
