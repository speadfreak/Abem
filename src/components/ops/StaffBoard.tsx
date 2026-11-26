"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Armchair, Bell, CheckCheck, CircleSlash, CookingPot, GlassWater, ReceiptText,
  Table2, Timer, Users, UtensilsCrossed,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpsShell, { statusChipCls, typeLabel } from "./OpsShell";
import { beep } from "./sound";
import { useLive, type LiveOrder, type LiveRequest } from "@/hooks/useLive";
import { formatETB, minutesSince, statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── Staff board: service requests, active orders, tables ── */

interface TableRow {
  id: string;
  label: string;
  seats: number;
  zone: string;
  qrToken: string;
}

const REQUEST_ICON = { WAITER: Bell, BILL: ReceiptText, WATER: GlassWater } as const;

function RequestCard({ r, busy, onResolve }: { r: LiveRequest; busy: boolean; onResolve: (r: LiveRequest) => void }) {
  const Icon = REQUEST_ICON[r.type as keyof typeof REQUEST_ICON] ?? Bell;
  const mins = minutesSince(r.createdAt);
  const urgent = mins >= 5;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn("ticket flex items-center gap-3 p-4", urgent && "border-ember/60")}
    >
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full border", urgent ? "border-ember/50 bg-ember/15 text-ember" : "border-gold/40 bg-gold/10 text-gold")}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-cream">
          Table {r.tableLabel}
          <span className="ml-2 text-xs font-semibold uppercase tracking-[0.12em] text-gold">{r.type === "WAITER" ? "Waiter" : r.type === "BILL" ? "Bill" : "Water"}</span>
        </p>
        <p className={cn("mt-0.5 flex items-center gap-1 text-xs tabular-nums", urgent ? "text-ember" : "text-muted-foreground")} role="status">
          <Timer className="h-3 w-3" aria-hidden="true" /> waiting {mins} min{urgent ? " — go now" : ""}
        </p>
      </div>
      <button
        onClick={() => onResolve(r)}
        disabled={busy}
        className="btn-gold btn-sm shrink-0 disabled:cursor-wait disabled:opacity-50"
        aria-label={`Resolve ${r.type} request for table ${r.tableLabel}`}
      >
        <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Resolve
      </button>
    </motion.li>
  );
}

function OrderTicket({ o, busy, onAdvance }: { o: LiveOrder; busy: boolean; onAdvance: (o: LiveOrder) => void }) {
  const nextBy: Record<string, { status: string; label: string }> = {
    NEW: { status: "PREPARING", label: "Fire it" },
    PREPARING: { status: "READY", label: "Mark ready" },
    READY: { status: "COMPLETED", label: "Hand off" },
  };
  const next = nextBy[o.status];
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ticket flex flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-sm font-bold tracking-wider text-gold">{o.code}</p>
        <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusChipCls(o.status))}>{statusLabel(o.status)}</span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <UtensilsCrossed className="h-3 w-3 text-gold" aria-hidden="true" />
        {o.tableLabel ? `Table ${o.tableLabel}` : typeLabel(o.type)} · {o.customerName} · {minutesSince(o.createdAt)} min
      </p>
      <ul className="mt-2.5 space-y-1" aria-label={`Items for ${o.code}`}>
        {o.items.map((it) => (
          <li key={`${o.id}-${it.id}`} className="flex justify-between gap-2 text-[13px] text-cream/85">
            <span><span className="font-semibold text-gold tabular-nums">{it.qty}×</span> {it.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{formatETB(it.price * it.qty)}</span>
          </li>
        ))}
      </ul>
      {o.notes ? <p className="mt-2 rounded-lg border border-gold/25 bg-gold/10 px-2.5 py-1.5 text-[12px] text-cream/85">Note: {o.notes}</p> : null}
      <div className="mt-3 flex items-center justify-between border-t border-gold/10 pt-3">
        <span className="text-sm font-bold tabular-nums text-cream">{formatETB(o.total)}</span>
        {next ? (
          <button onClick={() => onAdvance(o)} disabled={busy} className="btn-ember btn-sm disabled:cursor-wait disabled:opacity-50" aria-label={`${next.label} for ${o.code}`}>
            <CookingPot className="h-3.5 w-3.5" aria-hidden="true" /> {next.label}
          </button>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Closed</span>
        )}
      </div>
    </motion.li>
  );
}

export default function StaffBoard() {
  const { data, connected } = useLive();
  const [tab, setTab] = useState("requests");
  const [busy, setBusy] = useState(false);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [, setTick] = useState(0);
  const seenReq = useRef<Set<string> | null>(null);
  const seenOrd = useRef<Set<string> | null>(null);
  const resolved = useRef<Set<string>>(new Set());

  /* Tables list (public endpoint) */
  useEffect(() => {
    fetch("/api/tables")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { tables?: TableRow[] } | null) => setTables(j?.tables ?? []))
      .catch(() => {});
  }, []);

  /* Minute tick so elapsed timers refresh */
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  /* Sound cues on arrivals */
  useEffect(() => {
    if (!data) return;
    const openReqs = data.requests.filter((r) => !resolved.current.has(r.id));
    if (seenReq.current) {
      const fresh = openReqs.find((r) => !seenReq.current?.has(r.id));
      if (fresh) beep("request");
    }
    seenReq.current = new Set(openReqs.map((r) => r.id));

    if (seenOrd.current) {
      const fresh = data.orders.find((o) => !seenOrd.current?.has(o.id));
      if (fresh) beep("order");
    }
    seenOrd.current = new Set(data.orders.map((o) => o.id));
  }, [data]);

  const openRequests = useMemo(
    () => (data?.requests ?? []).filter((r) => !resolved.current.has(r.id)),
    [data]
  );

  const activeOrders = useMemo(
    () => (data?.orders ?? []).filter((o) => o.type !== "DELIVERY").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data]
  );

  const resolve = async (r: LiveRequest) => {
    setBusy(true);
    try {
      const res = await fetch("/api/service-requests/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (j.ok) {
        resolved.current.add(r.id);
        beep("done");
        toast.success(`Table ${r.tableLabel} — ${r.type === "WAITER" ? "waiter" : r.type === "BILL" ? "bill" : "water"} handled`);
      } else {
        toast.error(j.error ?? "Could not resolve");
      }
    } catch {
      toast.error("Network error — try again");
    } finally {
      setBusy(false);
    }
  };

  const advance = async (o: LiveOrder) => {
    const nextBy: Record<string, string> = { NEW: "PREPARING", PREPARING: "READY", READY: "COMPLETED" };
    const status = nextBy[o.status];
    if (!status) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: o.code, status, by: "staff" }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (j.ok) {
        beep("done");
        toast.success(`${o.code} → ${statusLabel(status)}`);
      } else {
        beep("error");
        toast.error(j.error ?? "Update failed");
      }
    } catch {
      beep("error");
      toast.error("Network error — try again");
    } finally {
      setBusy(false);
    }
  };

  /* Tables + zone request counts */
  const tablesView = useMemo(() => {
    const zoneReqs = new Map<string, number>();
    for (const t of tables) {
      zoneReqs.set(t.zone, 0);
    }
    const byToken = new Map(tables.map((t) => [t.qrToken, t]));
    for (const r of openRequests) {
      const t = byToken.get(r.tableToken);
      if (t) zoneReqs.set(t.zone, (zoneReqs.get(t.zone) ?? 0) + 1);
    }
    const occupied = new Map<string, LiveOrder>();
    for (const o of data?.orders ?? []) {
      if (o.tableToken) occupied.set(o.tableToken, o);
    }
    return { zoneReqs, occupied };
  }, [tables, openRequests, data]);

  const zones = useMemo(() => [...new Set(tables.map((t) => t.zone))], [tables]);

  return (
    <OpsShell title="Front Desk" titleAm="የመቀበያ ጠረጴዛ" connected={connected}>
      <div role="status" aria-live="polite" className="sr-only">
        {openRequests.length} open service requests, {activeOrders.length} active orders
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-12 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-gold/15 bg-card p-1 no-scrollbar sm:w-auto">
          <TabsTrigger value="requests" className="gap-1.5 px-4 text-xs font-bold uppercase tracking-[0.12em] data-[state=active]:bg-gold/15 data-[state=active]:text-gold">
            <Bell className="h-3.5 w-3.5" aria-hidden="true" /> Requests
            {openRequests.length > 0 ? (
              <span className="ml-1 rounded-full bg-ember px-1.5 py-0.5 text-[10px] font-bold text-cream tabular-nums">{openRequests.length}</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 px-4 text-xs font-bold uppercase tracking-[0.12em] data-[state=active]:bg-gold/15 data-[state=active]:text-gold">
            <CookingPot className="h-3.5 w-3.5" aria-hidden="true" /> Orders
            <span className="ml-1 rounded-full border border-gold/30 px-1.5 text-[10px] tabular-nums text-gold">{activeOrders.length}</span>
          </TabsTrigger>
          <TabsTrigger value="tables" className="gap-1.5 px-4 text-xs font-bold uppercase tracking-[0.12em] data-[state=active]:bg-gold/15 data-[state=active]:text-gold">
            <Table2 className="h-3.5 w-3.5" aria-hidden="true" /> Tables
          </TabsTrigger>
        </TabsList>

        {/* Requests */}
        <TabsContent value="requests">
          {openRequests.length === 0 ? (
            <div className="card-elevated mt-6 flex flex-col items-center gap-3 py-16 text-center" role="status">
              <Bell className="h-10 w-10 text-gold/25" aria-hidden="true" />
              <p className="text-cream/80">Floor is quiet — no open requests.</p>
            </div>
          ) : (
            <ul className="mt-4 grid max-w-3xl gap-3 lg:grid-cols-2">
              {openRequests.map((r) => (
                <RequestCard key={r.id} r={r} busy={busy} onResolve={resolve} />
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders">
          {activeOrders.length === 0 ? (
            <div className="card-elevated mt-6 flex flex-col items-center gap-3 py-16 text-center" role="status">
              <CookingPot className="h-10 w-10 text-gold/25" aria-hidden="true" />
              <p className="text-cream/80">No dine-in or takeaway tickets right now.</p>
            </div>
          ) : (
            <ul className="mt-4 grid max-w-6xl gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeOrders.map((o) => (
                <OrderTicket key={o.id} o={o} busy={busy} onAdvance={advance} />
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Tables */}
        <TabsContent value="tables">
          {tables.length === 0 ? (
            <div className="card-elevated mt-6 flex flex-col items-center gap-3 py-16 text-center" role="status">
              <Table2 className="h-10 w-10 text-gold/25" aria-hidden="true" />
              <p className="text-cream/80">Loading tables…</p>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {zones.map((zone) => {
                const reqs = tablesView.zoneReqs.get(zone) ?? 0;
                return (
                  <div key={zone}>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{zone}</h2>
                      {reqs > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-ember/50 bg-ember/15 px-2 py-0.5 text-[10px] font-bold text-ember" role="status">
                          <Bell className="h-3 w-3" aria-hidden="true" /> {reqs} call{reqs === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {tables.filter((t) => t.zone === zone).map((t) => {
                        const occ = tablesView.occupied.get(t.qrToken);
                        return (
                          <div key={t.id} className={cn("ticket p-3.5", occ ? "border-ember/50" : "")} aria-label={`Table ${t.label}: ${occ ? "occupied" : "free"}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-cream">{t.label}</p>
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Users className="h-3 w-3" aria-hidden="true" /> {t.seats}
                              </span>
                            </div>
                            {occ ? (
                              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-ember">
                                <Armchair className="h-3 w-3" aria-hidden="true" /> Occupied · {occ.code}
                              </p>
                            ) : (
                              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#8fd0a0]">
                                <CircleSlash className="h-3 w-3" aria-hidden="true" /> Free
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Abem Flow operations · staff board · <Link href="/kitchen" className="text-gold hover:underline">kitchen</Link> ·{" "}
        <Link href="/rider" className="text-gold hover:underline">rider</Link>
      </p>
    </OpsShell>
  );
}
