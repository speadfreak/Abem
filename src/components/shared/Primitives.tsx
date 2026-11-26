"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

/* Scroll-reveal wrapper: fade + rise (GPU friendly). */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-12% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Animated number counter. */
export function Counter({
  to,
  suffix = "",
  duration = 1800,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = React.useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVal(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {val.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/* Section heading with eyebrow + optional Amharic. */
export function SectionHeading({
  eyebrow,
  title,
  titleAm,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  titleAm?: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal className={cn(align === "center" ? "text-center mx-auto max-w-3xl" : "text-left", className)}>
      {eyebrow ? (
        <span className={cn("eyebrow", align === "center" && "eyebrow-center justify-center")}>{eyebrow}</span>
      ) : null}
      <h2 className="display-1 mt-4 text-foreground">
        {title}
        {titleAm ? <span className="block mt-2 font-display-ethiopic text-[0.55em] text-gold/80">{titleAm}</span> : null}
      </h2>
      {description ? <p className="lead mt-5">{description}</p> : null}
    </Reveal>
  );
}

/* Infinite marquee band. */
export function Marquee({
  items,
  reverse = false,
  fast = false,
  hoverPause = true,
  className,
  itemClassName,
  separator = "✦",
}: {
  items: React.ReactNode[];
  reverse?: boolean;
  fast?: boolean;
  hoverPause?: boolean;
  className?: string;
  itemClassName?: string;
  separator?: React.ReactNode;
}) {
  const row = (
    <div className="marquee-row flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className={cn("inline-flex items-center gap-6 px-6", itemClassName)}>
          {it}
          <span className="text-gold/60" aria-hidden="true">{separator}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div
      className={cn("marquee overflow-hidden", fast && "marquee-fast", hoverPause && "marquee-hover", className)}
      role="presentation"
    >
      <div className={cn("marquee-track", reverse && "reverse")}>
        {row}
        {row}
      </div>
    </div>
  );
}

/* Open / Closed pill, driven by weekly hours settings. */
export function OpenBadge({ hours, holidays, className }: { hours: Record<string, { open: string; close: string; closed: boolean }>; holidays?: string[]; className?: string }) {
  const [state, setState] = React.useState<{ open: boolean; label: string } | null>(null);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const dayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()];
      const todayISO = now.toISOString().slice(0, 10);
      if (holidays?.includes(todayISO)) return setState({ open: false, label: "Closed for holiday" });
      const h = hours?.[dayKey];
      if (!h || h.closed) return setState({ open: false, label: "Closed today" });
      const parse = (t: string) => {
        const [hh, mm] = t.split(":").map(Number);
        return hh * 60 + mm;
      };
      let open = parse(h.open);
      let close = parse(h.close);
      if (close <= open) close += 24 * 60;
      const mins = now.getHours() * 60 + now.getMinutes();
      setState({ open: mins >= open && mins <= close, label: mins >= open && mins <= close ? "Open now" : "Closed now" });
    };
    compute();
    const iv = setInterval(compute, 60000);
    return () => clearInterval(iv);
  }, [hours, holidays]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
        state?.open ? "border-highland/60 bg-highland/15 text-[#8fd0a0]" : "border-gold/30 bg-gold/10 text-gold",
        className
      )}
      role="status"
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", state?.open ? "bg-[#6fc98a] animate-pulse-glow" : "bg-gold/70")} />
      {state?.label ?? "…"}
    </span>
  );
}
