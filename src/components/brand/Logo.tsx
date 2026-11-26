"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ── ABEM logo mark: ember flame rising from the mesob ── */

export function LogoMark({
  className,
  animated = false,
  strokeWidth = 2.4,
}: {
  className?: string;
  animated?: boolean;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={cn("h-10 w-10", className)}
      role="img"
      aria-label="Abem Restaurant emblem"
    >
      <defs>
        <linearGradient id="abem-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d47a" />
          <stop offset="45%" stopColor="#e8a317" />
          <stop offset="100%" stopColor="#cf8d0c" />
        </linearGradient>
        <linearGradient id="abem-ember" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#b3261e" />
          <stop offset="60%" stopColor="#e05a4e" />
          <stop offset="100%" stopColor="#f0c24e" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="url(#abem-gold)"
        strokeWidth={strokeWidth}
        className={animated ? "abem-draw" : undefined}
        style={animated ? { strokeDasharray: 283, strokeDashoffset: 283 } : undefined}
      />
      {/* Mesob weave lines */}
      <path
        d="M28 74 Q50 66 72 74"
        stroke="url(#abem-gold)"
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
        className={animated ? "abem-draw-slow" : undefined}
        style={animated ? { strokeDasharray: 50, strokeDashoffset: 50 } : undefined}
      />
      <path
        d="M31 81 Q50 74 69 81"
        stroke="url(#abem-gold)"
        strokeWidth={strokeWidth * 0.6}
        strokeLinecap="round"
        opacity={0.6}
        className={animated ? "abem-draw-slower" : undefined}
        style={animated ? { strokeDasharray: 44, strokeDashoffset: 44 } : undefined}
      />
      {/* Flame */}
      <path
        d="M50 16 C44 28 34 36 34 52 C34 66 41 74 50 74 C59 74 66 66 66 52 C66 36 56 28 50 16 Z"
        stroke="url(#abem-ember)"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        className={animated ? "abem-draw-flame" : undefined}
        style={animated ? { strokeDasharray: 220, strokeDashoffset: 220 } : undefined}
      />
      <path
        d="M50 40 C47 46 44 50 44 57 C44 63 46.8 67 50 67 C53.2 67 56 63 56 57 C56 50 53 46 50 40 Z"
        fill="url(#abem-ember)"
        className={animated ? "abem-fill-flame" : undefined}
        style={animated ? { opacity: 0, animationDelay: "1.1s" } : undefined}
        opacity={animated ? undefined : 0.92}
      />
    </svg>
  );
}

export function LogoWordmark({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.35rem] font-semibold tracking-[0.18em] text-cream",
            textClassName
          )}
        >
          ABEM
        </span>
        <span className="text-[8.5px] font-semibold uppercase tracking-[0.42em] text-gold/90">
          Addis Ababa
        </span>
      </span>
    </span>
  );
}
