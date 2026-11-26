"use client";

import Image from "next/image";
import { Reveal, SectionHeading } from "@/components/shared/Primitives";

const SHOTS = [
  {
    src: "/images/events.jpg",
    alt: "A garden wedding with decorated mesobs under string lights",
    caption: "A 200-guest garden wedding, last Meskel",
  },
  {
    src: "/images/music.jpg",
    alt: "Azmari band performing for a packed dining hall",
    caption: "Azmari night — the full band, week 112 and counting",
  },
  {
    src: "/images/interior.jpg",
    alt: "The dining hall set for a corporate mesob dinner",
    caption: "Corporate mesob for 60 — a product launch that ran on doro wot",
  },
  {
    src: "/images/gursha.jpg",
    alt: "Hands sharing gursha across a long family table",
    caption: "The long table at Family Gursha Sunday",
  },
];

export default function PastEvents() {
  return (
    <section className="container-x pb-24 md:pb-32" aria-labelledby="past-heading">
      <SectionHeading
        eyebrow="Recently, at Abem · ያለፉ"
        title="Nights we are still talking about."
        titleAm="የማይረሱ ምሽቶች"
        description="A few frames from the last season of weddings, launches and long-table Sundays."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SHOTS.map((s, i) => (
          <Reveal key={s.src} delay={i * 0.08}>
            <figure>
              <div className="img-frame card-hover relative aspect-[4/5] overflow-hidden">
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="img-duotone object-cover transition-transform duration-700 hover:scale-105"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b0705]/85 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-xs font-medium text-cream">{s.caption}</figcaption>
              </div>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
