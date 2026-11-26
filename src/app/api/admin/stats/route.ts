import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { asArray } from "@/components/admin/json";

export const dynamic = "force-dynamic";

interface ItemRow {
  name?: unknown;
  qty?: unknown;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(startOfDay);
    weekStart.setDate(weekStart.getDate() - 6);

    const [weekOrders, recentOrders, recentReservations, pendingRes, unread, subs, loyalty, activeTables] =
      await Promise.all([
        db.order.findMany({
          where: { createdAt: { gte: weekStart } },
          select: { createdAt: true, status: true, type: true, total: true, items: true, statusLog: true },
        }),
        db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
        db.reservation.findMany({ orderBy: { date: "desc" }, take: 8 }),
        db.reservation.count({ where: { status: "PENDING" } }),
        db.contactMessage.count({ where: { read: false } }),
        db.newsletterSubscriber.count(),
        db.loyaltyMember.count(),
        db.order.findMany({
          where: { type: "DINEIN", status: { notIn: ["COMPLETED", "CANCELLED"] } },
          select: { tableLabel: true },
        }),
      ]);

    /* ── Today's orders + revenue ── */
    const todayOrders = weekOrders.filter(
      (o) => o.createdAt >= startOfDay && o.status !== "CANCELLED"
    );
    const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);

    /* ── 7-day series ── */
    const series: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const end = new Date(d);
      end.setDate(d.getDate() + 1);
      const dayOrders = weekOrders.filter(
        (o) => o.createdAt >= d && o.createdAt < end && o.status !== "CANCELLED"
      );
      series.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      });
    }

    /* ── Top dishes (aggregate snapshot items across orders) ── */
    const dishQty = new Map<string, number>();
    const hourBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    const prepSamples: number[] = [];

    for (const o of weekOrders) {
      if (o.status === "CANCELLED") continue;
      hourBuckets[o.createdAt.getHours()].count += 1;

      for (const line of asArray<ItemRow>(o.items)) {
        if (typeof line?.name !== "string") continue;
        const qty = typeof line.qty === "number" ? line.qty : 1;
        dishQty.set(line.name, (dishQty.get(line.name) ?? 0) + qty);
      }

      /* avg prep time: NEW -> READY gap from statusLog */
      const log = asArray<{ status?: unknown; at?: unknown }>(o.statusLog);
      const started = log.find((l) => l.status === "NEW" && typeof l.at === "string");
      const ready = log.find((l) => l.status === "READY" && typeof l.at === "string");
      if (started?.at && ready?.at && typeof started.at === "string" && typeof ready.at === "string") {
        const mins = (new Date(ready.at).getTime() - new Date(started.at).getTime()) / 60000;
        if (mins >= 0 && mins < 480) prepSamples.push(mins);
      }
    }

    const topDishes = [...dishQty.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    const avgPrepMinutes =
      prepSamples.length > 0
        ? Math.round(prepSamples.reduce((a, b) => a + b, 0) / prepSamples.length)
        : null;

    /* ── Occupied tables: distinct labels of live DINEIN orders ── */
    const occupiedTables = new Set(
      activeTables.map((t) => t.tableLabel).filter((l): l is string => Boolean(l))
    ).size;

    return NextResponse.json({
      ok: true,
      todayOrders: todayOrders.length,
      revenueToday,
      weekSeries: series,
      topDishes,
      peakHours: hourBuckets,
      avgPrepMinutes,
      pendingReservations: pendingRes,
      unreadMessages: unread,
      newsletterCount: subs,
      occupiedTables,
      loyaltyMembers: loyalty,
      recentOrders,
      recentReservations,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ ok: false, error: "Failed to load stats" }, { status: 500 });
  }
}
