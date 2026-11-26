"use client";

import { Trophy, Flame, Users } from "lucide-react";
import { Counter, Marquee, Reveal } from "@/components/shared/Primitives";
import type { LucideIcon } from "lucide-react";

type Stat = { icon: LucideIcon; to: number; suffix: string; label: string };

const STATS: Stat[] = [
  { icon: Trophy, to: 18, suffix: "", label: "Culinary awards & guide mentions" },
  { icon: Flame, to: 15, suffix: "", label: "Years of unbroken fire" },
  { icon: Users, to: 250, suffix: "k+", label: "Guests served since 2011" },
];

const HONOURS = [
  "Best Burger in Addis — Addis Dining Awards",
  "Wood-Fired Pizza of the Year",
  "Travel & Leisure — top tables of Addis",
  "Gursha Hospitality Prize",
  "Best Late-Night Kitchen — Bole Guide",
  "Ceremonial Coffee House of the Year",
];

export default function AwardsStrip() {
  return (
    <section className="py-24 md:py-28" aria-labelledby="awards-heading">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow eyebrow-center justify-center">Recognition · ሽሎታት</span>
          <h2 id="awards-heading" className="display-1 mt-4 text-foreground">
            The fire keeps score.
          </h2>
        </Reveal>

        <dl className="mt-14 grid gap-10 sm:grid-cols-3 md:mt-16">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.12} className="text-center">
              <div className="relative mx-auto flex h-full flex-col items-center">
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <dt className="order-2 mt-3 max-w-[22ch] text-sm text-muted-foreground">{s.label}</dt>
                <dd className="display-1 gold-text order-1" aria-label={`${s.to}${s.suffix}`}>
                  <Counter to={s.to} suffix={s.suffix} />
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>

      <Reveal className="mt-16" y={16}>
        <Marquee
          className="border-y border-gold/10 bg-surface/70 py-5"
          itemClassName="text-[12px] font-semibold uppercase tracking-[0.22em] text-gold/80"
          items={HONOURS}
        />
      </Reveal>
    </section>
  );
}
