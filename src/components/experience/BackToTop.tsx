"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/* Back-to-top with circular scroll-progress ring. */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
      setProgress(p);
      setVisible(el.scrollTop > 620);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const lenis = (window as unknown as { __abemLenis?: { scrollTo: (t: number, o?: object) => void } }).__abemLenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const C = 2 * Math.PI * 20;

  return (
    <button
      onClick={toTop}
      aria-label="Back to top"
      className={`fixed bottom-5 right-5 z-[75] hidden h-12 w-12 items-center justify-center rounded-full glass text-gold transition-all duration-500 hover:bg-gold/15 md:flex ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <svg className="absolute inset-0 h-12 w-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(232,163,23,0.15)" strokeWidth="2" />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="#e8a317"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
        />
      </svg>
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
