"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlarmClock, Bike, ChefHat, Flame, HandPlatter, Timer } from "lucide-react";
import OpsShell, { typeLabel } from "./OpsShell";
import { beep } from "./sound";
import { useLive, type LiveOrder, type LiveOrderItem } from "@/hooks/useLive";
import { cn } from "@/lib/utils";

/* ── Kitchen board: NEW / PREPARING / READY columns ── */

const COLUMNS = [
  { key: "NEW", title: "New tickets", next: "PREPARING", action: "Fire it", icon: Flame },
  { key: "PREPARING", title: "In the fire", next: "READY", action: "Plate it", icon: ChefHat },
  { key: "READY", title: "Ready", next: "COMPLETED", action: "Hand off", icon: HandPlatter },
] as const;

const STATION_FILTERS = ["all", "wat", "grill", "cold", "drinks", "dessert"] as const;

const DANGER_WORDS = ["allergy", "allergic"];
const PREF_WORDS = ["fasting", "vegan", "no berbere", "mild", "extra spicy"];

function noteClass(note: string): string {
  const n = note.toLowerCase();
  if (DANGER_WORDS.some((w) => n.includes(w))) return "border-ember/60 bg-ember/15 text-ember";
  if (PREF_WORDS.some((w) => n.includes(w))) return "border-highland/60 bg-highland/20 text-[#8fd0a0]";
  return "border-gold/30 bg-gold/10 text-cream/85";
}

function majorityStation(items: LiveOrderItem[]): string | null {
  const counts = new Map<string, number>();
  for (const it of items) {
    const s = (it.station ?? "").toLowerCase();
    if (s) counts.set(s, (counts.get(s) ?? 0) + it.qty);
  }
  if (counts.size === 0) return null;
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  return top[0];
}

function TicketCard({
  o,
  amber,
  red,
  busy,
  onBump,
}: {
  o: LiveOrder;
  amber: number;
  red: number;
  busy: boolean;
  onBump: (o: LiveOrder) => void;
}) {
  const mins = o.prepMinutes;
  const heat = mins >= red ? "text-ember" : mins >= amber ? "text-gold" : "text-[#8fd0a0]";
  const col = COLUMNS.find((c) => c.key === o.status);
  const station = majorityStation(o.items);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn("ticket flex flex-col p-4", mins >= red && "border-ember/60")}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-sm font-bold tracking-wider text-gold">{o.code}</p>
        <span className={cn("inline-flex items-center gap-1 rounded-full border border-gold/25 bg-card px-2.5 py-1 text-[11px] font-bold tabular-nums", heat)} role="timer" aria-label={`${mins} minutes since ticket`}>
          <Timer className="h-3 w-3" aria-hidden="true" /> {mins} min
        </span>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {o.tableLabel ? <span className="font-semibold text-cream/80">Table {o.tableLabel}</span> : <span className="font-semibold text-cream/80">{o.customerName}</span>}
        {o.type === "DELIVERY" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#5b8dd9]/50 bg-[#5b8dd9]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#9cc0ec]">
            <Bike className="h-3 w-3" aria-hidden="true" /> rider
          </span>
        ) : null}
        {station ? <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">{station}</span> : null}
      </p>

      <ul className="mt-2.5 flex-1 space-y-1" aria-label={`Items for ${o.code}`}>
        {o.items.map((it) => (
          <li key={`${o.id}-${it.id}`} className="text-[13px] text-cream/90">
            <span className="font-bold text-gold tabular-nums">{it.qty}×</span> {it.name}
            {it.station ? <span className="ml-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">· {it.station}</span> : null}
          </li>
        ))}
      </ul>

      {o.items.some((it) => it.notes) ? (
        <div className="mt-2.5 space-y-1.5">
          {o.items
            .filter((it) => it.notes)
            .map((it) => (
              <p key={`${o.id}-${it.id}-n`} className={cn("rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold", noteClass(it.notes ?? ""))} role="status">
                {it.notes}
              </p>
            ))}
        </div>
      ) : null}
      {o.notes ? (
        <p className={cn("mt-2.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold", noteClass(o.notes))} role="status">
          {o.notes}
        </p>
      ) : null}

      {col ? (
        <button
          onClick={() => onBump(o)}
          disabled={busy}
          className="btn-ember mt-3 h-12 w-full disabled:cursor-wait disabled:opacity-50"
          aria-label={`${col.action} ${o.code}`}
        >
          {col.action}
        </button>
      ) : null}
    </motion.li>
  );
}

export default function KitchenBoard() {
  const { data, connected } = useLive();
  const [busy, setBusy] = useState(false);
  const [station, setStation] = useState<(typeof STATION_FILTERS)[number]>("all");
  const [amberMin, setAmberMin] = useState(12);
  const [redMin, setRedMin] = useState(22);
  const [, setTick] = useState(0);
  const seen = useRef<Set<string> | null>(null);

  /* Kitchen thresholds from settings (fetch once) */
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { kitchen?: { amberMinutes?: number; redMinutes?: number } } | null) => {
        if (typeof j?.kitchen?.amberMinutes === "number") setAmberMin(j.kitchen.amberMinutes);
        if (typeof j?.kitchen?.redMinutes === "number") setRedMin(j.kitchen.redMinutes);
      })
      .catch(() => {});
  }, []);

  /* Minute tick so timers refresh */
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  /* Sound cue on a new ticket */
  useEffect(() => {
    if (!data) return;
    if (seen.current) {
      const fresh = data.orders.find((o) => !seen.current?.has(o.id) && o.status === "NEW");
      if (fresh) beep("order");
    }
    seen.current = new Set(data.orders.map((o) => o.id));
  }, [data]);

  const bump = async (o: LiveOrder) => {
    const col = COLUMNS.find((c) => c.key === o.status);
    if (!col) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: o.code, status: col.next, by: "kitchen" }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (j.ok) {
        beep("done");
        toast.success(`${o.code} → ${col.next.replace("_", " ").toLowerCase()}`);
      } else {
        beep("error");
        toast.error(j.error ?? "Bump failed");
      }
    } catch {
      beep("error");
      toast.error("Network error — try again");
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const all = data?.orders ?? [];
    if (station === "all") return all;
    return all.filter((o) => {
      const s = majorityStation(o.items);
      return s === station;
    });
  }, [data, station]);

  return (
    <OpsShell title="Kitchen Line" titleAm="የእሳት ቀጥር" connected={connected}>
      {/* Station filters */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Station filter">
        {STATION_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStation(s)}
            aria-pressed={station === s}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-4 text-[11px] font-bold uppercase tracking-[0.14em] transition-all focus-visible:outline-2 focus-visible:outline-gold active:scale-95",
              station === s ? "border-gold bg-gold/15 text-gold" : "border-gold/20 bg-card text-cream/60 hover:border-gold/45 hover:text-cream"
            )}
          >
            {s === "all" ? "All stations" : s}
          </button>
        ))}
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
          <AlarmClock className="h-3.5 w-3.5" aria-hidden="true" /> amber {amberMin} min · red {redMin} min
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3" role="status" aria-live="polite" aria-label="Kitchen tickets">
        {COLUMNS.map((c) => {
          const colOrders = filtered
            .filter((o) => o.status === c.key)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // oldest first — fire urgency
          const Icon = c.icon;
          return (
            <section key={c.key} aria-label={`${c.title}, ${colOrders.length} tickets`}>
              <div className="flex items-center justify-between border-b border-gold/15 pb-2">
                <h2 className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-cream">
                  <Icon className={cn("h-4 w-4", c.key === "NEW" ? "text-gold" : c.key === "PREPARING" ? "text-ember" : "text-[#8fd0a0]")} aria-hidden="true" />
                  {c.title}
                </h2>
                <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[11px] font-bold tabular-nums text-gold">{colOrders.length}</span>
              </div>
              {colOrders.length === 0 ? (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-gold/20 py-14 text-center" role="status">
                  <Flame className="h-8 w-8 text-gold/25" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">{c.key === "NEW" ? "No new tickets" : c.key === "PREPARING" ? "Nothing on the fire" : "Nothing plated"}</p>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {colOrders.map((o) => (
                    <TicketCard key={o.id} o={o} amber={amberMin} red={redMin} busy={busy} onBump={bump} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </OpsShell>
  );
}
