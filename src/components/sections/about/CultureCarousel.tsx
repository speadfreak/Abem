"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { MoveHorizontal } from "lucide-react";
import { Reveal } from "@/components/shared/Primitives";

type CulturePanel = {
  image: string;
  alt: string;
  index: string;
  title: string;
  titleAm: string;
  copy: string;
};

const PANELS: CulturePanel[] = [
  {
    image: "/images/dishes/beyaynetu.jpg",
    alt: "Injera fresh off the mitad, topped with colorful wots",
    index: "01",
    title: "The mitad",
    titleAm: "ሚጣድ",
    copy: "Where every meal begins: teff batter, three days of patience, and a bread that lifts with a thousand eyes.",
  },
  {
    image: "/images/coffee-ceremony.jpg",
    alt: "A jebena pot pouring coffee during the buna ceremony",
    index: "02",
    title: "Buna, three cups",
    titleAm: "ቡና · ሶስት ስንክስ",
    copy: "Roast, brew, bless. Thirty unhurried minutes Ethiopians have perfected over centuries — ending only at baraka.",
  },
  {
    image: "/images/dishes/tibs.jpg",
    alt: "Lamb tibs sizzling in a clay shekla over charcoal",
    index: "03",
    title: "The shekla",
    titleAm: "ሸክላ",
    copy: "Clay over charcoal. Lamb tibs arrive still singing, rosemary and jalapeño riding the steam.",
  },
  {
    image: "/images/gursha.jpg",
    alt: "Hands sharing a large mesob platter of Ethiopian dishes",
    index: "04",
    title: "Gursha & the mesob",
    titleAm: "ጉርሻና መሶብ",
    copy: "One platter, many hands. Feeding another by hand turns dinner into an embrace — the heart of the Ethiopian table.",
  },
  {
    image: "/images/music.jpg",
    alt: "An azmari band performing with masinko and krar at night",
    index: "05",
    title: "Azmari nights",
    titleAm: "የአዝማሪ ምሽቶች",
    copy: "Masinko, krar and a verse that finds you. Fridays and Saturdays, the dining hall becomes a stage.",
  },
];

/**
 * Pinned horizontal culture gallery.
 * Desktop (md+, reduced-motion off): GSAP ScrollTrigger pins the section and
 * translates the track as you scroll. Mobile / reduced motion / no JS: a plain
 * swipeable horizontal row — the content is always reachable.
 */
export default function CultureCarousel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const canPin =
      window.matchMedia("(min-width: 768px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canPin) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
          gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: wrap,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
        }, wrap);

        cleanup = () => ctx.revert();
      } catch {
        /* GSAP unavailable — the static/swipeable row remains usable. */
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <section className="py-24 md:py-28" aria-labelledby="culture-heading">
      <div className="container-x">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow eyebrow-center justify-center">The Culture Row · ባህላችን</span>
          <h2 id="culture-heading" className="display-1 mt-4 text-foreground">
            Five rooms, one heritage.
          </h2>
          <p className="mt-5 hidden items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground md:flex">
            <MoveHorizontal className="h-4 w-4 text-gold" aria-hidden="true" />
            Keep scrolling — the row moves with you
          </p>
          <p className="lead mt-5 md:hidden">Swipe through the rituals that built this house.</p>
        </Reveal>
      </div>

      <div
        ref={wrapRef}
        className="no-scrollbar mt-12 flex items-center overflow-x-auto md:mt-0 md:h-screen md:overflow-hidden"
      >
        <div
          ref={trackRef}
          className="flex w-max items-stretch gap-5 px-5 py-2 will-change-transform sm:px-8 md:items-center md:py-0 md:pr-[12vw]"
        >
          {PANELS.map((p) => (
            <figure
              key={p.index}
              className="card-elevated card-hover relative flex w-[80vw] shrink-0 flex-col overflow-hidden sm:w-[62vw] md:h-[58vh] md:w-[42vw] lg:w-[34vw]"
            >
              <div className="relative aspect-[4/3] w-full md:h-[62%] md:aspect-auto">
                <Image
                  src={p.image}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 62vw, 34vw"
                  className="img-duotone object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-4 rounded-full border border-gold/40 bg-[#0b0705]/70 px-3 py-1 font-display text-sm text-gold backdrop-blur-sm"
                >
                  {p.index}
                </span>
              </div>
              <figcaption className="flex flex-1 flex-col p-6">
                <h3 className="display-3 text-cream">
                  {p.title}
                  <span className="am-text ml-2 text-base font-normal text-gold/80" lang="am">
                    {p.titleAm}
                  </span>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.copy}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
