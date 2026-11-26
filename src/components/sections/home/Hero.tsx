"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Play, ShoppingBag } from "lucide-react";
import EmberCanvas from "@/components/brand/EmberCanvas";
import Magnetic from "@/components/shared/Magnetic";
import { OpenBadge } from "@/components/shared/Primitives";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useLang } from "@/lib/i18n/lang-context";

/* Split-text hero headline. */
function SplitWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom" aria-hidden="true">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: "110%", rotate: 4, opacity: 0 }}
            animate={{ y: "0%", rotate: 0, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.28 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const { settings } = useSettings();
  const { lang } = useLang();
  const hero = settings.hero;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const fgY = useTransform(scrollYProgress, [0, 1], ["0%", "38%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const [videoOk, setVideoOk] = useState(true);

  const title = lang === "am" && hero.titleAm ? hero.titleAm : hero.title;
  const eyebrow = lang === "am" && hero.eyebrowAm ? hero.eyebrowAm : hero.eyebrow;
  const subtitle = lang === "am" && hero.subtitleAm ? hero.subtitleAm : hero.subtitle;
  const isAm = lang === "am";

  useEffect(() => {
    if (hero.videoUrl && videoOk) return;
    // no-op: video element handles its own errors
  }, [hero.videoUrl, videoOk]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden" aria-label="Abem Restaurant hero">
      {/* Background layers */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
        {hero.videoUrl && videoOk ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={hero.videoUrl}
            poster={hero.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoOk(false)}
          />
        ) : (
          <Image
            src={hero.posterUrl || "/images/hero-poster.jpg"}
            alt="Ethiopian feast on a mesob at Abem Restaurant"
            fill
            priority
            sizes="100vw"
            className="animate-kenburns object-cover img-duotone"
          />
        )}
        <EmberCanvas className="absolute inset-0 h-full w-full" />
        {/* Legibility gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0705]/72 via-[#0b0705]/35 to-[#0b0705]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_10%,rgba(232,163,23,0.10),transparent)]" aria-hidden="true" />
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: fgY, opacity: fade }} className="container-x relative z-10 pb-24 pt-40 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <OpenBadge hours={settings.hours ?? {}} holidays={settings.holidays ?? []} />
          <span className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-cream/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/80">
            <Play className="h-3 w-3 text-gold" aria-hidden="true" />
            {eyebrow}
          </span>
        </motion.div>

        <h1 className="display-hero max-w-[13ch] text-cream">
          <SplitWords text={title} className={isAm ? "font-display-ethiopic" : undefined} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.75 }}
          className={`lead mt-6 max-w-xl text-cream/75 ${isAm ? "am-text" : ""}`}
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.95 }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <Magnetic>
            <Link href={hero.cta1?.href || "/reservations"} className="btn-gold" data-magnetic>
              {hero.cta1?.label || "Reserve a Table"}
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href={hero.cta2?.href || "/menu"} className="btn-ghost" data-magnetic>
              {hero.cta2?.label || "Explore the Menu"}
            </Link>
          </Magnetic>
          {settings.features.ordering && (
            <Link
              href="/order"
              className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-gold/90 transition hover:text-gold"
            >
              <ShoppingBag className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              Order online
            </Link>
          )}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/50"
        aria-hidden="true"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden bg-cream/15">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-gold animate-scroll-cue" />
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </motion.div>
    </section>
  );
}
