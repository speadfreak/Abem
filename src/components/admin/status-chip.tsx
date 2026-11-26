"use client";

import { statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const CHIP: Record<string, string> = {
  NEW: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  PREPARING: "border-gold/45 bg-gold/10 text-gold",
  READY: "border-emerald-400/45 bg-emerald-400/10 text-emerald-300",
  OUT_FOR_DELIVERY: "border-amber-400/45 bg-amber-400/10 text-amber-300",
  COMPLETED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  CANCELLED: "border-ember/55 bg-ember/15 text-red-300",
  PENDING: "border-gold/45 bg-gold/10 text-gold",
  CONFIRMED: "border-emerald-400/45 bg-emerald-400/10 text-emerald-300",
  DECLINED: "border-ember/55 bg-ember/15 text-red-300",
  SEATED: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  UNPAID: "border-ember/45 bg-ember/10 text-red-300",
  PAID: "border-emerald-400/45 bg-emerald-400/10 text-emerald-300",
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        CHIP[status] ?? "border-gold/30 bg-gold/5 text-cream",
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
