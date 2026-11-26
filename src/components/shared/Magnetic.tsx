"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

/* Magnetic hover wrapper (desktop pointers only). */
export default function Magnetic({
  children,
  className,
  strength = 0.32,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.5s cubic-bezier(0.2,0.9,0.3,1.4)";
    el.style.transform = "translate(0,0)";
    setTimeout(() => {
      if (el) el.style.transition = "transform 0.15s ease-out";
    }, 500);
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("inline-block will-change-transform", className)}>
      {children}
    </div>
  );
}
