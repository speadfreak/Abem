"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { OpenBadge } from "@/components/shared/Primitives";
import { cn } from "@/lib/utils";

/* Shared page hero for interior pages. */
export default function PageHero({
  eyebrow,
  title,
  titleAm,
  description,
  image,
  hours,
  holidays,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  titleAm?: string;
  description?: string;
  image?: string;
  hours?: Record<string, { open: string; close: string; closed: boolean }>;
  holidays?: string[];
  compact?: boolean;
}) {
  return (
    <section className={cn("relative overflow-hidden", compact ? "pt-36 pb-14" : "pt-40 pb-20 md:pb-28")} aria-label={`${title} — page header`}>
      {image && (
        <div className="absolute inset-0 -z-10">
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover opacity-30 img-duotone" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0705]/80 via-[#0b0705]/55 to-[#0b0705]" aria-hidden="true" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(179,38,30,0.14),transparent),radial-gradient(50%_40%_at_90%_20%,rgba(232,163,23,0.08),transparent)]" aria-hidden="true" />
      <div className="container-x">
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="eyebrow"
        >
          {eyebrow}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08 }}
          className="display-hero mt-5 max-w-[14ch] text-cream"
        >
          {title}
          {titleAm ? <span className="mt-3 block font-display-ethiopic text-[0.42em] text-gold/90">{titleAm}</span> : null}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18 }}
            className="lead mt-6 max-w-xl text-cream/70"
          >
            {description}
          </motion.p>
        )}
        {hours ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-7">
            <OpenBadge hours={hours} holidays={holidays ?? []} />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
