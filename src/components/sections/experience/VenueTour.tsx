"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Reveal } from "@/components/shared/Primitives";

const SHOTS: {
  src: string;
  alt: string;
  caption: string;
  speed: [string, string];
  span: string;
  aspect: string;
}[] = [
  {
    src: "/images/interior.jpg",
    alt: "The Abem dining hall with woven mesob tables under warm light",
    caption: "The dining hall — mesobs under low gold light.",
    speed: ["-5%", "7%"],
    span: "lg:col-span-7",
    aspect: "aspect-[4/3]",
  },
  {
    src: "/images/gursha.jpg",
    alt: "Guests sharing gursha around a long communal table",
    caption: "The long tables — where gursha happens.",
    speed: ["8%", "-6%"],
    span: "lg:col-span-5 lg:mt-24",
    aspect: "aspect-[4/3]",
  },
  {
    src: "/images/hero-poster.jpg",
    alt: "The Abem garden at dusk with string lights over mesob tables",
    caption: "The garden at dusk — string lights, tej and the last song.",
    speed: ["-4%", "6%"],
    span: "lg:col-span-12",
    aspect: "aspect-[4/3] lg:aspect-[21/9]",
  },
];

export default function VenueTour() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [...SHOTS[0].speed]);
  const y2 = useTransform(scrollYProgress, [0, 1], [...SHOTS[1].speed]);
  const y3 = useTransform(scrollYProgress, [0, 1], [...SHOTS[2].speed]);
  const ys: MotionValue<string>[] = [y1, y2, y3];

  return (
    <section className="container-x py-24 md:py-32" aria-labelledby="tour-heading">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow eyebrow-center justify-center">The Venue · ቦታው</span>
        <h2 id="tour-heading" className="display-1 mt-4 text-foreground">
          Three rooms, one warmth.
          <span className="mt-2 block font-display-ethiopic text-[0.55em] text-gold/80">ሦስት ክፍሎች፣ አንድ ብርሃን</span>
        </h2>
        <p className="lead mt-5">
          From the ember-lit hall to the long tables to the garden at dusk — drift through the house as it actually feels at 8 PM.
        </p>
      </Reveal>

      <div ref={ref} className="mt-16 grid gap-6 lg:grid-cols-12">
        {SHOTS.map((s, i) => (
          <Reveal key={s.src} delay={i * 0.1} className={s.span}>
            <figure className="img-frame card-hover relative">
              <div className={`relative w-full ${s.aspect}`}>
                <motion.div style={{ y: ys[i] }} className="absolute inset-x-0 -inset-y-[9%]">
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="img-duotone object-cover"
                  />
                </motion.div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0b0705]/70 via-transparent to-transparent"
                />
                <figcaption className="glass absolute bottom-4 left-4 max-w-[85%] rounded-xl px-4 py-3 text-sm text-cream">
                  {s.caption}
                </figcaption>
              </div>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
