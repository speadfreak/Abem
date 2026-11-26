"use client";

import React, { useEffect, useRef, useState } from "react";
import { LogoMark } from "./Logo";

/* Cinematic preloader: SVG stroke draw + progress counter + curtain-split reveal.
   Shows once per session. Respects prefers-reduced-motion. */

export default function Preloader() {
  const [phase, setPhase] = useState<"idle" | "show" | "split" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let shown = false;
    try {
      shown = sessionStorage.getItem("abem_preloaded") === "1";
    } catch {
      /* ignore */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (shown || reduced) {
      document.documentElement.classList.add("abem-loaded");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("done");
      return;
    }

     
    setPhase("show");
    document.body.style.overflow = "hidden";
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + Math.random() * 9 + 3);
      setProgress(Math.floor(p));
      if (p >= 100) {
        clearInterval(iv);
        timer.current = setTimeout(() => {
          setPhase("split");
          document.body.style.overflow = "";
          try {
            sessionStorage.setItem("abem_preloaded", "1");
          } catch {
            /* ignore */
          }
          timer.current = setTimeout(() => {
            setPhase("done");
            document.documentElement.classList.add("abem-loaded");
          }, 1000);
        }, 450);
      }
    }, 130);

    return () => {
      clearInterval(iv);
      if (timer.current) clearTimeout(timer.current);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "idle" || phase === "done") return null;

  const split = phase === "split";

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="status"
      aria-label="Loading Abem Restaurant"
    >
      {/* curtains */}
      <div
        className={`absolute inset-x-0 top-0 h-1/2 bg-[#0b0705] transition-transform duration-[900ms] ease-[cubic-bezier(0.77,0,0.18,1)] ${
          split ? "-translate-y-full" : ""
        }`}
      >
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      </div>
      <div
        className={`absolute inset-x-0 bottom-0 h-1/2 bg-[#0b0705] transition-transform duration-[900ms] ease-[cubic-bezier(0.77,0,0.18,1)] ${
          split ? "translate-y-full" : ""
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      </div>

      {/* center content */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${
          split ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="relative">
          {/* steam shimmer */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block w-1 h-8 rounded-full bg-gradient-to-t from-transparent to-cream/25 blur-[2px]"
                style={{ animation: `steam-rise 2.6s ease-out ${i * 0.7}s infinite` }}
              />
            ))}
          </div>
          <LogoMark animated className="h-24 w-24" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="font-display text-2xl tracking-[0.32em] text-cream">ABEM</span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-gold/80">
            Where fire meets heritage
          </span>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-px w-40 bg-gold/15 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold/60 to-gold transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-xs text-gold/90 tabular-nums w-10 text-right">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading Abem Restaurant</span>
    </div>
  );
}
