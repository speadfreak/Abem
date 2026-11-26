"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, UtensilsCrossed } from "lucide-react";

/* ── Order-code lookup form for /track ── */

export default function TrackForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setBusy(true);
    router.push(`/track/${encodeURIComponent(clean.startsWith("ABM-") ? clean : `ABM-${clean}`)}`);
  };

  return (
    <div className="mx-auto max-w-md">
      <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-ember/50 bg-ember/10 shadow-[0_0_60px_-14px_rgba(179,38,30,0.9)]">
        <UtensilsCrossed className="h-10 w-10 text-ember" aria-hidden="true" />
      </span>

      <form onSubmit={submit} className="mt-8" aria-label="Track an order">
        <label htmlFor="track-code" className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          Your order code
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id="track-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABM-XXXXXX"
            autoComplete="off"
            aria-describedby="track-hint"
            className="h-12 flex-1 rounded-full border border-gold/30 bg-card px-5 font-mono text-sm tracking-[0.15em] text-foreground placeholder:text-muted-foreground focus:border-gold/70 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button type="submit" disabled={busy || !code.trim()} className="btn-gold btn-sm shrink-0 px-6 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Track order">
            Track <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p id="track-hint" className="mt-3 text-center text-xs text-muted-foreground">
          Find it on your receipt or the confirmation SMS — starts with ABM.
        </p>
      </form>
    </div>
  );
}
