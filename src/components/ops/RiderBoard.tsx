"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  BadgeCheck, Bike, CheckCircle2, Landmark, LogOut, MapPin, PackageCheck,
  Phone, ShieldCheck, UserCog, UtensilsCrossed,
} from "lucide-react";
import OpsShell, { statusChipCls, typeLabel } from "./OpsShell";
import { beep } from "./sound";
import { useLive, type LiveOrder } from "@/hooks/useLive";
import { formatETB, mapsDirectionsLink, telLink } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── Rider board: assigned deliveries + OTP proof ── */

interface Rider {
  id: string;
  name: string;
  phone: string;
  status: string;
}

const RIDER_KEY = "abem_rider_id";
const ACTIVE_STATUSES = new Set(["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY"]);

interface ZoneFee {
  name: string;
  fee: number;
}

function DeliveryCard({
  o,
  zoneFee,
  busy,
  onPickedUp,
  onComplete,
}: {
  o: LiveOrder;
  zoneFee?: ZoneFee;
  busy: boolean;
  onPickedUp: (o: LiveOrder) => void;
  onComplete: (o: LiveOrder, otp: string) => void;
}) {
  const [otp, setOtp] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const dest = [o.address, o.landmark, "Addis Ababa"].filter(Boolean).join(" ");

  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ticket flex flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-sm font-bold tracking-wider text-gold">{o.code}</p>
        <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusChipCls(o.status))}>
          {o.status === "OUT_FOR_DELIVERY" ? "On the way" : o.status === "READY" ? "Ready to pick" : o.status === "NEW" ? "Queued" : "In the fire"}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-cream">{o.customerName}</p>
          <a href={telLink(o.phone)} className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-gold hover:underline" aria-label={`Call ${o.customerName}`}>
            <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {o.phone}
          </a>
        </div>
        <a
          href={mapsDirectionsLink(dest)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost btn-sm shrink-0"
          aria-label={`Navigate to ${o.customerName}`}
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Navigate
        </a>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-cream/85">{o.address}</p>
      {o.landmark ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Landmark className="h-3 w-3 text-gold" aria-hidden="true" /> near {o.landmark}
        </p>
      ) : null}
      <p className="mt-1.5 text-xs text-muted-foreground">
        {o.zoneName ?? "Zone —"}
        {zoneFee ? <> · fee {formatETB(zoneFee.fee)} (cash total {formatETB(o.total)})</> : <> · cash total {formatETB(o.total)}</>}
      </p>

      <ul className="mt-2.5 border-t border-gold/10 pt-2.5" aria-label={`Items for ${o.code}`}>
        {o.items.map((it) => (
          <li key={`${o.id}-${it.id}`} className="text-[13px] text-cream/85">
            <span className="font-bold text-gold tabular-nums">{it.qty}×</span> {it.name}
          </li>
        ))}
      </ul>

      {o.notes ? <p className="mt-2 rounded-lg border border-gold/25 bg-gold/10 px-2.5 py-1.5 text-[12px] text-cream/85">Note: {o.notes}</p> : null}

      <div className="mt-3 border-t border-gold/10 pt-3">
        {o.status === "READY" ? (
          <button onClick={() => onPickedUp(o)} disabled={busy} className="btn-gold h-12 w-full disabled:cursor-wait disabled:opacity-50" aria-label={`Mark ${o.code} picked up`}>
            <PackageCheck className="h-4 w-4" aria-hidden="true" /> Picked up
          </button>
        ) : o.status === "OUT_FOR_DELIVERY" ? (
          otpOpen ? (
            <div className="flex gap-2">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Customer proof code"
                className="h-12 flex-1 rounded-full border border-gold/40 bg-card px-5 text-center font-mono text-xl tracking-[0.4em] text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <button onClick={() => onComplete(o, otp)} disabled={busy || otp.length !== 4} className="btn-ember btn-sm shrink-0 disabled:cursor-wait disabled:opacity-50" aria-label={`Complete delivery ${o.code}`}>
                <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verify
              </button>
            </div>
          ) : (
            <button onClick={() => setOtpOpen(true)} disabled={busy} className="btn-ember h-12 w-full disabled:cursor-wait disabled:opacity-50" aria-label={`Open proof code entry for ${o.code}`}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Complete delivery
            </button>
          )
        ) : (
          <p className="text-center text-xs text-muted-foreground" role="status">Kitchen is on this ticket — pick up when it flips to Ready.</p>
        )}
      </div>
    </motion.li>
  );
}

export default function RiderBoard() {
  const { data, connected } = useLive();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoneFees, setZoneFees] = useState<ZoneFee[]>([]);
  const [doneCount, setDoneCount] = useState(0);

  /* Riders + zones */
  useEffect(() => {
    fetch("/api/riders")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { riders?: Rider[] } | null) => {
        setRiders(j?.riders ?? []);
        const saved = window.localStorage.getItem(RIDER_KEY);
        if (saved && (j?.riders ?? []).some((r) => r.id === saved)) setMeId(saved);
      })
      .catch(() => {});
    fetch("/api/zones")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { zones?: ZoneFee[] } | null) => setZoneFees(j?.zones ?? []))
      .catch(() => {});
  }, []);

  const me = riders.find((r) => r.id === meId) ?? null;

  const pickRider = (id: string) => {
    setMeId(id);
    try {
      window.localStorage.setItem(RIDER_KEY, id);
    } catch {
      /* private mode */
    }
  };

  const dropRider = () => {
    setMeId(null);
    try {
      window.localStorage.removeItem(RIDER_KEY);
    } catch {
      /* ignore */
    }
  };

  const mine = useMemo(
    () =>
      me
        ? (data?.orders ?? [])
            .filter((o) => o.type === "DELIVERY" && o.riderId === me.id && ACTIVE_STATUSES.has(o.status))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [data, me]
  );

  const pickedUp = async (o: LiveOrder) => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: o.code, status: "OUT_FOR_DELIVERY", by: "rider" }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (j.ok) {
        beep("done");
        toast.success(`${o.code} — ride safe, mark the proof code at the door`);
      } else {
        toast.error(j.error ?? "Update failed");
      }
    } catch {
      toast.error("Network error — try again");
    } finally {
      setBusy(false);
    }
  };

  const complete = async (o: LiveOrder, otp: string) => {
    if (otp.length !== 4) {
      beep("error");
      toast.error("Enter the 4-digit code the customer shows you");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(o.code)}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, riderId: o.riderId }),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (j.ok) {
        beep("done");
        setDoneCount((c) => c + 1);
        toast.success(`${o.code} delivered — nice work`);
      } else {
        beep("error");
        toast.error(j.error ?? "Code rejected — check with the customer");
      }
    } catch {
      beep("error");
      toast.error("Network error — try again");
    } finally {
      setBusy(false);
    }
  };

  /* ── Rider picker ── */
  if (!me) {
    return (
      <OpsShell title="Rider Board" titleAm="የመንጃ ቦርድ" connected={connected}>
        <div className="mx-auto max-w-md py-8">
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <Bike className="h-8 w-8 text-gold" aria-hidden="true" />
            </span>
            <h2 className="display-3 mt-4 text-cream">Who is riding today?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Pick your name — deliveries assigned to you appear here.</p>
          </div>
          {riders.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground" role="status">Loading riders…</p>
          ) : (
            <ul className="mt-8 space-y-3">
              {riders.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => pickRider(r.id)}
                    className="card-elevated card-hover flex w-full items-center gap-3.5 p-4 text-left focus-visible:outline-2 focus-visible:outline-gold"
                    aria-label={`Continue as ${r.name}`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                      <UserCog className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-cream">{r.name}</span>
                      <span className="block text-xs text-muted-foreground">{r.phone} · {r.status.toLowerCase()}</span>
                    </span>
                    <LogOut className="h-4 w-4 shrink-0 rotate-180 text-gold" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </OpsShell>
    );
  }

  /* ── Assigned deliveries ── */
  return (
    <OpsShell title="Rider Board" titleAm="የመንጃ ቦርድ" connected={connected}>
      <div role="status" aria-live="polite" className="sr-only">
        {mine.length} active deliveries assigned to {me.name}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="ticket flex items-center gap-3 px-4 py-2.5">
          <Bike className="h-4 w-4 text-gold" aria-hidden="true" />
          <span className="text-sm text-cream">
            Active <strong className="tabular-nums text-gold">{mine.length}</strong>
          </span>
        </div>
        <div className="ticket flex items-center gap-3 px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#8fd0a0]" aria-hidden="true" />
          <span className="text-sm text-cream">
            Done this shift <strong className="tabular-nums text-[#8fd0a0]">{doneCount}</strong>
          </span>
        </div>
        <button onClick={dropRider} className="btn-ghost btn-sm ml-auto" aria-label="Switch rider">
          <UserCog className="h-3.5 w-3.5" aria-hidden="true" /> Switch rider
        </button>
      </div>

      {mine.length === 0 ? (
        <div className="card-elevated mt-6 flex flex-col items-center gap-3 py-20 text-center" role="status">
          <Bike className="h-10 w-10 text-gold/25" aria-hidden="true" />
          <p className="text-cream/80">No deliveries on your bike yet — new tickets land here automatically.</p>
        </div>
      ) : (
        <ul className="mt-5 grid max-w-6xl gap-4 md:grid-cols-2">
          {mine.map((o) => (
            <DeliveryCard
              key={o.id}
              o={o}
              zoneFee={zoneFees.find((z) => z.name === o.zoneName)}
              busy={busy}
              onPickedUp={pickedUp}
              onComplete={complete}
            />
          ))}
        </ul>
      )}

      <p className="mt-8 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <UtensilsCrossed className="h-3.5 w-3.5 text-gold" aria-hidden="true" /> {typeLabel("DELIVERY")} board · Abem Flow · always get the proof code before handing over food
      </p>
    </OpsShell>
  );
}
