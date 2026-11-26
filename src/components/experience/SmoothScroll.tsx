"use client";

import React, { useEffect } from "react";
import type Lenis from "lenis";

/* Lenis smooth scrolling synced with GSAP ScrollTrigger (global experience). */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let lenis: Lenis | null = null;
    let rafId = 0;
    let cleanupGsap: (() => void) | null = null;
    let killed = false;

    (async () => {
      const [{ default: LenisCtor }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);

      lenis = new LenisCtor({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.4,
      });
      // expose for BackToTop + anchors
      (window as unknown as { __abemLenis: typeof lenis }).__abemLenis = lenis;

      lenis.on("scroll", ScrollTrigger.update as never);
      const l = lenis as Lenis;
      const tick = (time: number) => l.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      rafId = 0;

      cleanupGsap = () => {
        gsap.ticker.remove(tick);
        ScrollTrigger.getAll().forEach((t: { kill: () => void }) => t.kill());
      };
    })();

    return () => {
      killed = true;
      if (cleanupGsap) cleanupGsap();
      lenis?.destroy();
      if (rafId) cancelAnimationFrame(rafId);
      delete (window as unknown as { __abemLenis?: unknown }).__abemLenis;
    };
  }, []);

  return null;
}
