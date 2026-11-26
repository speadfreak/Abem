"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bike, CheckCircle2, ChefHat, Flame, PackageCheck, ReceiptText,
  ShieldCheck, SearchCheck, UtensilsCrossed,
} from "lucide-react";
import { formatETB, formatTime, statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TrackedOrder } from "./types";

/* ── Live order tracker: polls /api/orders/[code] every 4s ── */

const POLL_MS = 4000;

interface Stage {
  key: string;
  label: string;
  icon: React.ElementType;
}

const BASE_STAGES: Stage[] = [
  { key: "NEW", label: "Received", icon: ReceiptText },
  { key: "PREPARING", label: "In the fire", icon: Flame },
  { key: "READY", label: "Ready", icon: ChefHat },
];
const DELIVERY_STAGE: Stage = { key: "OUT_FOR_DELIVERY", label: "On the way", icon: Bike };
const FINAL_STAGE: Stage = { key: "COMPLETED", label: "Completed", icon: CheckCircle2 };

function stagesFor(type: string): Stage[] {
  return type === "DELIVERY"
    ? [...BASE_STAGES.slice(0, 3), DELIVERY_STAGE, FINAL_STAGE]
    : [...BASE_STAGES, FINAL_STAGE];
}

function stageIndex(status: string, stages: Stage[]): number {
  if (status === "CANCELLED") return -1;
  const idx = stages.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function logAt(log: { status: string; at: string }[], key: string): string | null {
  return log.find((l) => l.status === key)?.at ?? null;
}

export default function OrderTracker({ code }: { code: string }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [state, setState] = useState<"loading" | "live" | "notfound" | "error">("loading");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    const poll = (): void => {
      fetch(`/api/orders/${encodeURIComponent(code)}`, { cache: "no-store" })
        .then(async (res) => {
          if (!aliveRef.current) return;
          if (res.status === 404) {
            setState("notfound");
            return;
          }
          const data = (await res.json()) as { ok: boolean; order?: TrackedOrder };
          if (!aliveRef.current) return;
          if (data.ok && data.order) {
            setOrder(data.order);
            setState("live");
            if (data.order.status === "COMPLETED" || data.order.status === "CANCELLED") {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }
          } else {
            setState("error");
          }
        })
        .catch(() => {
          if (aliveRef.current) setState((s) => (s === "live" ? s : "error"));
        });
    };

    poll();
    timerRef.current = setInterval(poll, POLL_MS);

    return () => {
      aliveRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [code]);

  if (state === "loading") {
    return (
      <div className="container-tight py-24 text-center" role="status" aria-live="polite">
        <div className="skeleton-shimmer mx-auto h-8 w-56 rounded-full" />
        <div className="skeleton-shimmer mx-auto mt-4 h-4 w-80 rounded-full" />
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div className="container-tight py-24 text-center" role="status">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-ember/40 bg-ember/10 shadow-[0_0_60px_-14px_rgba(179,38,30,0.8)]">
          <SearchCheck className="h-10 w-10 text-ember" aria-hidden="true" />
        </span>
        <h1 className="display-2 mt-6 text-cream">We can&apos;t find that order</h1>
        <p className="lead mx-auto mt-3 max-w-md">
          Double-check the code on your receipt — it looks like <strong className="font-mono text-gold">ABM-XXXXXX</strong>. If you just ordered, give the kitchen a few seconds.
        </p>
        <Link href="/track" className="btn-ghost btn-sm mt-8">Try another code</Link>
      </div>
    );
  }

  if (state === "error" || !order) {
    return (
      <div className="container-tight py-24 text-center" role="status">
        <UtensilsCrossed className="mx-auto h-10 w-10 text-gold/30" aria-hidden="true" />
        <p className="mt-4 text-cream/85">The connection dropped mid-bite. Retrying shortly…</p>
        <Link href="/track" className="btn-ghost btn-sm mt-6">Track another order</Link>
      </div>
    );
  }

  const isDelivery = order.type === "DELIVERY";
  const stages = stagesFor(order.type);
  const cancelled = order.status === "CANCELLED";
  const current = stageIndex(order.status, stages);
  const done = order.status === "COMPLETED";

  return (
    <div className="container-tight py-14" aria-live="polite">
      {/* Header */}
      <div className="text-center">
        <p className="eyebrow justify-center">Abem Flow · live status</p>
        <h1 className="display-2 mt-3 font-mono tracking-[0.08em] text-gold" style={{ fontFamily: "var(--font-manrope), monospace" }}>
          {order.code}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {order.customerName} · {isDelivery ? "Delivery" : order.type === "TAKEAWAY" ? "Takeaway" : "Dine-in"}
          {!done && !cancelled ? " — updating every few seconds" : ""}
        </p>
        {cancelled ? (
          <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-ember/50 bg-ember/15 px-4 py-1.5 text-sm font-semibold text-ember" role="status">
            Order cancelled — call us if this looks wrong
          </p>
        ) : null}
      </div>

      {/* Stage stepper */}
      {!cancelled ? (
        <ol className="relative mx-auto mt-12 max-w-md space-y-0" aria-label="Order progress">
          {stages.map((s, i) => {
            const reached = i < current || (done && i === stages.length - 1);
            const active = i === current && !done;
            const Icon = s.icon;
            const at = logAt(order.statusLog, s.key);
            return (
              <li key={s.key} className="relative flex gap-4 pb-10 last:pb-0">
                {/* connector */}
                {i < stages.length - 1 ? (
                  <span
                    className={cn(
                      "absolute left-[22px] top-11 h-[calc(100%-2.75rem)] w-0.5",
                      i < current ? "bg-gold/70" : "bg-gold/12"
                    )}
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                    reached
                      ? "border-gold bg-gold/20 text-gold"
                      : active
                        ? "border-gold bg-gold/10 text-gold shadow-[0_0_28px_-4px_rgba(232,163,23,0.9)] animate-pulse-glow"
                        : "border-gold/20 bg-card text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {active ? (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-gold"
                      animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <div className="pt-1.5">
                  <p className={cn("text-[15px] font-semibold", reached || active ? "text-cream" : "text-muted-foreground")}>
                    {s.label}
                    {active ? <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">now</span> : null}
                  </p>
                  {at ? <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{formatTime(at)}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      {/* Delivery callout */}
      {isDelivery ? (
        <div className="ticket mx-auto mt-10 max-w-md p-5" role="status">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bike className="h-5 w-5 text-gold" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">Your rider</p>
                <p className="text-sm font-semibold text-cream">{order.riderName ?? "Being assigned"}</p>
              </div>
            </div>
            {order.otp ? (
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ember">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Proof code
                </p>
                <p className="font-mono text-2xl font-bold tracking-[0.25em] text-cream">{order.otp}</p>
              </div>
            ) : null}
          </div>
          {order.zoneName ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Zone {order.zoneName}
              {order.address ? <> · {order.address}</> : null}
              {order.landmark ? <> (near {order.landmark})</> : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Summary */}
      <div className="card-elevated mx-auto mt-10 max-w-md p-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Order summary</h2>
        <ul className="mt-3 space-y-2.5">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-cream/90">
                <span className="font-semibold text-gold tabular-nums">{it.qty}×</span> {it.name}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatETB(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="hairline my-4" aria-hidden="true" />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums text-cream">{formatETB(order.subtotal)}</span></div>
          {order.discount > 0 ? <div className="flex justify-between text-[#8fd0a0]"><span>Discount</span><span className="tabular-nums">−{formatETB(order.discount)}</span></div> : null}
          {order.deliveryFee > 0 ? <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span className="tabular-nums text-cream">{formatETB(order.deliveryFee)}</span></div> : null}
          <div className="flex justify-between text-base font-bold text-cream"><span>Total</span><span className="tabular-nums text-gold">{formatETB(order.total)}</span></div>
        </div>
        {order.pointsEarned > 0 ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#8fd0a0]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> +{order.pointsEarned} Abem Rewards points earned
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">Placed {formatTime(order.createdAt)} · {statusLabel(order.status)}</p>
      </div>

      <div className="mt-10 text-center">
        <Link href="/track" className="btn-ghost btn-sm">
          <PackageCheck className="h-4 w-4" aria-hidden="true" /> Track another order
        </Link>
      </div>
    </div>
  );
}
