import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { guardForm } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import { logActivity } from "@/lib/log";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = guardForm(req, "contact", 5);
  if (!g.ok) return g.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 422 }
    );
  }
  const d = parsed.data;
  if (d.company) return NextResponse.json({ ok: true }); // honeypot

  const msg = await db.contactMessage.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      subject: d.subject,
      message: d.message,
    },
  });
  notify({
    channel: "EMAIL",
    to: process.env.CONTACT_INBOX || "hello@abemrestaurant.et",
    subject: `[Website] ${d.subject}`,
    message: `${d.name} (${d.email}${d.phone ? ", " + d.phone : ""}): ${d.message}`,
    meta: { kind: "contact", id: msg.id },
  });
  logActivity("public", "created", "contact_message", msg.id, { subject: d.subject });

  return NextResponse.json({ ok: true });
}
