"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ShoppingBag,
  Banknote,
  CalendarClock,
  Inbox,
  Sparkles,
  Armchair,
  RefreshCw,
  Flame,
  Timer,
  ExternalLink,
} from "lucide-react";
import { PageHeader, AdminSkeleton, EmptyState } from "@/components/admin/page-header";
import { StatusChip } from "@/components/admin/status-chip";
import { apiFetch, errorMessage } from "@/components/admin/api";
import type { DashboardStats, SessionUser } from "@/components/admin/types";
import { formatETB, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const OrdersLineChart = dynamic(
  () => import("@/components/admin/dashboard-charts").then((m) => m.OrdersLineChart),
  { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> }
);
const RevenueBarChart = dynamic(
  () => import("@/components/admin/dashboard-charts").then((m) => m.RevenueBarChart),
  { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> }
);

const STAT_CARDS = [
  { key: "todayOrders", label: "Today's orders", icon: ShoppingBag },
  { key: "revenueToday", label: "Revenue today", icon: Banknote },
  { key: "pendingReservations", label: "Pending reservations", icon: CalendarClock },
  { key: "unreadMessages", label: "Unread messages", icon: Inbox },
  { key: "loyaltyMembers", label: "Loyalty members", icon: Sparkles },
  { key: "occupiedTables", label: "Occupied tables", icon: Armchair },
] as const;

type StatKey = (typeof STAT_CARDS)[number]["key"];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setError("");
    try {
      const data = await apiFetch<DashboardStats>("/api/admin/stats");
      setStats(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    apiFetch<{ ok: boolean; user: SessionUser }>("/api/auth/me")
      .then((d) => setMe(d.user))
      .catch(() => {});
    void load();
  }, []);

  const statValue = (key: StatKey): string => {
    if (!stats) return "—";
    if (key === "revenueToday") return formatETB(stats.revenueToday);
    return String(stats[key]);
  };

  const maxDishQty = useMemo(
    () => stats?.topDishes.reduce((m, d) => Math.max(m, d.qty), 0) ?? 0,
    [stats]
  );
  const maxPeak = useMemo(
    () => stats?.peakHours.reduce((m, p) => Math.max(m, p.count), 0) ?? 0,
    [stats]
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6">
      <PageHeader
        title={me ? `${greeting()}, ${me.name.split(" ")[0]}` : "Dashboard"}
        subtitle={new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <div role="alert" className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {STAT_CARDS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="card-elevated card-hover flex items-center gap-4 rounded-2xl p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="display-3 mt-0.5 text-cream">{statValue(key)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-elevated rounded-2xl p-4 md:p-6">
          <h2 className="display-3 text-cream">Orders · last 7 days</h2>
          <p className="mb-4 text-xs text-muted-foreground">Daily ticket volume (cancelled excluded)</p>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : stats ? (
            <OrdersLineChart data={stats.weekSeries} />
          ) : null}
        </section>
        <section className="card-elevated rounded-2xl p-4 md:p-6">
          <h2 className="display-3 text-cream">Revenue · last 7 days</h2>
          <p className="mb-4 text-xs text-muted-foreground">Gross ticket value in ETB</p>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : stats ? (
            <RevenueBarChart data={stats.weekSeries} />
          ) : null}
        </section>
      </div>

      {/* Top dishes + peak hours */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-elevated rounded-2xl p-4 md:p-6">
          <h2 className="display-3 text-cream">Top dishes</h2>
          <p className="mb-4 text-xs text-muted-foreground">Highest plate counts this week</p>
          {loading ? (
            <AdminSkeleton rows={6} />
          ) : stats && stats.topDishes.length > 0 ? (
            <ul className="space-y-2.5">
              {stats.topDishes.map((d, i) => (
                <li key={d.name} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right text-xs font-semibold text-gold">{i + 1}</span>
                  <span className="w-40 shrink-0 truncate text-sm text-cream sm:w-48">{d.name}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-elevated">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                      style={{ width: `${maxDishQty ? (d.qty / maxDishQty) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                    {d.qty}×
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Flame className="h-8 w-8" />} title="No dish counts yet" hint="Counts build up as orders flow in." />
          )}
        </section>

        <section className="card-elevated rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="display-3 text-cream">Peak hours</h2>
              <p className="text-xs text-muted-foreground">Order volume by hour of day</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs text-gold">
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              {stats?.avgPrepMinutes != null ? `avg prep ${stats.avgPrepMinutes} min` : "avg prep —"}
            </div>
          </div>
          {loading ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : stats ? (
            <div className="mt-6 flex h-24 items-end gap-[3px]" aria-label="Orders per hour histogram">
              {stats.peakHours.map((p) => (
                <div key={p.hour} className="group relative flex-1" title={`${String(p.hour).padStart(2, "0")}:00 — ${p.count} orders`}>
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-colors",
                      p.count === 0 ? "bg-elevated" : "bg-gold/70 group-hover:bg-gold"
                    )}
                    style={{ height: `${maxPeak ? Math.max(4, (p.count / maxPeak) * 96) : 4}px` }}
                  />
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>00h</span>
            <span>06h</span>
            <span>12h</span>
            <span>18h</span>
            <span>23h</span>
          </div>
        </section>
      </div>

      {/* Recent orders + reservations */}
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card-elevated overflow-hidden rounded-2xl lg:col-span-3">
          <div className="flex items-center justify-between p-4 pb-2 md:px-6">
            <h2 className="display-3 text-cream">Recent orders</h2>
            <a href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
              All orders <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          <div className="overflow-x-auto px-2 pb-3 md:px-3">
            {loading ? (
              <AdminSkeleton rows={5} className="p-2" />
            ) : stats && stats.recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/10">
                    <TableHead className="text-xs">Code</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Guest</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Placed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((o) => (
                    <TableRow key={o.id} className="border-gold/5">
                      <TableCell className="font-mono text-xs text-gold">{o.code}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.type}</TableCell>
                      <TableCell className="max-w-32 truncate text-xs">{o.customerName}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">{formatETB(o.total)}</TableCell>
                      <TableCell>
                        <StatusChip status={o.status} />
                      </TableCell>
                      <TableCell className="text-right text-[11px] text-muted-foreground">
                        {formatTime(o.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4">
                <EmptyState title="No orders yet" hint="New tickets will appear here the moment they land." />
              </div>
            )}
          </div>
        </section>

        <section className="card-elevated rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between p-4 pb-3 md:px-6">
            <h2 className="display-3 text-cream">Latest reservations</h2>
            <a href="/admin/reservations" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
              All <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          <div className="max-h-[320px] overflow-y-auto px-4 pb-4 md:px-6">
            {loading ? (
              <AdminSkeleton rows={4} />
            ) : stats && stats.recentReservations.length > 0 ? (
              <ul className="space-y-3">
                {stats.recentReservations.map((r) => (
                  <li key={r.id} className="rounded-xl border border-gold/10 bg-elevated/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-cream">{r.name}</p>
                      <StatusChip status={r.status} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {r.time} ·{" "}
                      {r.party} guests · {r.area} · {r.code}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No reservations yet" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
