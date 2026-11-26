"use client";

import React, { useEffect, useRef } from "react";

/* EmberCanvas — drifting embers + steam wisps.
   Used as the hero's animated fallback when no video URL is set. */

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  life: number;
  maxLife: number;
  hue: number;
}

export default function EmberCanvas({ className, density = 0.9 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = (initial = false): Particle => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      r: 1 + Math.random() * 2.6,
      vy: 0.35 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.35,
      life: 0,
      maxLife: 220 + Math.random() * 220,
      hue: 18 + Math.random() * 26,
    });

    const count = Math.floor((w * h) / 16000 * density) + 24;
    particles = Array.from({ length: count }, () => spawn(true));

    const steam: { x: number; y: number; r: number; vy: number; life: number }[] = [];
    for (let i = 0; i < 6; i++) {
      steam.push({ x: w * (0.15 + Math.random() * 0.7), y: h * (0.7 + Math.random() * 0.3), r: 30 + Math.random() * 50, vy: 0.25 + Math.random() * 0.3, life: Math.random() * 400 });
    }

    let t = 0;
    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      if (!reduced) {
        /* embers */
        for (const p of particles) {
          p.life += 1;
          p.y -= p.vy;
          p.x += p.vx + Math.sin((t + p.maxLife) / 40) * 0.22;
          const fade = 1 - p.life / p.maxLife;
          if (fade <= 0 || p.y < -10) {
            Object.assign(p, spawn());
            continue;
          }
          const flick = 0.65 + Math.sin(t / 6 + p.x) * 0.35;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 58%, ${0.75 * fade * flick})`;
          ctx.shadowColor = `hsla(${p.hue}, 95%, 55%, 0.8)`;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        /* steam */
        for (const s of steam) {
          s.y -= s.vy;
          s.life += 1;
          if (s.y < -s.r * 2) {
            s.y = h + s.r;
            s.x = w * (0.15 + Math.random() * 0.7);
            s.life = 0;
          }
          const a = 0.05 + Math.sin(s.life / 90) * 0.03;
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
          grad.addColorStop(0, `rgba(244, 233, 216, ${a})`);
          grad.addColorStop(1, "rgba(244, 233, 216, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x + Math.sin(s.life / 50) * 14, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }

        raf = requestAnimationFrame(draw);
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
