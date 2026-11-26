import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* Slot capacity model: a realistic per-area seating plan per 30-minute window. */
const AREA_CAPACITY: Record<string, number> = { indoor: 14, garden: 10, vip: 4 };

function slotsFor(dateStr: string, s: Awaited<ReturnType<typeof getSettings>>): string[] {
  const d = new Date(`${dateStr}T12:00:00`);
  const dayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][d.getDay()];
  const h = s.hours[dayKey];
  if (!h || h.closed) return [];
  const parse = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  };
  let open = parse(h.open);
  let close = parse(h.close);
  if (close <= open) close += 24 * 60;
  const out: string[] = [];
  for (let m = open; m + 90 <= close; m += 30) {
    out.push(`${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const area = url.searchParams.get("area") || "indoor";
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: "date=YYYY-MM-DD required" }, { status: 400 });
  }
  const s = await getSettings();
  const capacity = AREA_CAPACITY[area] ?? 14;

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);
  const taken = await db.reservation.findMany({
    where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ["PENDING", "CONFIRMED"] }, area },
    select: { time: true, party: true },
  });
  const bySlot = new Map<string, number>();
  for (const r of taken) bySlot.set(r.time, (bySlot.get(r.time) ?? 0) + r.party);

  const slots = slotsFor(date, s).map((time) => ({
    time,
    remaining: Math.max(0, capacity - (bySlot.get(time) ?? 0)),
    available: capacity - (bySlot.get(time) ?? 0) > 0,
  }));

  return NextResponse.json({ ok: true, date, area, slots, closed: slots.length === 0 });
}
