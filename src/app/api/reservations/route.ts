import { db } from "@/lib/db";
import { reservationSchema } from "@/lib/validation";
import { guardForm } from "@/lib/rate-limit";
import { reservationCode } from "@/lib/format";
import { notify, reservationMsg } from "@/lib/notifications";
import { logActivity } from "@/lib/log";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = guardForm(req, "reservation", 6);
  if (!g.ok) return g.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 422 }
    );
  }
  const d = parsed.data;
  if (d.company) return NextResponse.json({ ok: true });

  const date = new Date(`${d.date}T${d.time}:00`);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid date/time" }, { status: 422 });
  }
  if (date.getTime() < Date.now() - 60_000) {
    return NextResponse.json({ ok: false, error: "Please choose a future date and time" }, { status: 422 });
  }

  const code = reservationCode();
  const reservation = await db.reservation.create({
    data: {
      code,
      name: d.name,
      email: d.email || null,
      phone: d.phone,
      date,
      time: d.time,
      party: d.party,
      area: d.area,
      occasion: d.occasion || null,
      notes: d.notes || null,
    },
  });

  notify({
    channel: "SMS",
    to: d.phone,
    message: reservationMsg(d.name, d.date, d.time, d.party, code),
    meta: { kind: "reservation", code },
  });
  if (d.email) {
    notify({ channel: "EMAIL", to: d.email, subject: `Reservation received — ${code}`, message: reservationMsg(d.name, d.date, d.time, d.party, code) });
  }
  logActivity("public", "created", "reservation", reservation.id, { code });

  return NextResponse.json({ ok: true, code, id: reservation.id });
}
