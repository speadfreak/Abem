"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { isBoardMuted, setBoardMuted, subscribeMute } from "./sound";
import { cn } from "@/lib/utils";

/* ── Ops shell: chrome-less full-screen board frame ─────────────── */

export default function OpsShell({
  title,
  titleAm,
  connected,
  children,
}: {
  title: string;
  titleAm?: string;
  connected: boolean;
  children: React.ReactNode;
}) {
  const [clock, setClock] = useState<string>("");
  const mute = useSyncExternalStore(subscribeMute, isBoardMuted, () => false);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const toggleMute = () => {
    setBoardMuted(!mute);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0705] text-foreground">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-gold/15 bg-[#120b07]/95 px-3 backdrop-blur-md sm:px-5" role="banner">
        <Link href="/" aria-label="Back to Abem Restaurant site" className="shrink-0">
          <LogoMark className="h-8 w-8" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold uppercase tracking-[0.18em] text-cream">{title}</h1>
          {titleAm ? <p className="am-text truncate text-[10px] text-gold/80">{titleAm}</p> : null}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden font-mono text-sm tabular-nums text-cream/85 sm:block" aria-label="Current time">{clock}</span>
          <button
            onClick={toggleMute}
            aria-label={mute ? "Unmute sound cues" : "Mute sound cues"}
            aria-pressed={mute}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 text-cream/70 transition-colors hover:border-gold/60 hover:text-gold focus-visible:outline-2 focus-visible:outline-gold active:scale-90"
          >
            {mute ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
          </button>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
              connected ? "border-highland/60 bg-highland/15 text-[#8fd0a0]" : "border-ember/60 bg-ember/15 text-ember"
            )}
            role="status"
            aria-live="polite"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-[#6fc98a] animate-pulse-glow" : "bg-ember animate-pulse-glow")} aria-hidden="true" />
            {connected ? "Live" : "Offline"}
          </span>
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full border border-gold/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cream/70 transition-colors hover:border-gold/60 hover:text-gold sm:inline-flex"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Site
          </Link>
        </div>
      </header>

      <main className="flex-1 px-3 py-4 sm:px-5 sm:py-5">{children}</main>
    </div>
  );
}

/* Shared status chip styles for the boards. */
export const STATUS_CHIP: Record<string, string> = {
  NEW: "border-gold/50 bg-gold/15 text-gold",
  PREPARING: "border-ember/50 bg-ember/15 text-ember",
  READY: "border-highland/50 bg-highland/15 text-[#8fd0a0]",
  OUT_FOR_DELIVERY: "border-[#5b8dd9]/50 bg-[#5b8dd9]/15 text-[#9cc0ec]",
  COMPLETED: "border-cream/25 bg-cream/10 text-cream/70",
  CANCELLED: "border-cream/20 bg-cream/5 text-muted-foreground",
};

export function statusChipCls(status: string): string {
  return STATUS_CHIP[status] ?? "border-gold/30 bg-card text-cream/80";
}

export function typeLabel(type: string): string {
  if (type === "DINEIN") return "Dine-in";
  if (type === "TAKEAWAY") return "Takeaway";
  if (type === "DELIVERY") return "Delivery";
  return type;
}
