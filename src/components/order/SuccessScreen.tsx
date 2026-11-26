"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bike, CheckCircle2, MessageCircle, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { formatETB, whatsappLink } from "@/lib/format";
import type { OrderSuccessData } from "./types";

/* ── Post-order success screen (replaces the hub content) ── */

export default function SuccessScreen({ data, onDone }: { data: OrderSuccessData; onDone: () => void }) {
  const { settings } = useSettings();
  const isDelivery = data.type === "DELIVERY";

  return (
    <section className="container-x flex min-h-[70vh] items-center py-16" aria-live="polite">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-2xl"
      >
        <div className="card-elevated relative overflow-hidden p-8 text-center sm:p-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(179,38,30,0.22),transparent),radial-gradient(50%_40%_at_80%_100%,rgba(232,163,23,0.12),transparent)]"
            aria-hidden="true"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 220, delay: 0.15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/50 bg-gold/10 shadow-[0_0_50px_-10px_rgba(232,163,23,0.8)]"
          >
            <CheckCircle2 className="h-10 w-10 text-gold" aria-hidden="true" />
          </motion.div>

          <p className="eyebrow mt-6 justify-center">Order confirmed · ትዕዛዝዎ ወዲህ መጣ</p>
          <h1 className="display-1 mt-4 font-mono tracking-[0.08em] text-gold" style={{ fontFamily: "var(--font-manrope), monospace" }}>
            {data.code}
          </h1>
          <p className="lead mx-auto mt-3 max-w-md">
            {isDelivery
              ? "The kitchen has your ticket. Your rider will be at your door hot and on time."
              : data.type === "TAKEAWAY"
                ? "The kitchen has your ticket. Pick it up at the host desk, steaming."
                : "The kitchen has your ticket. Look for your server — the injera is on its way."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold" role="status">
              <Timer className="h-4 w-4" aria-hidden="true" /> {data.eta}
            </span>
            {data.pointsEarned > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-highland/50 bg-highland/15 px-4 py-2 text-sm font-semibold text-[#8fd0a0]">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> +{data.pointsEarned} Abem points
              </span>
            ) : null}
            {data.riderName ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-card px-4 py-2 text-sm text-cream/85">
                <Bike className="h-4 w-4 text-gold" aria-hidden="true" /> {data.riderName} is riding your order
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-card px-4 py-2 text-sm text-cream/85">
              Total <strong className="tabular-nums text-gold">{formatETB(data.total)}</strong>
            </span>
          </div>

          {isDelivery && data.otp ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="ticket mx-auto mt-8 max-w-sm p-5"
              role="status"
            >
              <p className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ember">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Show this code to your rider
              </p>
              <p className="mt-3 font-mono text-4xl font-bold tracking-[0.35em] text-cream">{data.otp}</p>
              <p className="mt-2 text-xs text-muted-foreground">Proof-of-delivery — share it only when the food is in your hands.</p>
            </motion.div>
          ) : null}

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={`/track/${data.code}`} className="btn-gold">
              Track my order <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {settings.contact.whatsapp ? (
              <a
                href={whatsappLink(settings.contact.whatsapp, `My Abem order ${data.code} — ${formatETB(data.total)}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-sm"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Share on WhatsApp
              </a>
            ) : null}
            <button onClick={onDone} className="btn-ghost btn-sm">
              Order more
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
