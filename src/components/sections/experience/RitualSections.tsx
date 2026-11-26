"use client";

import Image from "next/image";
import { Drum, Music, GlassWater, Flame } from "lucide-react";
import { Reveal } from "@/components/shared/Primitives";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type RitualStep = { n: string; name: string; copy: string };

type Ritual = {
  id: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  titleAm: string;
  image: string;
  alt: string;
  paragraphs: string[];
  steps?: RitualStep[];
  chips?: string[];
};

const RITUALS: Ritual[] = [
  {
    id: "buna",
    eyebrow: "Ritual 01 · ቡና",
    icon: Flame,
    title: "The buna ceremony",
    titleAm: "የቡና ሥርዓት",
    image: "/images/coffee-ceremony.jpg",
    alt: "Green coffee beans roasting in a pan over coals at a guest's table",
    paragraphs: [
      "Coffee was born a day's drive south of this table, so we treat it accordingly — as choreography, not as a menu line. The ceremony runs tableside all day, unhurried, thirty minutes from green bean to third cup.",
    ],
    steps: [
      { n: "01", name: "Roast", copy: "Green beans washed and roasted in a shallow pan at your table — pulled at the first crack, the smoke folded across the room so you can breathe it." },
      { n: "02", name: "Brew", copy: "Ground by hand, brewed in the jebena, and poured from a height in one unbroken stream into small sini cups." },
      { n: "03", name: "Three cups", copy: "Abol, tona, baraka — the third cup is said to confer a blessing. Leaving before it is, politely, impossible." },
    ],
  },
  {
    id: "gursha",
    eyebrow: "Ritual 02 · ጉርሻ",
    icon: Music,
    title: "Gursha, the shared bite",
    titleAm: "ጉርሻ",
    image: "/images/gursha.jpg",
    alt: "A hand offering a gursha — a rolled bite of injera and wot — across the table",
    paragraphs: [
      "One injera, many hands. Gursha — feeding a companion by hand — is Ethiopia's oldest love language, spoken at weddings, reconciliations and ordinary Tuesdays alike.",
      "At Abem, first-timers get a gentle initiation: your waiter will offer, and you may accept. It is not unusual to see a whole table — strangers an hour ago — feeding each other before dessert.",
    ],
  },
  {
    id: "azmari",
    eyebrow: "Ritual 03 · ሙዚቃ",
    icon: Drum,
    title: "Azmari live music nights",
    titleAm: "የአዝማሪ ምሽቶች",
    image: "/images/music.jpg",
    alt: "Azmari musicians performing with masinko and krar under warm lights",
    paragraphs: [
      "Every weekend the masinko and krar come out, and the dining hall becomes a stage. Azmari verse is improvised — tonight's song will be about you, if you sit close enough.",
    ],
    chips: ["Fri · 8:00 PM — Full band, till late", "Sat · 8:00 PM — Krar duo & open request night"],
  },
  {
    id: "tej",
    eyebrow: "Ritual 04 · ጠጅ",
    icon: GlassWater,
    title: "Tej & the berele",
    titleAm: "ጠጅና በረሌ",
    image: "/images/tej.jpg",
    alt: "Golden tej honey wine served in a round-bellied berele flask",
    paragraphs: [
      "Honey wine in the berele — the round-bellied flask that keeps the sediment back and the conversation flowing. Ours is brewed in-house: dry, lightly smoky, served cool in small glasses made for sharing.",
      "Ask for the tej flight — three house styles side by side — and let the waiter teach you the pour.",
    ],
  },
];

export default function RitualSections() {
  return (
    <div>
      {RITUALS.map((r, i) => {
        const flip = i % 2 === 1;
        return (
          <section
            key={r.id}
            id={r.id}
            className="container-x py-20 md:py-28"
            aria-labelledby={`${r.id}-heading`}
          >
            <div className={cn("grid items-center gap-10 lg:grid-cols-2 lg:gap-16", flip && "lg:[&>*:first-child]:order-2")}>
              <Reveal>
                <div className="img-frame relative aspect-[4/3] w-full">
                  <Image
                    src={r.image}
                    alt={r.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="img-duotone object-cover"
                  />
                </div>
              </Reveal>

              <div>
                <Reveal delay={0.08}>
                  <span className="eyebrow">
                    <r.icon className="h-4 w-4 text-gold" aria-hidden="true" />
                    {r.eyebrow}
                  </span>
                  <h2 id={`${r.id}-heading`} className="display-1 mt-4 text-foreground">
                    {r.title}
                    <span className="mt-2 block font-display-ethiopic text-[0.5em] text-gold/80" lang="am">
                      {r.titleAm}
                    </span>
                  </h2>
                  {r.paragraphs.map((p) => (
                    <p key={p.slice(0, 24)} className="lead mt-5">
                      {p}
                    </p>
                  ))}
                </Reveal>

                {r.steps ? (
                  <ol className="mt-8 grid gap-4 sm:grid-cols-3">
                    {r.steps.map((s, j) => (
                      <Reveal key={s.n} delay={0.12 + j * 0.1}>
                        <div className="glass h-full rounded-xl p-5">
                          <span className="font-display text-2xl gold-text">{s.n}</span>
                          <h3 className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-cream">{s.name}</h3>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.copy}</p>
                        </div>
                      </Reveal>
                    ))}
                  </ol>
                ) : null}

                {r.chips ? (
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    {r.chips.map((c, j) => (
                      <Reveal key={c} delay={0.12 + j * 0.1}>
                        <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                          {c}
                        </span>
                      </Reveal>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
