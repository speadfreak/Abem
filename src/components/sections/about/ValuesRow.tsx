"use client";

import { Flame, Sparkles, HandHeart } from "lucide-react";
import { Reveal } from "@/components/shared/Primitives";
import type { LucideIcon } from "lucide-react";

type Value = {
  icon: LucideIcon;
  name: string;
  am: string;
  copy: string;
};

const VALUES: Value[] = [
  {
    icon: Flame,
    name: "Slow fire",
    am: "ቀስ ብሎ እሳት",
    copy: "Doro wot for six hours. Kitfo hand-chopped to order. Nothing leaves this kitchen in a hurry — because nothing worth eating ever is.",
  },
  {
    icon: Sparkles,
    name: "Real spices",
    am: "እውነተኛ ቅመም",
    copy: "Sixteen spices, toasted and ground in-house every Monday. No paste from a bag, no shortcuts — the market women of Merkato know us by name.",
  },
  {
    icon: HandHeart,
    name: "Gursha hospitality",
    am: "የጉርሻ እንግዳ ተቀባይነት",
    copy: "To feed someone by hand is to say: you are family. Every guest gets the welcome of a highland home — and, in time, the third cup of buna.",
  },
];

export default function ValuesRow() {
  return (
    <div className="mt-14 grid gap-6 md:grid-cols-3">
      {VALUES.map((v, i) => (
        <Reveal key={v.name} delay={i * 0.12}>
          <article className="card-elevated card-hover h-full p-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <v.icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="display-3 mt-6 text-cream">{v.name}</h3>
            <p className="am-text mt-1 text-sm text-gold/80" lang="am">
              {v.am}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{v.copy}</p>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
